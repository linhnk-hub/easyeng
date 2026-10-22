import React, { useState, useRef } from 'react';
import {
  X,
  Lock,
  Unlock,
  Settings,
  Users,
  GraduationCap,
  Code2,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
  SlidersHorizontal,
  Monitor,
  Maximize2,
  CloudUpload,
  Cloud,
  FileText,
  FolderPlus,
  BookOpen,
  Phone,
  Mail,
  User,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { UserProfile, UnitData, ExerciseCluster, PasswordResetRequest, AccountVerificationRequest } from '../types';
import { AVATARS } from '../data/unitsData';
import { soundEffects } from '../services/soundEffects';
import { renderAvatarContent, CustomAvatarItem } from '../utils/avatarUtils';
import { getGradeLevelName, getDefaultGradeEmoji, getDefaultGradeDescription, ALL_12_GRADES } from '../utils/gradeUtils';
import { clearAppCache } from '../utils/cacheUtils';
import { parseExerciseJson, createDefaultClusters, createEmptyCluster, BUILT_IN_WORKBOOK_TEMPLATES } from '../utils/exerciseUtils';
import { EasyEngLogo } from './EasyEngLogo';
import {
  resolveValidUsername,
  generateDefaultUsernameFromName,
  validatePassword,
  validateNickname,
  validateFullName,
  validateUsername
} from '../utils/userUtils';
import {
  fetchPasswordResetRequestsFromCloud,
  deletePasswordResetRequestFromCloud,
  fetchAccountVerificationRequestsFromCloud,
  deleteAccountVerificationRequestFromCloud,
  clearAccountActiveSession
} from '../services/firebase';

const ADMIN_EMAIL = 'linhnk.online@gmail.com';

interface AdminClassInfo {
  grade: number;
  name: string;
  description: string;
  emoji: string;
}

interface AdminManagerModalProps {
  learners: UserProfile[];
  classes: AdminClassInfo[];
  customAvatars: CustomAvatarItem[];
  gradeUnitsMap: Record<number, UnitData[]>;
  onUpdateLearner: (learner: UserProfile) => void;
  onAddLearner: (learner: UserProfile) => void;
  onDeleteLearner: (learnerId: string) => void;
  onAddCustomAvatar: (newAvatar: CustomAvatarItem) => void;
  onDeleteCustomAvatar: (avatarId: string) => void;
  onAddClass: (newClass: AdminClassInfo, initialUnits: UnitData[]) => void;
  onDeleteClass: (grade: number) => void;
  onSaveCurriculum: (grade: number, units: UnitData[]) => void;
  onResetCurriculum: (grade: number) => void;
  onClose: () => void;
  customLogo?: string | null;
  onUpdateLogo?: (newLogo: string | null) => void;
  headerLogoSize?: number;
  welcomeLogoSize?: number;
  onSaveLogoSizes?: (headerSize: number, welcomeSize: number) => void;
  onSaveBranding?: (logo: string | null, headerSize: number, welcomeSize: number) => Promise<boolean> | void;
  gradeExercisesMap?: Record<number, ExerciseCluster[]>;
  onSaveExercises?: (grade: number, clusters: ExerciseCluster[]) => Promise<boolean> | void;
}

// Multi-layer Cryptographic Hashing for Admin Password Verification:
// - Layer 1: Salted SHA-256 pre-hash with cryptographic pepper
// - Layer 2: PBKDF2 key derivation using HMAC-SHA-512 with 100,000 iterations
// - Layer 3: SHA-384 finalized cryptographic digest
// - Layer 4: Constant-time string comparison to resist timing analysis
// View-source proof: Mathematically one-way non-invertible; plaintext password cannot be decoded or reversed.
const SECURE_PEPPER_L1 = 'EasyEng_Vothisau_Pepper_9a8b7c6d5e4f3a2b1c0d';
const SECURE_SALT_L2 = 'EasyEng_Admin_PBKDF2_Salt_2026_x87y21z99';
const SECURE_PBKDF2_ROUNDS = 100000;
const SECURE_AUTH_DIGEST = '323b367a1c0e87feab70782941692c268fdff09fdee99e15909534c307cd247ff8a2f0f90fc1ff9d4bf8f089a513708a';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifySecurityKey(input: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();

    // Layer 1: Salted SHA-256 pre-hash
    const l1Data = encoder.encode(`${input}:${SECURE_PEPPER_L1}`);
    const l1Buffer = await crypto.subtle.digest('SHA-256', l1Data);

    // Layer 2: PBKDF2 HMAC-SHA-512 with 100,000 rounds (512-bit key derivation)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      l1Buffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const saltL2Buffer = encoder.encode(SECURE_SALT_L2);
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltL2Buffer,
        iterations: SECURE_PBKDF2_ROUNDS,
        hash: 'SHA-512'
      },
      keyMaterial,
      512
    );

    // Layer 3: SHA-384 finalized digest
    const finalBuffer = await crypto.subtle.digest('SHA-384', derivedBits);
    const hashArray = Array.from(new Uint8Array(finalBuffer));
    const computedHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Layer 4: Constant-time comparison
    return constantTimeEqual(computedHex, SECURE_AUTH_DIGEST);
  } catch {
    return false;
  }
}

export const AdminManagerModal: React.FC<AdminManagerModalProps> = ({
  learners,
  classes,
  customAvatars,
  gradeUnitsMap,
  onUpdateLearner,
  onAddLearner,
  onDeleteLearner,
  onAddCustomAvatar,
  onDeleteCustomAvatar,
  onAddClass,
  onDeleteClass,
  onSaveCurriculum,
  onResetCurriculum,
  onClose,
  customLogo,
  onUpdateLogo,
  headerLogoSize = 200,
  welcomeLogoSize = 300,
  onSaveLogoSizes,
  onSaveBranding,
  gradeExercisesMap = {},
  onSaveExercises
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [clearCacheNotice, setClearCacheNotice] = useState<string | null>(null);

  const handleClearCacheFromLogin = async () => {
    soundEffects.playClick();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ nhớ đệm (Cache) trên thiết bị này không? Sau khi xóa, trang web sẽ làm mới để đồng bộ lại dữ liệu mới nhất từ cơ sở dữ liệu.')) {
      return;
    }
    setIsClearingCache(true);
    try {
      await clearAppCache({
        clearBrowserCache: true,
        clearSessionStorage: true,
        clearActiveSession: true,
        resetAllData: true
      });
      setClearCacheNotice('Đã dọn dẹp bộ nhớ đệm thành công! Đang tải lại...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch {
      setIsClearingCache(false);
      window.location.reload();
    }
  };

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'learners' | 'classes' | 'curriculum' | 'branding' | 'resets' | 'verifications'>('learners');

  // Password Reset Requests submitted to admin (linhnk.online@gmail.com)
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoadingResetRequests, setIsLoadingResetRequests] = useState(false);

  // Account Verification Requests submitted to admin (linhnk.online@gmail.com)
  const [verificationRequests, setVerificationRequests] = useState<AccountVerificationRequest[]>([]);
  const [isLoadingVerificationRequests, setIsLoadingVerificationRequests] = useState(false);
  const [unlockedSessionMsg, setUnlockedSessionMsg] = useState<string | null>(null);

  // Load password reset requests & account verification requests
  React.useEffect(() => {
    setIsLoadingResetRequests(true);
    fetchPasswordResetRequestsFromCloud().then(reqs => {
      setResetRequests(reqs);
      setIsLoadingResetRequests(false);
    }).catch(err => {
      console.warn('Load reset requests error:', err);
      setIsLoadingResetRequests(false);
    });

    setIsLoadingVerificationRequests(true);
    fetchAccountVerificationRequestsFromCloud().then(reqs => {
      setVerificationRequests(reqs);
      setIsLoadingVerificationRequests(false);
    }).catch(err => {
      console.warn('Load verification requests error:', err);
      setIsLoadingVerificationRequests(false);
    });
  }, []);

  // Staged Branding & Sizing state (Draft changes that require clicking "Lưu" to take effect)
  const [stagedLogo, setStagedLogo] = useState<string | null>(customLogo ?? null);
  const [stagedHeaderLogoSize, setStagedHeaderLogoSize] = useState<number>(headerLogoSize);
  const [stagedWelcomeLogoSize, setStagedWelcomeLogoSize] = useState<number>(welcomeLogoSize);
  const [isSavingBranding, setIsSavingBranding] = useState<boolean>(false);
  const [logoNotice, setLogoNotice] = useState<string | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedBrandingChanges =
    stagedLogo !== (customLogo ?? null) ||
    stagedHeaderLogoSize !== (headerLogoSize ?? 200) ||
    stagedWelcomeLogoSize !== (welcomeLogoSize ?? 300);

  // Sync staged state when external props update if user hasn't made unsaved edits
  React.useEffect(() => {
    if (!hasUnsavedBrandingChanges) {
      setStagedLogo(customLogo ?? null);
      setStagedHeaderLogoSize(headerLogoSize);
      setStagedWelcomeLogoSize(welcomeLogoSize);
    }
  }, [customLogo, headerLogoSize, welcomeLogoSize, hasUnsavedBrandingChanges]);

  // Compress image file to max 400x400 canvas, auto-trimming transparent empty padding around logo
  const compressLogoFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // First draw on raw canvas to detect and trim transparent margins
          const rawCanvas = document.createElement('canvas');
          rawCanvas.width = img.width;
          rawCanvas.height = img.height;
          const rawCtx = rawCanvas.getContext('2d');
          let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;

          if (rawCtx) {
            rawCtx.drawImage(img, 0, 0);
            try {
              const imgData = rawCtx.getImageData(0, 0, img.width, img.height);
              const data = imgData.data;
              let minX = img.width, minY = img.height, maxX = -1, maxY = -1;
              for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                  const alpha = data[(y * img.width + x) * 4 + 3];
                  if (alpha > 15) { // non-transparent pixel
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                  }
                }
              }
              // If non-transparent pixels found, crop tightly with small 2px buffer
              if (maxX >= minX && maxY >= minY) {
                cropX = Math.max(0, minX - 2);
                cropY = Math.max(0, minY - 2);
                cropW = Math.min(img.width - cropX, (maxX - minX + 1) + 4);
                cropH = Math.min(img.height - cropY, (maxY - minY + 1) + 4);
              }
            } catch {
              // Ignore canvas read error (CORS/tainted)
            }
          }

          const MAX_DIM = 400; // 400px ensures crisp resolution for 300px display
          let targetWidth = cropW;
          let targetHeight = cropH;
          if (targetWidth > MAX_DIM || targetHeight > MAX_DIM) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * MAX_DIM) / targetWidth);
              targetWidth = MAX_DIM;
            } else {
              targetWidth = Math.round((targetWidth * MAX_DIM) / targetHeight);
              targetHeight = MAX_DIM;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight);
          let dataUrl = canvas.toDataURL('image/png');
          // If PNG exceeds 500KB, use WebP or JPEG compression to ensure Firestore document size limit is never exceeded
          if (dataUrl.length > 500000) {
            try {
              const webp = canvas.toDataURL('image/webp', 0.88);
              if (webp.startsWith('data:image/webp') && webp.length < dataUrl.length) {
                dataUrl = webp;
              } else {
                dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              }
            } catch {
              // fallback to png
            }
          }
          resolve(dataUrl);
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSaveAllBranding = async () => {
    setIsSavingBranding(true);
    soundEffects.playClick();
    try {
      let syncOk = true;
      if (onSaveBranding) {
        const res = await onSaveBranding(stagedLogo, stagedHeaderLogoSize, stagedWelcomeLogoSize);
        if (res === false) {
          syncOk = false;
        }
      } else {
        onUpdateLogo?.(stagedLogo);
        onSaveLogoSizes?.(stagedHeaderLogoSize, stagedWelcomeLogoSize);
      }
      if (syncOk) {
        soundEffects.playSuccess();
        setLogoNotice('Đã lưu thành công logo và kích thước lên CSDL Cloud Firestore! Tất cả thiết bị sẽ được cập nhật đồng bộ.');
        setTimeout(() => setLogoNotice(null), 4500);
      } else {
        soundEffects.playError();
        setLogoNotice('Đã lưu cấu hình logo trên thiết bị này, nhưng chưa đồng bộ được lên CSDL đám mây (hãy kiểm tra kết nối mạng).');
        setTimeout(() => setLogoNotice(null), 5000);
      }
    } catch {
      setLogoNotice('Đã lưu cấu hình logo trên thiết bị này.');
      setTimeout(() => setLogoNotice(null), 3500);
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleRevertStagedBranding = () => {
    soundEffects.playClick();
    setStagedLogo(customLogo ?? null);
    setStagedHeaderLogoSize(headerLogoSize ?? 200);
    setStagedWelcomeLogoSize(welcomeLogoSize ?? 300);
    setLogoUrlInput('');
    setLogoNotice('Đã hoàn tác các thay đổi chưa lưu.');
    setTimeout(() => setLogoNotice(null), 2500);
  };

  const handleResetSizesToDefault = () => {
    soundEffects.playClick();
    setStagedHeaderLogoSize(200);
    setStagedWelcomeLogoSize(300);
  };

  // Learners Tab editing state (3 pieces of user info: 1. Họ tên, 2. Nickname, 3. Tên đăng nhập)
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editGrade, setEditGrade] = useState<number>(4);
  const [editAvatar, setEditAvatar] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPinConfirm, setEditPinConfirm] = useState('');
  const [editPinError, setEditPinError] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Add Learner state
  const [isAddingLearner, setIsAddingLearner] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newGrade, setNewGrade] = useState<number>(4);
  const [newAvatar, setNewAvatar] = useState('fox');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [newPinError, setNewPinError] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFormError, setNewFormError] = useState<string | null>(null);

  // Avatar upload state
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState<string | null>(null);

  // Add Class state
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassGrade, setNewClassGrade] = useState<number>(1);

  // Curriculum JSON Tab state
  const [selectedJsonGrade, setSelectedJsonGrade] = useState<number>(classes[0]?.grade || 4);
  const [jsonContent, setJsonContent] = useState<string>(() => {
    const initialUnits = gradeUnitsMap[classes[0]?.grade || 4] || [];
    return JSON.stringify(initialUnits, null, 2);
  });
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonSuccess, setJsonSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exercise Clusters JSON Tab state
  const [jsonSubTab, setJsonSubTab] = useState<'curriculum' | 'exercises'>('curriculum');
  const [selectedExerciseGrade, setSelectedExerciseGrade] = useState<number>(classes[0]?.grade || 4);
  const [exerciseClustersMap, setExerciseClustersMap] = useState<Record<number, ExerciseCluster[]>>(() => {
    return gradeExercisesMap || {};
  });
  const [exerciseSaveSuccess, setExerciseSaveSuccess] = useState<string | null>(null);
  const [exerciseSaveError, setExerciseSaveError] = useState<string | null>(null);
  const [isSavingExercises, setIsSavingExercises] = useState(false);
  const [hasUnsavedExerciseChanges, setHasUnsavedExerciseChanges] = useState<boolean>(false);

  // Modal Load JSON for a specific cluster
  const [clusterJsonModal, setClusterJsonModal] = useState<{
    clusterIndex: number;
    title: string;
    description?: string;
    rawText: string;
    detectedCount: number;
    error: string | null;
  } | null>(null);
  const [copiedJsonSuccess, setCopiedJsonSuccess] = useState(false);
  const clusterFileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentGradeClusters = (): ExerciseCluster[] => {
    const list = exerciseClustersMap[selectedExerciseGrade];
    if (list !== undefined) return list;
    if (gradeExercisesMap && gradeExercisesMap[selectedExerciseGrade] !== undefined) {
      return gradeExercisesMap[selectedExerciseGrade];
    }
    return createDefaultClusters(selectedExerciseGrade, 4);
  };

  const handleSelectExerciseGrade = (grade: number) => {
    if (hasUnsavedExerciseChanges) {
      if (!window.confirm(`Dữ liệu bài tập Lớp ${selectedExerciseGrade} đang có thay đổi chưa lưu. Bạn có muốn chuyển sang Lớp ${grade} mà không lưu không?`)) {
        return;
      }
    }
    setSelectedExerciseGrade(grade);
    setHasUnsavedExerciseChanges(false);
    setExerciseSaveSuccess(null);
    setExerciseSaveError(null);
    if (exerciseClustersMap[grade] === undefined) {
      setExerciseClustersMap(prev => ({
        ...prev,
        [grade]: (gradeExercisesMap && gradeExercisesMap[grade] !== undefined)
          ? gradeExercisesMap[grade]
          : createDefaultClusters(grade, 4)
      }));
    }
  };

  const handleSetClusterCount = (newCount: number) => {
    soundEffects.playClick();
    const current = getCurrentGradeClusters();
    if (newCount === current.length) return;
    if (newCount > current.length) {
      const added: ExerciseCluster[] = [...current];
      for (let i = current.length + 1; i <= newCount; i++) {
        added.push(createEmptyCluster(i, selectedExerciseGrade));
      }
      setExerciseClustersMap(prev => ({ ...prev, [selectedExerciseGrade]: added }));
      setHasUnsavedExerciseChanges(true);
    } else {
      const confirmPrompt = newCount === 0
        ? `Bạn có chắc chắn muốn xóa toàn bộ học phần bài tập Lớp ${selectedExerciseGrade} không?`
        : `Bạn có chắc chắn muốn giảm số lượng học phần xuống ${newCount} học phần không? Các học phần phía sau sẽ bị lược bỏ.`;
      if (window.confirm(confirmPrompt)) {
        const sliced = current.slice(0, newCount);
        setExerciseClustersMap(prev => ({ ...prev, [selectedExerciseGrade]: sliced }));
        setHasUnsavedExerciseChanges(true);
      }
    }
  };

  const handleLoadOfficialGrade4Workbooks = () => {
    soundEffects.playClick();
    const defaults = createDefaultClusters(4, 4);
    setExerciseClustersMap(prev => ({
      ...prev,
      [4]: defaults
    }));
    setHasUnsavedExerciseChanges(true);
    setExerciseSaveSuccess('Đã nạp 4 học phần Sách bài tập Lớp 4 chuẩn (833 câu hỏi) vào biểu mẫu. Hãy nhấn nút "Lưu dữ liệu bài tập Lớp 4" bên dưới để áp dụng có hiệu lực!');
  };

  const handleLoadOfficialGrade7Workbooks = () => {
    soundEffects.playClick();
    const defaults = createDefaultClusters(7, 4);
    setExerciseClustersMap(prev => ({
      ...prev,
      [7]: defaults
    }));
    setHasUnsavedExerciseChanges(true);
    setExerciseSaveSuccess('Đã nạp 4 học phần Sách bài tập Lớp 7 chuẩn (910 câu hỏi) vào biểu mẫu. Hãy nhấn nút "Lưu dữ liệu bài tập Lớp 7" bên dưới để áp dụng có hiệu lực!');
  };

  const handleAddCluster = () => {
    soundEffects.playClick();
    const current = getCurrentGradeClusters();
    const nextNum = current.length + 1;
    const newCluster = createEmptyCluster(nextNum, selectedExerciseGrade);
    const updated = [...current, newCluster];
    setExerciseClustersMap(prev => ({
      ...prev,
      [selectedExerciseGrade]: updated
    }));
    setHasUnsavedExerciseChanges(true);
  };

  const handleDeleteCluster = (clusterIdx: number) => {
    soundEffects.playClick();
    const current = getCurrentGradeClusters();
    if (window.confirm(`Bạn có chắc muốn xóa Học phần ${clusterIdx + 1}?`)) {
      const filtered = current.filter((_, idx) => idx !== clusterIdx).map((c, idx) => ({
        ...c,
        clusterNumber: idx + 1
      }));
      setExerciseClustersMap(prev => ({
        ...prev,
        [selectedExerciseGrade]: filtered
      }));
      setHasUnsavedExerciseChanges(true);
    }
  };

  const handleDeleteAllClusters = () => {
    soundEffects.playClick();
    const current = getCurrentGradeClusters();
    if (current.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa TOÀN BỘ ${current.length} học phần bài tập của Lớp ${selectedExerciseGrade} không?`)) {
      setExerciseClustersMap(prev => ({
        ...prev,
        [selectedExerciseGrade]: []
      }));
      setHasUnsavedExerciseChanges(true);
      setExerciseSaveSuccess(`Đã xóa tất cả học phần bài tập Lớp ${selectedExerciseGrade}. Hãy bấm nút Lưu để áp dụng lên hệ thống.`);
    }
  };

  const handleClusterTitleChange = (clusterIdx: number, newTitle: string) => {
    const current = getCurrentGradeClusters();
    const updated = [...current];
    if (updated[clusterIdx]) {
      updated[clusterIdx] = { ...updated[clusterIdx], title: newTitle };
      setExerciseClustersMap(prev => ({ ...prev, [selectedExerciseGrade]: updated }));
      setHasUnsavedExerciseChanges(true);
    }
  };

  const handleClusterDescChange = (clusterIdx: number, newDesc: string) => {
    const current = getCurrentGradeClusters();
    const updated = [...current];
    if (updated[clusterIdx]) {
      // Cho phép để trống (rỗng "") mô tả mà không bị reset
      updated[clusterIdx] = { ...updated[clusterIdx], description: newDesc };
      setExerciseClustersMap(prev => ({ ...prev, [selectedExerciseGrade]: updated }));
      setHasUnsavedExerciseChanges(true);
    }
  };

  const handleOpenLoadJson = (clusterIdx: number) => {
    soundEffects.playClick();
    const current = getCurrentGradeClusters();
    const target = current[clusterIdx];
    if (!target) return;
    let initialText = target.rawJson || '';
    if (!initialText && target.questions && target.questions.length > 0) {
      initialText = JSON.stringify(target.questions, null, 2);
    }
    const check = initialText ? parseExerciseJson(initialText, clusterIdx + 1, selectedExerciseGrade) : null;
    const detectedCount = check ? check.cluster.questions.length : (target.questions?.length || 0);

    setCopiedJsonSuccess(false);
    setClusterJsonModal({
      clusterIndex: clusterIdx,
      title: target.title,
      description: target.description !== undefined ? target.description : '',
      rawText: initialText,
      detectedCount,
      error: check?.error || null
    });
  };

  const handleCopyClusterJson = async () => {
    if (!clusterJsonModal?.rawText) return;
    soundEffects.playClick();
    try {
      await navigator.clipboard.writeText(clusterJsonModal.rawText);
      setCopiedJsonSuccess(true);
      setTimeout(() => setCopiedJsonSuccess(false), 2000);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = clusterJsonModal.rawText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedJsonSuccess(true);
        setTimeout(() => setCopiedJsonSuccess(false), 2000);
      } catch {
        // Fallback
      }
    }
  };

  const handleClusterJsonTextChange = (text: string) => {
    if (!clusterJsonModal) return;
    setCopiedJsonSuccess(false);
    const parsedRes = parseExerciseJson(text, clusterJsonModal.clusterIndex + 1, selectedExerciseGrade);
    setClusterJsonModal({
      ...clusterJsonModal,
      rawText: text,
      detectedCount: parsedRes.cluster.questions?.length || 0,
      error: parsedRes.error || null
    });
  };

  const handleClusterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clusterJsonModal) return;
    soundEffects.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleClusterJsonTextChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyClusterJson = () => {
    if (!clusterJsonModal) return;
    const { clusterIndex, rawText, title, description } = clusterJsonModal;
    const parsedRes = parseExerciseJson(rawText, clusterIndex + 1, selectedExerciseGrade);
    if (parsedRes.cluster.questions.length === 0 && parsedRes.error) {
      soundEffects.playError();
      return;
    }
    soundEffects.playSuccess();
    const current = getCurrentGradeClusters();
    const updated = [...current];

    // Giữ nguyên tiêu đề và mô tả người dùng đã nhập (kể cả khi mô tả để trống "")
    const finalTitle = title && title.trim() ? title : (parsedRes.cluster.title || current[clusterIndex]?.title);
    const finalDesc = description !== undefined ? description : (parsedRes.cluster.description || '');

    updated[clusterIndex] = {
      ...parsedRes.cluster,
      title: finalTitle,
      description: finalDesc,
      clusterNumber: clusterIndex + 1
    };
    setExerciseClustersMap(prev => ({
      ...prev,
      [selectedExerciseGrade]: updated
    }));
    setHasUnsavedExerciseChanges(true);
    setClusterJsonModal(null);
    setExerciseSaveSuccess(`Đã nạp ${parsedRes.cluster.questions.length} câu hỏi vào Học phần ${clusterIndex + 1}! Hãy bấm nút "Lưu dữ liệu bài tập Lớp ${selectedExerciseGrade}" bên dưới để có hiệu lực.`);
  };

  const handleResetExerciseDraft = () => {
    soundEffects.playClick();
    const original = (gradeExercisesMap && gradeExercisesMap[selectedExerciseGrade] !== undefined)
      ? gradeExercisesMap[selectedExerciseGrade]
      : createDefaultClusters(selectedExerciseGrade, 4);
    setExerciseClustersMap(prev => ({
      ...prev,
      [selectedExerciseGrade]: JSON.parse(JSON.stringify(original))
    }));
    setHasUnsavedExerciseChanges(false);
    setExerciseSaveSuccess('Đã hủy các thay đổi chưa lưu và khôi phục dữ liệu đã lưu gần nhất.');
    setTimeout(() => setExerciseSaveSuccess(null), 4000);
  };

  const handleSaveAllExerciseClusters = async () => {
    soundEffects.playClick();
    setIsSavingExercises(true);
    setExerciseSaveSuccess(null);
    setExerciseSaveError(null);
    try {
      const current = getCurrentGradeClusters();
      const ok = await onSaveExercises?.(selectedExerciseGrade, current);
      if (ok === false) {
        throw new Error('Lưu bộ nhớ tạm thành công nhưng không thể đồng bộ lên Cloud Firestore.');
      }
      setHasUnsavedExerciseChanges(false);
      soundEffects.playSuccess();
      setExerciseSaveSuccess(`Đã lưu và đồng bộ thành công ${current.length} Học phần bài tập Lớp ${selectedExerciseGrade} lên Cloud Firestore! Dữ liệu đã có hiệu lực cho học sinh.`);
      setTimeout(() => setExerciseSaveSuccess(null), 6000);
    } catch (err: any) {
      soundEffects.playError();
      setExerciseSaveError(`Lỗi lưu dữ liệu: ${err.message || 'Không thể lưu lên Cloud'}`);
    } finally {
      setIsSavingExercises(false);
    }
  };

  // Combine standard avatars + custom uploaded avatars
  const allAvailableAvatars = [
    ...AVATARS.map(a => ({ id: a.id, name: a.name, icon: a.icon, isCustom: false })),
    ...customAvatars
  ];

  // Handle Password Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setAuthError(false);

    const isValid = await verifySecurityKey(passwordInput.trim());
    setIsVerifying(false);

    if (isValid) {
      soundEffects.playSuccess();
      setIsAuthenticated(true);
    } else {
      soundEffects.playError();
      setAuthError(true);
      setPasswordInput('');
    }
  };

  // Start editing learner
  const handleStartEditLearner = (l: UserProfile) => {
    soundEffects.playClick();
    setEditingLearnerId(l.learnerId);
    setEditFullName(l.fullName || '');
    setEditNickname(l.nickname || l.name);
    setEditName(l.name);
    setEditUsername(l.username || resolveValidUsername(l.username, l.nickname || l.name));
    setEditGrade(l.grade);
    setEditAvatar(l.avatar);
    setEditPin(l.pin ? l.pin : '');
    setEditPinConfirm(l.pin ? l.pin : '');
    setEditPhone(l.phone || '');
    setEditEmail(l.email || '');
    setEditPinError(null);
    setEditFormError(null);
  };

  // Save edited learner
  const handleSaveEditLearner = (original: UserProfile) => {
    setEditPinError(null);
    setEditFormError(null);

    // 1. Validate Họ tên: 4 - 16 kí tự, là tên gọi đầy đủ, có thể viết hoa, không được có kí tự đặc biệt hoặc số (nếu có nhập)
    const cleanFullName = editFullName.trim();
    if (cleanFullName) {
      const nameVal = validateFullName(cleanFullName);
      if (!nameVal.isValid) {
        soundEffects.playError();
        setEditFormError(nameVal.error || 'Họ tên không hợp lệ (4 - 16 ký tự, không chứa số hoặc ký tự đặc biệt)!');
        return;
      }
    }

    // 2. Validate Nickname: Tên gọi thân mật hoặc tên viết tắt, hiển thị kế bên Avatar: có thể viết hoa, có thể có số, không được có kí tự đặc biệt
    const cleanNick = (editNickname.trim() || editName.trim());
    const nickVal = validateNickname(cleanNick);
    if (!nickVal.isValid) {
      soundEffects.playError();
      setEditFormError(nickVal.error || 'Nickname không hợp lệ (không chứa ký tự đặc biệt)!');
      return;
    }

    // 3. Validate Tên đăng nhập / Username: 4 - 16 kí tự, dùng để đăng nhập, không được viết hoa, không được có kí tự đặc biệt, có thể có số
    const cleanUsername = editUsername.trim();
    const userVal = validateUsername(cleanUsername);
    if (!userVal.isValid) {
      soundEffects.playError();
      setEditFormError(userVal.error || 'Tên đăng nhập không hợp lệ!');
      return;
    }

    const usernameConflict = learners.find(
      l => l.learnerId !== original.learnerId &&
           ((l.username && l.username.toLowerCase() === cleanUsername.toLowerCase()) ||
            resolveValidUsername(l.username, l.nickname || l.name).toLowerCase() === cleanUsername.toLowerCase())
    );
    if (usernameConflict) {
      soundEffects.playError();
      setEditFormError(`Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống (tài khoản: ${usernameConflict.nickname || usernameConflict.name})!`);
      return;
    }

    // 4. Validate Mật khẩu: tối thiểu 4 kí tự, tối đa 16 kí tự bao gồm cả chữ, số và ký tự đặc biệt
    if (editPin || editPinConfirm) {
      const passVal = validatePassword(editPin);
      if (!passVal.isValid) {
        soundEffects.playError();
        setEditPinError(passVal.error || 'Mật khẩu phải từ 4 đến 16 ký tự!');
        return;
      }

      if (editPin !== editPinConfirm) {
        soundEffects.playError();
        setEditPinError('Xác nhận mật khẩu mới không trùng khớp!');
        return;
      }
    }

    // Validate Phone (digits only, length 9-11, duplicate check)
    const cleanPhone = editPhone.trim();
    if (cleanPhone) {
      if (cleanPhone.length < 9 || cleanPhone.length > 11) {
        soundEffects.playError();
        setEditFormError('Số điện thoại không hợp lệ (phải gồm từ 9 đến 11 chữ số)!');
        return;
      }
      const phoneConflict = learners.find(
        l => l.learnerId !== original.learnerId && l.phone && l.phone.trim() === cleanPhone
      );
      if (phoneConflict) {
        soundEffects.playError();
        setEditFormError(`Số điện thoại "${cleanPhone}" đã tồn tại trong hệ thống (tài khoản: ${phoneConflict.name})!`);
        return;
      }
    }

    // Validate Email (no accents, no special chars, duplicate check)
    const cleanEmail = editEmail.trim().toLowerCase();
    if (cleanEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        soundEffects.playError();
        setEditFormError('Địa chỉ email không đúng định dạng (không có dấu hay ký tự đặc biệt)!');
        return;
      }
      const emailConflict = learners.find(
        l => l.learnerId !== original.learnerId && l.email && l.email.trim().toLowerCase() === cleanEmail
      );
      if (emailConflict) {
        soundEffects.playError();
        setEditFormError(`Địa chỉ email "${cleanEmail}" đã tồn tại trong hệ thống (tài khoản: ${emailConflict.name})!`);
        return;
      }
    }

    soundEffects.playSuccess();
    onUpdateLearner({
      ...original,
      fullName: cleanFullName,
      nickname: cleanNick,
      username: cleanUsername,
      name: cleanNick,
      grade: Number(editGrade) || original.grade || 4,
      avatar: editAvatar || original.avatar,
      pin: editPin,
      phone: cleanPhone,
      email: cleanEmail
    });
    setEditingLearnerId(null);
  };

  // Reset all achievements and stars of a learner to 0
  const handleResetLearnerStats = (learner: UserProfile) => {
    soundEffects.playClick();
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn đưa toàn bộ thành tích của tài khoản "${learner.name}" về 0?\n\n` +
      `Thao tác này sẽ đặt lại:\n` +
      `- Tổng số sao: 0 ⭐\n` +
      `- Cấp độ: Lv. 1 (0 XP)\n` +
      `- Chuỗi ngày học: 0 ngày\n` +
      `- Huy hiệu đã mở: 0\n` +
      `- Tiến độ tất cả các Unit: 0`
    );
    if (!confirmed) return;

    const resetUser: UserProfile = {
      ...learner,
      totalStars: 0,
      xp: 0,
      level: 1,
      currentStreak: 0,
      completedUnits: {},
      unlockedBadges: [],
      lastActiveDate: new Date().toISOString()
    };

    onUpdateLearner(resetUser);
    soundEffects.playSuccess();
    alert(`Đã đưa toàn bộ thành tích của tài khoản "${learner.name}" về 0 thành công!`);
  };

  // Create new learner
  const handleCreateLearner = (e: React.FormEvent) => {
    e.preventDefault();
    setNewPinError(null);
    setNewFormError(null);

    // 1. Validate Họ tên: 4 - 16 kí tự, là tên gọi đầy đủ, có thể viết hoa, không được có kí tự đặc biệt hoặc số (nếu có nhập)
    const cleanFullName = newFullName.trim();
    if (cleanFullName) {
      const nameVal = validateFullName(cleanFullName);
      if (!nameVal.isValid) {
        soundEffects.playError();
        setNewFormError(nameVal.error || 'Họ tên không hợp lệ (4 - 16 ký tự, không chứa số hoặc ký tự đặc biệt)!');
        return;
      }
    }

    // 2. Validate Nickname: Tên gọi thân mật hoặc tên viết tắt, hiển thị kế bên Avatar: có thể viết hoa, có thể có số, không được có kí tự đặc biệt
    const cleanNick = (newNickname.trim() || newName.trim());
    const nickVal = validateNickname(cleanNick);
    if (!nickVal.isValid) {
      soundEffects.playError();
      setNewFormError(nickVal.error || 'Nickname không hợp lệ (không chứa ký tự đặc biệt)!');
      return;
    }

    // 3. Validate Tên đăng nhập / Username: 4 - 16 kí tự, dùng để đăng nhập, không được viết hoa, không được có kí tự đặc biệt, có thể có số
    const cleanNewUsername = (newUsername.trim() || generateDefaultUsernameFromName(cleanNick));
    const userVal = validateUsername(cleanNewUsername);
    if (!userVal.isValid) {
      soundEffects.playError();
      setNewFormError(userVal.error || 'Tên đăng nhập không hợp lệ (4 - 16 ký tự, chữ thường và số, không viết hoa, không ký tự đặc biệt)!');
      return;
    }

    const usernameConflict = learners.find(
      l => (l.username && l.username.toLowerCase() === cleanNewUsername.toLowerCase()) ||
           resolveValidUsername(l.username, l.nickname || l.name).toLowerCase() === cleanNewUsername.toLowerCase()
    );
    if (usernameConflict) {
      soundEffects.playError();
      setNewFormError(`Tên đăng nhập "${cleanNewUsername}" đã tồn tại trong hệ thống (tài khoản: ${usernameConflict.nickname || usernameConflict.name})!`);
      return;
    }

    // 4. Validate Mật khẩu: tối thiểu 4 kí tự, tối đa 16 kí tự bao gồm cả chữ, số và ký tự đặc biệt
    const passVal = validatePassword(newPin);
    if (!passVal.isValid) {
      soundEffects.playError();
      setNewPinError(passVal.error || 'Mật khẩu phải từ 4 đến 16 ký tự!');
      return;
    }

    if (newPin !== newPinConfirm) {
      soundEffects.playError();
      setNewPinError('Xác nhận mật khẩu không trùng khớp!');
      return;
    }

    // Validate Phone (digits only, length 9-11, duplicate check)
    const cleanPhone = newPhone.trim();
    if (cleanPhone) {
      if (cleanPhone.length < 9 || cleanPhone.length > 11) {
        soundEffects.playError();
        setNewFormError('Số điện thoại không hợp lệ (phải gồm từ 9 đến 11 chữ số)!');
        return;
      }
      const phoneConflict = learners.find(l => l.phone && l.phone.trim() === cleanPhone);
      if (phoneConflict) {
        soundEffects.playError();
        setNewFormError(`Số điện thoại "${cleanPhone}" đã tồn tại trong hệ thống (tài khoản: ${phoneConflict.name})!`);
        return;
      }
    }

    // Validate Email (no accents, no special chars, duplicate check)
    const cleanEmail = newEmail.trim().toLowerCase();
    if (cleanEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        soundEffects.playError();
        setNewFormError('Địa chỉ email không đúng định dạng (không có dấu hay ký tự đặc biệt)!');
        return;
      }
      const emailConflict = learners.find(l => l.email && l.email.trim().toLowerCase() === cleanEmail);
      if (emailConflict) {
        soundEffects.playError();
        setNewFormError(`Địa chỉ email "${cleanEmail}" đã tồn tại trong hệ thống (tài khoản: ${emailConflict.name})!`);
        return;
      }
    }

    soundEffects.playSuccess();
    const newLearnerId = `learner_${Date.now()}`;

    const newProfile: UserProfile = {
      learnerId: newLearnerId,
      fullName: cleanFullName,
      nickname: cleanNick,
      username: cleanNewUsername,
      grade: Number(newGrade) || 4,
      name: cleanNick,
      avatar: newAvatar,
      pin: newPin,
      phone: cleanPhone,
      email: cleanEmail,
      level: 1,
      xp: 0,
      totalStars: 0,
      unlockedBadges: [],
      completedUnits: {},
      currentStreak: 1,
      lastActiveDate: new Date().toISOString()
    };
    onAddLearner(newProfile);
    setNewFullName('');
    setNewNickname('');
    setNewName('');
    setNewUsername('');
    setNewPin('');
    setNewPinConfirm('');
    setNewPhone('');
    setNewEmail('');
    setIsAddingLearner(false);
  };

  // Upload Avatar Image:
  // 1. Dung lượng tối đa 3 MB
  // 2. Kích thước tối đa 1024 x 1024 px
  // 3. Tự động căn giữa và tối ưu kích thước avatar chuẩn 256x256 px qua canvas
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);
    setAvatarUploadSuccess(null);

    // Rule 1: Max 3MB
    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      soundEffects.playError();
      setAvatarUploadError(`Dung lượng ảnh vượt quá 3 MB (Dung lượng tệp: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Vui lòng chọn ảnh nhỏ hơn 3 MB!`);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = () => {
        // Rule 2: Kích thước tối đa 1024 x 1024 px
        if (img.width > 1024 || img.height > 1024) {
          soundEffects.playError();
          setAvatarUploadError(`Kích thước ảnh vượt quá tối đa 1024 x 1024 px! Ảnh bạn chọn có kích thước ${img.width} x ${img.height} px. Vui lòng chọn ảnh có kích thước tối đa 1024 x 1024 px.`);
          if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
          return;
        }

        // Rule 3: Auto-resize to standard avatar size (160x160 px) with center crop and compact JPEG compression
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 160, 160);
          // Use compact JPEG at 0.85 quality (~15-25 KB, well within Firestore doc limits)
          const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          const avatarName = file.name.replace(/\.[^/.]+$/, '').slice(0, 16) || 'Avatar';
          const newAvatarItem: CustomAvatarItem = {
            id: `custom_av_${Date.now()}`,
            name: avatarName,
            icon: resizedDataUrl,
            isCustom: true
          };

          soundEffects.playSuccess();
          onAddCustomAvatar(newAvatarItem);
          // Auto-select this newly uploaded avatar for creating/editing
          setNewAvatar(resizedDataUrl);
          setEditAvatar(resizedDataUrl);
          setAvatarUploadSuccess(`Tải ảnh lên và lưu vào thư viện avatar thành công!`);
          if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Create new class (auto assigns curated emoji and level description)
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    const gradeNum = Number(newClassGrade);
    if (!gradeNum || gradeNum < 1 || gradeNum > 12) return;

    if (classes.some(c => c.grade === gradeNum)) {
      soundEffects.playError();
      alert(`Lớp ${gradeNum} đã có trong danh sách!`);
      return;
    }

    soundEffects.playSuccess();
    const newClass: AdminClassInfo = {
      grade: gradeNum,
      name: `Lớp ${gradeNum}`,
      description: getDefaultGradeDescription(gradeNum),
      emoji: getDefaultGradeEmoji(gradeNum)
    };
    onAddClass(newClass, []);
    setIsAddingClass(false);
  };

  // Change grade in Curriculum Tab
  const handleSelectJsonGrade = (grade: number) => {
    setSelectedJsonGrade(grade);
    const units = gradeUnitsMap[grade] || [];
    setJsonContent(JSON.stringify(units, null, 2));
    setJsonError(null);
    setJsonSuccess(null);
  };

  // Copy JSON
  const handleCopyJson = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Paste JSON from clipboard
  const handlePasteJson = async () => {
    soundEffects.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJsonContent(text);
        setJsonSuccess('Đã dán mã từ bộ nhớ tạm!');
      }
    } catch {
      setJsonError('Không thể truy cập bộ nhớ tạm. Bạn hãy dùng phím tắt Ctrl+V vào ô bên dưới nhé.');
    }
  };

  // Import JSON from file (.json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEffects.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setJsonContent(result);
        setJsonSuccess(`Đã nhập mã thành công từ tệp ${file.name}!`);
      }
    };
    reader.readAsText(file);
  };

  // Save JSON
  const handleSaveJson = () => {
    setJsonError(null);
    setJsonSuccess(null);
    try {
      const parsed = JSON.parse(jsonContent);
      if (!Array.isArray(parsed)) {
        throw new Error('Dữ liệu JSON phải là một mảng danh sách [ ... ] chứa các Unit.');
      }
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item.unit || !item.title || !Array.isArray(item.vocabulary)) {
          throw new Error(`Unit thứ ${i + 1} thiếu trường bắt buộc ('unit', 'title', hoặc 'vocabulary').`);
        }
      }
      soundEffects.playSuccess();
      onSaveCurriculum(selectedJsonGrade, parsed);
      setJsonSuccess(`Đã lưu thành công ${parsed.length} Unit cho Lớp ${selectedJsonGrade}!`);
    } catch (err: unknown) {
      soundEffects.playError();
      const msg = err instanceof Error ? err.message : 'Mã JSON không đúng cú pháp!';
      setJsonError(msg);
    }
  };

  // Reset JSON
  const handleCancelOrResetJson = () => {
    soundEffects.playClick();
    const units = gradeUnitsMap[selectedJsonGrade] || [];
    setJsonContent(JSON.stringify(units, null, 2));
    setJsonError(null);
    setJsonSuccess('Đã hủy thay đổi chưa lưu.');
  };

  // -------------------------------------------------------------
  // PASSWORD GATE VIEW (If not authenticated)
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-float border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
                <Settings className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-slate-800">
                  Quản lý hệ thống
                </h2>
              </div>
            </div>
            <button
              onClick={() => {
                soundEffects.playClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError(false);
                  }}
                  placeholder="Nhập mật khẩu..."
                  autoFocus
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border rounded-2xl font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:bg-white transition ${
                    authError
                      ? 'border-rose-400 ring-2 ring-rose-200'
                      : 'border-slate-200 focus:ring-amber-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {authError && (
                <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Mật khẩu không chính xác!
                </p>
              )}
            </div>

            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isVerifying || !passwordInput}
                className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {isVerifying ? 'Đang xác thực...' : 'Mở Khóa 🔓'}
              </button>
            </div>

            {/* Clear Cache Button for any device issues */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <button
                type="button"
                onClick={handleClearCacheFromLogin}
                disabled={isClearingCache}
                className="w-full py-2 px-3 rounded-2xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
                title="Xóa toàn bộ dữ liệu tạm trên thiết bị và tải mới từ cơ sở dữ liệu"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 ${isClearingCache ? 'animate-spin' : ''}`} />
                <span>{isClearingCache ? 'Đang dọn dẹp bộ nhớ đệm...' : 'Xóa bộ nhớ đệm (Clear Cache)'}</span>
              </button>
              {clearCacheNotice && (
                <p className="text-[11px] text-emerald-600 font-bold text-center">
                  {clearCacheNotice}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL MANAGEMENT DASHBOARD VIEW
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800">
                Bảng quản lý EasyEng
              </h2>

            </div>
          </div>

          <button
            onClick={() => {
              if (hasUnsavedExerciseChanges) {
                if (!window.confirm(`Dữ liệu bài tập Lớp ${selectedExerciseGrade} đang có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng mà không lưu không?`)) {
                  return;
                }
              }
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 pt-3 border-b border-slate-200 bg-white gap-2">
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('learners');
            }}
            className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'learners'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Tài khoản & Avatar ({learners.length})
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('branding');
            }}
            className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'branding'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Cài đặt Logo
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('classes');
            }}
            className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'classes'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Lớp học ({classes.length})
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('curriculum');
            }}
            className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" /> Quản lý JSON
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('resets');
            }}
            className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'resets'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" /> Cấp lại mật khẩu {resetRequests.length > 0 && (
              <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                {resetRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('verifications');
            }}
            className={`pb-3 px-4 font-display font-bold text-sm border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'verifications'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-500" /> Xác minh tài khoản {verificationRequests.length > 0 && (
              <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                {verificationRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: LEARNERS & AVATAR LIBRARY MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'learners' && (
            <div className="space-y-6">
              
              {/* SUBSECTION: AVATAR MANAGEMENT (THÊM, XÓA, UPLOAD ẢNH) */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-bold text-base text-amber-900 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-amber-600" /> Danh sách Avatar
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Upload ảnh kích thước tối đa <strong>1024 x 1024 px</strong>, dung lượng không quá <strong>3 MB/ảnh</strong>.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-display font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Tải ảnh Avatar mới
                    </button>
                  </div>
                </div>

                {/* Upload Feedback */}
                {avatarUploadError && (
                  <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {avatarUploadError}
                  </div>
                )}
                {avatarUploadSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {avatarUploadSuccess}
                  </div>
                )}

                {/* Avatar Gallery grid */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Thư viện Avatar hiện có ({allAvailableAvatars.length}):
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {allAvailableAvatars.map((av) => {
                      const owner = (av as any).ownerLearnerId
                        ? learners.find(l => l.learnerId === (av as any).ownerLearnerId)
                        : null;
                      return (
                        <div
                          key={av.id}
                          className="relative group p-1.5 bg-white rounded-2xl border border-amber-200 shadow-xs flex items-center justify-center w-14 h-14 text-center aspect-square"
                          title={`${av.name}${owner ? ` (Upload bởi: ${owner.name})` : ''}`}
                        >
                          <div className="w-10 h-10 flex items-center justify-center text-2xl overflow-hidden rounded-xl">
                            {renderAvatarContent(av.icon)}
                          </div>

                          {owner && (
                            <span className="absolute -bottom-1 -left-1 px-1 py-0.2 bg-indigo-600 text-[8px] font-bold text-white rounded-full shadow-2xs">
                              user
                            </span>
                          )}

                          {/* Delete button only for custom uploaded avatars */}
                          {av.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                if (window.confirm(`Xóa avatar "${av.name}" khỏi thư viện?`)) {
                                  onDeleteCustomAvatar(av.id);
                                }
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer hover:bg-rose-600"
                              title="Xóa avatar này"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SUBSECTION: LEARNERS LIST */}
              <div className="space-y-4">
                {unlockedSessionMsg && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{unlockedSessionMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnlockedSessionMsg(null)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-800">
                      Danh sách tài khoản
                    </h3>
                    <p className="text-xs text-slate-500">
                      Sửa tên, gán lớp học hoặc chọn ảnh đại diện từ thư viện
                    </p>
                  </div>

                  {!isAddingLearner && (
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setIsAddingLearner(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Thêm người học mới
                    </button>
                  )}
                </div>

                {/* Add Learner Form */}
                {isAddingLearner && (
                  <form onSubmit={handleCreateLearner} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-sm text-slate-800">
                        Tạo hồ sơ người học mới
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingLearner(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Họ tên:
                        </label>
                        <input
                          type="text"
                          value={newFullName}
                          onChange={(e) => {
                            setNewFullName(e.target.value);
                            setNewFormError(null);
                          }}
                          maxLength={16}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">
                          Nickname:
                        </label>
                        <input
                          type="text"
                          value={newNickname}
                          onChange={(e) => {
                            setNewNickname(e.target.value);
                            setNewFormError(null);
                          }}
                          maxLength={16}
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Gán vào Lớp học:</label>
                        <select
                          value={newGrade}
                          onChange={(e) => setNewGrade(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                          {ALL_12_GRADES.map(g => {
                            const customClass = classes.find(c => c.grade === g);
                            const emoji = customClass?.emoji || getDefaultGradeEmoji(g);
                            const name = customClass?.name || `Lớp ${g}`;
                            const level = getGradeLevelName(g);
                            return (
                              <option key={g} value={g}>
                                {emoji} {name} ({level})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Ảnh đại diện/Avatar:</label>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl">
                          {allAvailableAvatars.map(av => {
                            const isSelected = newAvatar === av.icon || newAvatar === av.id;
                            return (
                              <button
                                key={av.id}
                                type="button"
                                onClick={() => setNewAvatar(av.icon)}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg overflow-hidden cursor-pointer border-2 transition ${
                                  isSelected ? 'border-amber-500 bg-amber-50 scale-105 shadow-xs' : 'border-transparent hover:bg-slate-50'
                                }`}
                              >
                                {renderAvatarContent(av.icon)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Tên đăng nhập, Số điện thoại và Email cho học sinh mới */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-amber-600" />Tên đăng nhập:
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">(Chữ thường & số)</span>
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          value={newUsername}
                          onChange={(e) => {
                            setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                            setNewFormError(null);
                          }}
                          placeholder={newNickname.trim() ? generateDefaultUsernameFromName(newNickname) : "vanan, ty2024..."}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 lowercase"
                        />
                        <span className="text-[10px] text-slate-400">4-16 kí tự, không viết hoa, không ký tự ĐB</span>
                      </div>
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-amber-600" /> Số điện thoại:
                          </span>
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newPhone}
                          onChange={(e) => {
                            setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                            setNewFormError(null);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-amber-600" /> Địa chỉ Email:
                          </span>
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => {
                            const sanitized = e.target.value
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/[đĐ]/g, 'd')
                              .replace(/\s+/g, '')
                              .replace(/[^a-zA-Z0-9.@_-]/g, '')
                              .toLowerCase();
                            setNewEmail(sanitized);
                            setNewFormError(null);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>
                    </div>

                    {newFormError && (
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {newFormError}
                      </p>
                    )}

                    {/* Mật khẩu đăng nhập cho học sinh mới */}
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lock className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-bold text-slate-700">
                          Mật khẩu đăng nhập:
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu (4-16 ký tự):</label>
                          <input
                            type="password"
                            maxLength={16}
                            value={newPin}
                            onChange={(e) => {
                              setNewPin(e.target.value);
                              setNewPinError(null);
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Xác nhận mật khẩu:</label>
                          <input
                            type="password"
                            maxLength={16}
                            value={newPinConfirm}
                            onChange={(e) => {
                              setNewPinConfirm(e.target.value);
                              setNewPinError(null);
                            }}
                            placeholder="Nhập lại mật khẩu..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                      {newPinError && (
                        <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {newPinError}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingLearner(false)}
                        className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Tạo ngay ✨
                      </button>
                    </div>
                  </form>
                )}

                {/* Learners List */}
                <div className="grid grid-cols-1 gap-3">
                  {learners.map((learner) => {
                    const isEditing = editingLearnerId === learner.learnerId;

                    if (isEditing) {
                      return (
                        <div key={learner.learnerId} className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-800">
                              Đang chỉnh sửa hồ sơ: {learner.name}
                            </span>
                            <button
                              onClick={() => setEditingLearnerId(null)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">
                                1. Họ và tên:
                              </label>
                              <input
                                type="text"
                                value={editFullName}
                                onChange={(e) => {
                                  setEditFullName(e.target.value);
                                  setEditFormError(null);
                                }}
                                placeholder="Nguyễn Văn An"
                                maxLength={16}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <span className="text-[10px] text-slate-400">4-16 kí tự, không số/ký tự ĐB</span>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">
                                2. Nickname (cạnh Avatar) <span className="text-rose-500">*</span>:
                              </label>
                              <input
                                type="text"
                                value={editNickname}
                                onChange={(e) => {
                                  setEditNickname(e.target.value);
                                  setEditFormError(null);
                                }}
                                placeholder="Bé Na, Tý, LinhNK..."
                                maxLength={16}
                                required
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <span className="text-[10px] text-slate-400">Có hoa/số, không ký tự ĐB</span>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">Lớp:</label>
                              <select
                                value={editGrade}
                                onChange={(e) => setEditGrade(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                              >
                                {ALL_12_GRADES.map(g => {
                                  const customClass = classes.find(c => c.grade === g);
                                  const emoji = customClass?.emoji || getDefaultGradeEmoji(g);
                                  const name = customClass?.name || `Lớp ${g}`;
                                  const level = getGradeLevelName(g);
                                  return (
                                    <option key={g} value={g}>
                                      {emoji} {name} ({level})
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">Ảnh đại diện/Avatar:</label>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl">
                                {allAvailableAvatars.map(av => {
                                  const isSelected = (editAvatar || learner.avatar) === av.icon || (editAvatar || learner.avatar) === av.id;
                                  return (
                                    <button
                                      key={av.id}
                                      type="button"
                                      onClick={() => setEditAvatar(av.icon)}
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg overflow-hidden cursor-pointer border-2 transition ${
                                        isSelected ? 'border-amber-500 bg-amber-50 scale-105 shadow-xs' : 'border-transparent hover:bg-slate-50'
                                      }`}
                                    >
                                      {renderAvatarContent(av.icon)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Tên đăng nhập (Quản lý có thể đổi), SĐT và Email */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/80">
                            <div>
                              <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-amber-600" /> 3. Tên đăng nhập / Username:
                                </span>

                              </label>
                              <input
                                type="text"
                                maxLength={16}
                                value={editUsername}
                                onChange={(e) => {
                                  setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                  setEditFormError(null);
                                }}
                                placeholder="Nhập tên đăng nhập..."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 lowercase"
                                required
                              />
                              <span className="text-[10px] text-slate-400">4-16 kí tự, không viết hoa, không ký tự ĐB</span>
                            </div>
                            <div>
                              <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-amber-600" /> Số điện thoại:
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">(Chỉ nhập số)</span>
                              </label>
                              <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={editPhone}
                                onChange={(e) => {
                                  setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                                  setEditFormError(null);
                                }}
                                placeholder="Nhập SĐT..."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                            <div>
                              <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5 text-amber-600" /> Địa chỉ Email:
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">(Không dấu)</span>
                              </label>
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => {
                                  const sanitized = e.target.value
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '')
                                    .replace(/[đĐ]/g, 'd')
                                    .replace(/\s+/g, '')
                                    .replace(/[^a-zA-Z0-9.@_-]/g, '')
                                    .toLowerCase();
                                  setEditEmail(sanitized);
                                  setEditFormError(null);
                                }}
                                placeholder="Nhập email..."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                          </div>

                          {editFormError && (
                            <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {editFormError}
                            </p>
                          )}

                          {/* Avatar preview */}
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-xs font-bold text-slate-500">Avatar đang chọn:</span>
                            <div className="w-10 h-10 rounded-xl bg-white border border-amber-300 flex items-center justify-center text-2xl overflow-hidden">
                              {renderAvatarContent(editAvatar || learner.avatar)}
                            </div>
                          </div>

                          {/* Đổi mật khẩu cho học sinh (Quản trị viên: nhập MK mới & xác nhận MK mới, không cần MK cũ) */}
                          <div className="pt-2 border-t border-amber-200/80">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Lock className="w-4 h-4 text-amber-800" />
                              <span className="text-xs font-bold text-amber-900">
                                Đổi mật khẩu đăng nhập:
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                (Từ 4 đến 16 ký tự, gồm cả chữ, số và ký tự đặc biệt)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Mật khẩu mới:</label>
                                <input
                                  type="password"
                                  maxLength={16}
                                  value={editPin}
                                  onChange={(e) => {
                                    setEditPin(e.target.value);
                                    setEditPinError(null);
                                  }}
                                  placeholder="Nhập mật khẩu mới..."
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Xác nhận mật khẩu mới:</label>
                                <input
                                  type="password"
                                  maxLength={16}
                                  value={editPinConfirm}
                                  onChange={(e) => {
                                    setEditPinConfirm(e.target.value);
                                    setEditPinError(null);
                                  }}
                                  placeholder="Nhập lại mật khẩu mới..."
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                              </div>
                            </div>
                            {editPinError && (
                              <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {editPinError}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              onClick={() => setEditingLearnerId(null)}
                              className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveEditLearner(learner)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" /> Lưu cập nhật
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const completedUnitsCount = Object.keys(learner.completedUnits || {}).length;

                    return (
                      <div
                        key={learner.learnerId}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-2xs">
                            {renderAvatarContent(learner.avatar)}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-base text-slate-800">
                                {learner.nickname || learner.name}
                              </h4>
                              {learner.fullName && (
                                <span className="text-xs text-slate-500 font-medium">
                                  ({learner.fullName})
                                </span>
                              )}
                              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                Lớp {learner.grade}
                              </span>
                            </div>

                            {/* Tên đăng nhập, Số điện thoại, Email */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700" title="Tên đăng nhập / Username">
                                <User className="w-3 h-3 text-amber-600" /> {learner.username || resolveValidUsername(learner.username, learner.nickname || learner.name)}
                              </span>
                              {learner.phone && (
                                <span className="inline-flex items-center gap-1 font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <Phone className="w-3 h-3 text-emerald-600" /> {learner.phone}
                                </span>
                              )}
                              {learner.email && (
                                <span className="inline-flex items-center gap-1 font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md border border-sky-200">
                                  <Mail className="w-3 h-3 text-sky-600" /> {learner.email}
                                </span>
                              )}
                            </div>

                            {/* Thành tích học tập chi tiết của tài khoản */}
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80">
                                ⭐ {learner.totalStars || 0} sao
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/80">
                                🏆 Lv. {learner.level || 1} ({learner.xp || 0} XP)
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/80">
                                🔥 {learner.currentStreak || 0} ngày
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200/80">
                                🏅 {learner.unlockedBadges?.length || 0} huy hiệu
                              </span>
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/80">
                                📚 {completedUnitsCount} bài đã học
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Các nút hành động: Mở khóa phiên, Reset tài khoản, Sửa, Xóa */}
                        <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                          {/* Nút Mở khóa phiên thiết bị */}
                          <button
                            type="button"
                            onClick={async () => {
                              soundEffects.playClick();
                              await clearAccountActiveSession(learner.learnerId);
                              soundEffects.playSuccess();
                              setUnlockedSessionMsg(`Đã mở khóa phiên và đăng xuất mọi thiết bị cho học sinh "${learner.name}" thành công!`);
                              setTimeout(() => setUnlockedSessionMsg(null), 5000);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                            title="Ngắt kết nối các thiết bị khác đang đăng nhập tài khoản này"
                          >
                            <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Mở khóa
                          </button>

                          {/* Nút Reset tài khoản */}
                          <button
                            type="button"
                            onClick={() => handleResetLearnerStats(learner)}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                            title="Đặt lại toàn bộ thành tích của tài khoản này về 0"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Reset
                          </button>

                          {/* Nút Sửa tài khoản */}
                          <button
                            type="button"
                            onClick={() => handleStartEditLearner(learner)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                            title="Sửa tên, avatar, gán lớp"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Sửa
                          </button>

                          {/* Nút Xóa tài khoản */}
                          {learners.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                if (window.confirm(`Bạn có chắc muốn xóa người học "${learner.name}"?`)) {
                                  onDeleteLearner(learner.learnerId);
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer active:scale-95"
                              title="Xóa người học"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CLASSES & GRADES MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'classes' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800">
                    Danh sách lớp học
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tạo lớp học mới hoặc quản lý các lớp hiện có trong hệ thống
                  </p>
                </div>

                {!isAddingClass && (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      const unusedGrade = ALL_12_GRADES.find(g => !classes.some(c => c.grade === g)) || 1;
                      setNewClassGrade(unusedGrade);
                      setIsAddingClass(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Tạo lớp học mới
                  </button>
                )}
              </div>

              {/* Add Class Form */}
              {isAddingClass && (
                <form onSubmit={handleCreateClass} className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-sm text-indigo-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-indigo-600" /> Tạo lớp học mới
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingClass(false)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>

                      <select
                        value={newClassGrade}
                        onChange={(e) => setNewClassGrade(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                      >
                        {ALL_12_GRADES.map((g) => {
                          const isCreated = classes.some(c => c.grade === g);
                          return (
                            <option key={g} value={g}>
                              Lớp {g} - {getGradeLevelName(g)} ({getDefaultGradeEmoji(g)}) {isCreated ? '• [Đã có]' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Chọn từ Lớp 1 đến Lớp 12. Biểu tượng và cấp học tương ứng sẽ được tự động gán!
                      </p>
                    </div>

                    {/* Auto-assigned preview card */}
                    <div className="bg-white border border-indigo-100 rounded-xl p-3.5 flex items-center gap-3.5 shadow-xs">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl shrink-0">
                        {getDefaultGradeEmoji(newClassGrade)}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-slate-800">
                            Lớp {newClassGrade}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            getGradeLevelName(newClassGrade) === 'Tiểu học'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : getGradeLevelName(newClassGrade) === 'Trung học cơ sở'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {getGradeLevelName(newClassGrade)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Biểu tượng tự động: <strong className="text-slate-700">{getDefaultGradeEmoji(newClassGrade)}</strong> (Chuẩn cấp độ)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-indigo-100">
                    <button
                      type="button"
                      onClick={() => setIsAddingClass(false)}
                      className="px-4 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={classes.some(c => c.grade === newClassGrade)}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold text-xs shadow-xs disabled:opacity-50 transition cursor-pointer"
                    >
                      Tạo Lớp {newClassGrade} ({getDefaultGradeEmoji(newClassGrade)}) 🚀
                    </button>
                  </div>
                </form>
              )}

              {/* Classes List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {classes.map((cls) => {
                  const learnersInClass = learners.filter(l => l.grade === cls.grade);
                  const unitsCount = (gradeUnitsMap[cls.grade] || []).length;
                  const levelName = getGradeLevelName(cls.grade);
                  const levelBadgeStyle =
                    levelName === 'Tiểu học'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : levelName === 'Trung học cơ sở'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200';
                  const emoji = cls.emoji || getDefaultGradeEmoji(cls.grade);

                  return (
                    <div
                      key={cls.grade}
                      className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition flex flex-col justify-between space-y-3 shadow-xs group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2.5 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
                            {emoji}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-lg text-slate-800">
                                {cls.name}
                              </h4>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${levelBadgeStyle}`}>
                                {levelName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">
                              {unitsCount} bài học (Units)
                            </p>
                          </div>
                        </div>

                        {/* NÚT XÓA Ở TẤT CẢ CÁC LỚP CÓ SẴN HOẶC MỚI TẠO */}
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            const confirmMsg = learnersInClass.length > 0
                              ? `Lớp "${cls.name}" (${levelName}) hiện đang có ${learnersInClass.length} học sinh (${learnersInClass.map(l => l.name).join(', ')}).\nBạn có chắc chắn muốn xóa lớp này khỏi hệ thống?`
                              : `Bạn có chắc chắn muốn xóa lớp "${cls.name}" (${levelName})?`;
                            if (window.confirm(confirmMsg)) {
                              onDeleteClass(cls.grade);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={`Xóa ${cls.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                        <span className="truncate max-w-[200px]">
                          Học sinh: {learnersInClass.map(l => l.name).join(', ') || 'Chưa có'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            handleSelectJsonGrade(cls.grade);
                            setActiveTab('curriculum');
                          }}
                          className="text-amber-600 hover:text-amber-700 hover:underline cursor-pointer font-bold shrink-0 ml-2"
                        >
                          Sửa JSON ➔
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CURRICULUM JSON CODE IMPORT / EXPORT / EDIT */}
          {/* ========================================================= */}
          {activeTab === 'curriculum' && (
            <div className="space-y-4">
              {/* Sub-tab Switcher: Giáo trình SGK vs Quản lý dữ liệu bài tập JSON */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setJsonSubTab('curriculum');
                  }}
                  className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer ${
                    jsonSubTab === 'curriculum'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Dữ liệu Sách giáo khoa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setJsonSubTab('exercises');
                  }}
                  className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer ${
                    jsonSubTab === 'exercises'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Dữ liệu Sách bài tập</span>
                </button>
              </div>

              {jsonSubTab === 'curriculum' ? (
                /* GIAO DIEN QUAN LY DU LIEU GIAO TRINH SGK (CU) */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-800">
                        Quản lý dữ liệu Sách giáo khoa
                      </h3>
                      <p className="text-xs text-slate-500">
                        Xem, dán code trích xuất từ NotebookLM, sao chép hoặc nhập tệp tin JSON
                      </p>
                    </div>

                    {/* Grade picker */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Đang chọn:</span>
                      <select
                        value={selectedJsonGrade}
                        onChange={(e) => handleSelectJsonGrade(Number(e.target.value))}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-display font-bold text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      >
                        {classes.map(c => (
                          <option key={c.grade} value={c.grade}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={handleCopyJson}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Đã sao chép' : 'Sao chép code'}
                      </button>

                      <button
                        onClick={handlePasteJson}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Dán từ Clipboard"
                      >
                        Dán code
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Nhập tệp .json
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (window.confirm(`Khôi phục về dữ liệu mặc định Lớp ${selectedJsonGrade}?`)) {
                            onResetCurriculum(selectedJsonGrade);
                            handleCancelOrResetJson();
                          }
                        }}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Khôi phục gốc
                      </button>
                    </div>
                  </div>

                  {/* JSON Editor Textarea */}
                  <div className="relative min-h-[300px]">
                    <textarea
                      value={jsonContent}
                      onChange={(e) => setJsonContent(e.target.value)}
                      className="w-full h-80 sm:h-96 p-4 bg-slate-900 text-amber-300 font-mono text-xs rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none selection:bg-amber-600 selection:text-white"
                      placeholder="Dán mã JSON mảng [ ... ] tại đây..."
                      spellCheck={false}
                    />
                  </div>

                  {/* Feedback banners */}
                  {jsonError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {jsonError}
                    </div>
                  )}
                  {jsonSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {jsonSuccess}
                    </div>
                  )}

                  {/* Save & Cancel Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      onClick={handleCancelOrResetJson}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      onClick={handleSaveJson}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-display font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" /> Lưu dữ liệu Lớp {selectedJsonGrade} 🚀
                    </button>
                  </div>
                </div>
              ) : (
                /* PHẦN QUẢN LÝ DỮ LIỆU BÀI TẬP JSON THEO YÊU CẦU */
                <div className="space-y-4">
                  {/* Top Bar: Title & Mục Chọn Lớp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-800 flex items-center gap-2">
                        <span>Dữ liệu Sách bài tập</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cấu hình các học phần bài tập, nạp dữ liệu câu hỏi từ file JSON và đồng bộ tới học sinh.
                      </p>
                    </div>

                    {/* Mục Chọn Lớp */}
                     
                      <select
                        value={selectedExerciseGrade}
                        onChange={(e) => handleSelectExerciseGrade(Number(e.target.value))}
                        className="px-3 py-1 bg-white border border-purple-300 rounded-xl font-display font-bold text-xs text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer"
                      >
                        {classes.map(c => (
                          <option key={c.grade} value={c.grade}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                      </select>
                    
                  </div>

                  {/* Thanh điều khiển số lượng học phần & Nút + Thêm học phần */}
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Số lượng học phần cần add JSON:
                      </span>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                        {[0, 2, 4, 6, 8].map(count => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => handleSetClusterCount(count)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              getCurrentGradeClusters().length === count
                                ? 'bg-purple-600 text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {count === 0 ? '0 (Trống)' : `${count} học phần`} {count === 4 && <span className="text-[10px] opacity-80">(Mặc định)</span>}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Nút nạp sẵn 4 file JSON cho Lớp 4 */}
                      {selectedExerciseGrade === 4 && (
                        <button
                          type="button"
                          onClick={handleLoadOfficialGrade4Workbooks}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Tải lên và nạp sẵn 4 học phần Sách bài tập Global Success Lớp 4 (833 câu)"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Nạp 4 file JSON SGK Lớp 4 (833 câu)</span>
                        </button>
                      )}

                      {/* Nút nạp sẵn 4 file JSON cho Lớp 7 */}
                      {selectedExerciseGrade === 7 && (
                        <button
                          type="button"
                          onClick={handleLoadOfficialGrade7Workbooks}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Tải lên và nạp sẵn 4 học phần Sách bài tập Global Success Lớp 7 (910 câu)"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Nạp 4 file JSON SGK Lớp 7 (910 câu)</span>
                        </button>
                      )}

                      {/* Nút Xóa tất cả học phần */}
                      {getCurrentGradeClusters().length > 0 && (
                        <button
                          type="button"
                          onClick={handleDeleteAllClusters}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Xóa toàn bộ các học phần bài tập của lớp này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa tất cả</span>
                        </button>
                      )}

                      {/* Nút + Thêm học phần */}
                      <button
                        type="button"
                        onClick={handleAddCluster}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Thêm học phần (+)</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedback Banners */}
                  {hasUnsavedExerciseChanges && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Có thay đổi dữ liệu chưa lưu! Hãy bấm <strong>Lưu dữ liệu bài tập</strong> để áp dụng có hiệu lực.</span>
                      </div>
                    </div>
                  )}
                  {exerciseSaveError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {exerciseSaveError}
                    </div>
                  )}
                  {exerciseSaveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {exerciseSaveSuccess}
                    </div>
                  )}

                  {/* Danh sách từng học phần bài tập hoặc Trạng thái trống */}
                  {getCurrentGradeClusters().length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-3xl shadow-2xs">
                        📂
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-slate-800 text-base">
                          Chưa có học phần bài tập nào cho Lớp {selectedExerciseGrade}
                        </h4>
                        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                          Hiện tại danh sách bài tập của lớp này đang trống (đã xóa hết bài tập). Bạn có thể bấm nút <strong>"Thêm học phần (+)"</strong> để tự tạo cụm bài tập mới hoặc nạp lại bộ bài tập mẫu chuẩn từ hệ thống.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleAddCluster}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Plus className="w-4 h-4" /> Thêm học phần mới
                        </button>
                        {selectedExerciseGrade === 4 && (
                          <button
                            type="button"
                            onClick={handleLoadOfficialGrade4Workbooks}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <BookOpen className="w-4 h-4" /> Nạp bài tập SGK Lớp 4 (833 câu)
                          </button>
                        )}
                        {selectedExerciseGrade === 7 && (
                          <button
                            type="button"
                            onClick={handleLoadOfficialGrade7Workbooks}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <BookOpen className="w-4 h-4" /> Nạp bài tập SGK Lớp 7 (910 câu)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getCurrentGradeClusters().map((cluster, idx) => {
                        const qCount = cluster.questions?.length || 0;
                        return (
                          <div
                            key={cluster.id || idx}
                            className="bg-white rounded-2xl border-2 border-slate-200 p-4 space-y-3 shadow-2xs transition hover:border-purple-300"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-display font-extrabold text-sm flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={cluster.title}
                                    onChange={(e) => handleClusterTitleChange(idx, e.target.value)}
                                    placeholder={`Học phần bài tập ${idx + 1}`}
                                    className="w-full px-2.5 py-1 text-sm font-display font-bold text-slate-800 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-300 focus:bg-white focus:border-purple-400 rounded-lg transition focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                                  qCount > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {qCount > 0 ? `✅ ${qCount} câu hỏi` : '⚠️ Chưa có dữ liệu'}
                                </span>

                                {/* NÚT LOAD JSON CHO TỪNG HỌC PHẦN */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenLoadJson(idx)}
                                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 hover:border-purple-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>Load JSON</span>
                                </button>

                                {/* Nút xóa học phần */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCluster(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Xóa học phần này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Mô tả học phần */}
                            <input
                              type="text"
                              value={cluster.description || ''}
                              onChange={(e) => handleClusterDescChange(idx, e.target.value)}
                              placeholder="Mô tả nội dung học phần (ví dụ: Ôn tập ngữ pháp, câu hỏi từ vựng Unit 1 - 5)..."
                              className="w-full px-3 py-1.5 text-xs text-slate-600 bg-slate-50 hover:bg-white border border-slate-200 focus:bg-white focus:border-purple-400 rounded-xl transition focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Save All Clusters Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="text-xs">
                      {hasUnsavedExerciseChanges ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                          Có thay đổi chưa lưu (bấm nút Lưu để có hiệu lực)
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Dữ liệu bài tập Lớp {selectedExerciseGrade} đã được lưu
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {hasUnsavedExerciseChanges && (
                        <button
                          type="button"
                          onClick={handleResetExerciseDraft}
                          disabled={isSavingExercises}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-display font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                          title="Hủy bỏ các thay đổi và tải lại dữ liệu đã lưu gần nhất"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Hủy thay đổi</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isSavingExercises}
                        onClick={handleSaveAllExerciseClusters}
                        className={`px-6 py-2.5 rounded-xl text-white font-display font-bold text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                          hasUnsavedExerciseChanges
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-orange-500/25 ring-2 ring-orange-300'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/20'
                        }`}
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {isSavingExercises
                            ? 'Đang lưu...'
                            : hasUnsavedExerciseChanges
                            ? `Lưu dữ liệu bài tập Lớp ${selectedExerciseGrade} (Chưa lưu) 🚀`
                            : `Lưu tất cả học phần bài tập Lớp ${selectedExerciseGrade} 🚀`}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: APP LOGO & BRANDING SETTINGS */}
          {/* ========================================================= */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Header Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-2xs">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-amber-950">Tùy chỉnh Logo & Kích thước hiển thị (Đồng bộ CSDL)</p>
                </div>
              </div>

              {/* Status Notice if changes are unsaved */}
              {hasUnsavedBrandingChanges && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fadeIn shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span>⚠️ Bạn có thay đổi logo hoặc kích thước chưa lưu lên CSDL!</span>
                  </div>
                  <button
                    onClick={handleSaveAllBranding}
                    disabled={isSavingBranding}
                    className="self-end sm:self-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingBranding ? 'Đang lưu...' : 'Bấm lưu ngay'}</span>
                  </button>
                </div>
              )}

              {/* Success / Info notice */}
              {logoNotice && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn shadow-xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{logoNotice}</span>
                </div>
              )}

              {/* ========================================================= */}
              {/* SECTION 1: CHOOSE LOGO IMAGE (UPLOAD / URL / RESET) */}
              {/* ========================================================= */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-800">
                        1. Chọn hình ảnh Logo
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tải ảnh mới từ thiết bị hoặc dán link ảnh trực tuyến
                      </p>
                    </div>
                  </div>

                  {stagedLogo !== (customLogo ?? null) && (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      Ảnh mới (chưa lưu)
                    </span>
                  )}
                </div>

                {/* Current / Staged Emblem Showcase */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-inner flex items-center justify-center shrink-0">
                      <EasyEngLogo className="w-16 h-16 sm:w-18 sm:h-18" src={stagedLogo || undefined} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Logo đang chọn hiển thị
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          stagedLogo
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {stagedLogo ? '⭐ Logo tùy chỉnh' : '✨ Logo EasyEng gốc'}
                        </span>
                        {stagedLogo !== (customLogo ?? null) && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                            Bản nháp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {stagedLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setStagedLogo(null);
                        setLogoNotice('Đã chuyển bản xem trước về logo gốc. Hãy bấm nút Lưu bên dưới để cập nhật lên CSDL!');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Chuyển về logo gốc
                    </button>
                  )}
                </div>

                {/* Upload & URL Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option A: Upload from Computer */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-amber-600" />
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800">Tải ảnh từ thiết bị</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Chọn tệp hình ảnh logo từ máy tính hoặc điện thoại (PNG, JPG, SVG, WebP).
                    </p>
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) {
                          alert('Vui lòng chọn file hình ảnh (PNG, JPG, SVG, WebP)!');
                          return;
                        }
                        try {
                          const compressed = await compressLogoFile(file);
                          setStagedLogo(compressed);
                          soundEffects.playSuccess();
                          setLogoNotice('Đã nạp ảnh logo mới vào bản xem trước. Hãy nhấn nút "Lưu thay đổi lên CSDL" bên dưới để áp dụng!');
                        } catch (err) {
                          console.warn('Compress logo error:', err);
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        logoFileInputRef.current?.click();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition active:scale-95"
                    >
                      <Upload className="w-4 h-4" /> Chọn ảnh logo mới
                    </button>
                  </div>

                  {/* Option B: Enter Image URL */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-sky-600" />
                      <h4 className="font-display font-bold text-xs sm:text-sm text-slate-800">Dán link ảnh logo (URL)</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nhập liên kết ảnh trực tuyến (https://.../logo.png).
                    </p>
                    <div className="flex gap-1.5">
                      <input
                        type="url"
                        value={logoUrlInput}
                        onChange={(e) => setLogoUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!logoUrlInput.trim()) return;
                          soundEffects.playSuccess();
                          setStagedLogo(logoUrlInput.trim());
                          setLogoUrlInput('');
                          setLogoNotice('Đã nạp link ảnh logo vào bản xem trước. Hãy nhấn nút "Lưu thay đổi lên CSDL" bên dưới để áp dụng!');
                        }}
                        className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs cursor-pointer transition active:scale-95 shrink-0"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* SECTION 2: LOGO DISPLAY SIZE SLIDERS & PREVIEWS */}
              {/* ========================================================= */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-800">
                        2. Chỉnh kích thước hiển thị Logo
                      </h3>
                      <p className="text-xs text-slate-500">
                        Kéo thanh trượt để tinh chỉnh và xem trước trực tiếp theo thời gian thực
                      </p>
                    </div>
                  </div>
                </div>

                {/* SLIDER 1: WELCOME SCREEN LOGO SIZE */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-amber-600 shrink-0" />
                      <label className="font-display font-bold text-xs sm:text-sm text-slate-800">
                        Kích thước trên Màn hình chào mừng (Chọn người học)
                      </label>
                    </div>
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                      {stagedWelcomeLogoSize}px
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Logo xuất hiện ở đầu trang chào mừng khi mở ứng dụng để các bạn học sinh chọn tài khoản.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min="30"
                      max="360"
                      step="5"
                      value={stagedWelcomeLogoSize}
                      onChange={(e) => setStagedWelcomeLogoSize(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>30px (Nhỏ)</span>
                      <span>100px (Vừa)</span>
                      <span>200px (Lớn)</span>
                      <span className="text-amber-600">300px (Chuẩn)</span>
                      <span>360px (Cực đại)</span>
                    </div>
                  </div>

                  {/* Preset Buttons for Welcome Screen */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Gợi ý nhanh:</span>
                    {[
                      { label: 'Gọn (48px)', val: 48 },
                      { label: 'Vừa vặn (100px)', val: 100 },
                      { label: 'Lớn (180px)', val: 180 },
                      { label: 'Rất lớn (240px)', val: 240 },
                      { label: 'Chuẩn 300px ⭐', val: 300 }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setStagedWelcomeLogoSize(preset.val);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          stagedWelcomeLogoSize === preset.val
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Simulation of Welcome Banner */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Xem trước trực tiếp trên Màn hình chào mừng:
                    </span>
                    <div className="p-4 bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-amber-100/40 rounded-2xl border border-amber-200/90 text-center flex flex-col items-center justify-center overflow-hidden shadow-2xs">
                      <div className="flex items-center justify-center">
                        <EasyEngLogo size={stagedWelcomeLogoSize} src={stagedLogo || undefined} />
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 bg-amber-100/90 border border-amber-300 text-amber-900 px-3 py-0.5 rounded-full text-[11px] font-bold shadow-2xs">
                        <span>✨ Xin chào bạn, chọn tên để bắt đầu nhé! ✨</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLIDER 2: HEADER LOGO SIZE */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-orange-600 shrink-0" />
                      <label className="font-display font-bold text-xs sm:text-sm text-slate-800">
                        Kích thước trên Thanh Header (Thanh điều hướng)
                      </label>
                    </div>
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 border border-orange-200">
                      {stagedHeaderLogoSize}px
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    Logo nằm ở góc trái thanh điều hướng trên cùng, hiển thị xuyên suốt quá trình học và làm bài.
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min="24"
                      max="250"
                      step="2"
                      value={stagedHeaderLogoSize}
                      onChange={(e) => setStagedHeaderLogoSize(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>24px (Gọn)</span>
                      <span>64px (Vừa)</span>
                      <span>120px (Lớn)</span>
                      <span className="text-orange-600">200px (Chuẩn)</span>
                      <span>250px (Cực đại)</span>
                    </div>
                  </div>

                  {/* Preset Buttons for Header */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Gợi ý nhanh:</span>
                    {[
                      { label: 'Gọn nhẹ (44px)', val: 44 },
                      { label: 'Rõ nét (64px)', val: 64 },
                      { label: 'Lớn (100px)', val: 100 },
                      { label: 'Rất lớn (150px)', val: 150 },
                      { label: 'Chuẩn 200px ⭐', val: 200 }
                    ].map((preset) => (
                      <button
                        key={preset.val}
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setStagedHeaderLogoSize(preset.val);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          stagedHeaderLogoSize === preset.val
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Simulation of Header */}
                  <div className="mt-3 pt-3 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Xem trước trực tiếp trên Thanh Header:
                    </span>
                    <div className="p-3 bg-white border border-amber-200 rounded-2xl flex items-center justify-between shadow-2xs overflow-hidden">
                      <div className="flex items-center gap-2.5">
                        <EasyEngLogo 
                          size={stagedHeaderLogoSize} 
                          src={stagedLogo || undefined} 
                          style={{ maxHeight: '72px' }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-xl">Demo Header</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* SECTION 3: UNIFIED ACTION BAR & CLOUD SAVE BUTTON */}
              {/* ========================================================= */}
              <div className="p-5 rounded-3xl bg-white border border-amber-300 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveAllBranding}
                    disabled={isSavingBranding}
                    className={`w-full sm:flex-1 py-3.5 px-6 rounded-2xl text-white font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                      hasUnsavedBrandingChanges
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 shadow-orange-500/25 ring-2 ring-amber-300'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/20'
                    }`}
                  >
                    {isSavingBranding ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang lưu lên CSDL Firestore...</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-4 h-4" />
                        <span>Lưu thay đổi Logo & Kích thước lên CSDL {hasUnsavedBrandingChanges ? '(Nhấn để lưu 🚀)' : '✓'}</span>
                      </>
                    )}
                  </button>

                  {hasUnsavedBrandingChanges && (
                    <button
                      type="button"
                      onClick={handleRevertStagedBranding}
                      disabled={isSavingBranding}
                      className="w-full sm:w-auto py-3.5 px-4 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Hủy bỏ các chỉnh sửa chưa lưu và quay lại logo hiện tại"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Hủy thay đổi</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetSizesToDefault}
                    disabled={isSavingBranding}
                    className="w-full sm:w-auto py-3.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    title="Đặt lại kích thước chuẩn: Header 200px, Màn hình chào mừng 300px"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kích thước chuẩn (200px / 300px)</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center font-medium">
                  ☁️ Dữ liệu được lưu trữ trực tiếp trên Cloud Firestore và đồng bộ tự động đến tất cả các máy tính, điện thoại khác khi truy cập.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PASSWORD RESET REQUESTS (CẤP LẠI MẬT KHẨU) */}
          {/* ========================================================= */}
          {activeTab === 'resets' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Header Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200/70 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">
                      Yêu cầu Cấp lại mật khẩu
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setIsLoadingResetRequests(true);
                    fetchPasswordResetRequestsFromCloud().then(reqs => {
                      setResetRequests(reqs);
                      setIsLoadingResetRequests(false);
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingResetRequests ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Requests List */}
              {isLoadingResetRequests ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Đang tải danh sách yêu cầu từ Cloud Firestore...</p>
                </div>
              ) : resetRequests.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-800">
                    Không có yêu cầu cấp lại mật khẩu nào
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Hiện tại tất cả học sinh và phụ huynh đều đăng nhập bình thường. Khi có người bấm "Cấp lại mật khẩu" ở màn hình đăng nhập, thông tin sẽ hiển thị ở đây và gửi đến email <span className="font-bold text-slate-700">linhnk.online@gmail.com</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {resetRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-amber-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-slate-900">
                            {req.fullName}
                          </span>
                          <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                            Nickname: {req.nickname}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{req.phone}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.phone);
                                soundEffects.playClick();
                              }}
                              className="ml-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
                              title="Sao chép SĐT"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>

                          <span className="inline-flex items-center gap-1 font-semibold bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-200">
                            <Mail className="w-3.5 h-3.5 text-sky-600" />
                            <span>{req.email}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.email);
                                soundEffects.playClick();
                              }}
                              className="ml-1 text-sky-600 hover:text-sky-900 cursor-pointer"
                              title="Sao chép Email"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Thời gian gửi: {new Date(req.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <a
                          href={`mailto:${req.email}?subject=${encodeURIComponent('[EasyEng] Cấp lại mật khẩu tài khoản học')}&body=${encodeURIComponent(`Xin chào ${req.fullName},\n\nQuản trị viên EasyEng đã nhận được yêu cầu cấp lại mật khẩu của bạn cho tài khoản "${req.nickname}".\n\nMật khẩu mới của bạn là: [Nhập mật khẩu mới từ 4-16 ký tự]\n\nBạn có thể đăng nhập ngay tại EasyEng và đổi lại mật khẩu trong phần cài đặt tài khoản.\n\nTrân trọng!`)}`}
                          className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                          title="Gửi email phản hồi mật khẩu mới cho học sinh"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Gửi email phản hồi</span>
                        </a>

                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Xác nhận đã xử lý xong và xóa yêu cầu cấp lại mật khẩu của ${req.fullName}?`)) {
                              soundEffects.playClick();
                              setResetRequests(prev => prev.filter(r => r.id !== req.id));
                              await deletePasswordResetRequestFromCloud(req.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                          title="Đã xử lý / Xóa yêu cầu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: ACCOUNT VERIFICATION REQUESTS (XÁC MINH TÀI KHOẢN) */}
          {/* ========================================================= */}
          {activeTab === 'verifications' && (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">
                      Yêu cầu Xác minh tài khoản
                    </h3>

                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setIsLoadingVerificationRequests(true);
                    fetchAccountVerificationRequestsFromCloud().then(reqs => {
                      setVerificationRequests(reqs);
                      setIsLoadingVerificationRequests(false);
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingVerificationRequests ? 'animate-spin' : ''}`} />
                  <span>Làm mới</span>
                </button>
              </div>

              {/* Notification Banner when account session was unlocked */}
              {unlockedSessionMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{unlockedSessionMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnlockedSessionMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Requests List */}
              {isLoadingVerificationRequests ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                  <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Đang tải danh sách yêu cầu từ Cloud Firestore...</p>
                </div>
              ) : verificationRequests.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-display font-bold text-base text-slate-800">
                    Không có yêu cầu xác minh tài khoản nào
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Hiện tại các tài khoản đều đăng nhập bình thường. Khi học sinh hoặc phụ huynh gặp cảnh báo tài khoản đang đăng nhập trên thiết bị khác và bấm "Xác minh tài khoản", thông tin sẽ hiển thị ở đây và gửi tới email <span className="font-bold text-slate-700">{ADMIN_EMAIL}</span>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verificationRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-rose-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-slate-900">
                            {req.fullName}
                          </span>
                          <span className="text-xs bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                            Nickname: {req.nickname}
                          </span>
                          {req.deviceInfo && (
                            <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
                              Thiết bị gửi: {req.deviceInfo}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 font-semibold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{req.phone}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.phone);
                                soundEffects.playClick();
                              }}
                              className="ml-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
                              title="Sao chép SĐT"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>

                          <span className="inline-flex items-center gap-1 font-semibold bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg border border-sky-200">
                            <Mail className="w-3.5 h-3.5 text-sky-600" />
                            <span>{req.email}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(req.email);
                                soundEffects.playClick();
                              }}
                              className="ml-1 text-sky-600 hover:text-sky-900 cursor-pointer"
                              title="Sao chép Email"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Thời gian gửi: {new Date(req.createdAt).toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {/* Nút Mở khóa đăng nhập / Ngắt kết nối thiết bị khác */}
                        <button
                          type="button"
                          onClick={async () => {
                            soundEffects.playClick();
                            const matchedLearner = learners.find(l => {
                              const nick = resolveValidUsername(l.username, l.name).toLowerCase();
                              return nick === req.nickname.toLowerCase() || (l.username && l.username.toLowerCase() === req.nickname.toLowerCase());
                            });
                            const targetLearnerId = matchedLearner ? matchedLearner.learnerId : req.nickname;
                            await clearAccountActiveSession(targetLearnerId);
                            soundEffects.playSuccess();
                            setUnlockedSessionMsg(
                              `Đã mở khóa phiên và ngắt kết nối các thiết bị khác cho tài khoản "${req.nickname}" (${req.fullName}) thành công! Học sinh có thể đăng nhập lại ngay.`
                            );
                            setTimeout(() => setUnlockedSessionMsg(null), 6000);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                          title="Ngắt kết nối các thiết bị khác và cho phép học sinh đăng nhập lại ngay"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Mở khóa phiên đăng nhập</span>
                        </button>

                        {/* Nút Gửi email phản hồi */}
                        <a
                          href={`mailto:${req.email}?subject=${encodeURIComponent(`[EasyEng] Xác minh tài khoản và hỗ trợ mở khóa: ${req.fullName}`)}&body=${encodeURIComponent(
                            `Xin chào ${req.fullName},\n\n` +
                            `Quản trị viên EasyEng đã tiếp nhận yêu cầu xác minh tài khoản "${req.nickname}" của bạn.\n\n` +
                            `Hệ thống đã tiến hành ngắt kết nối các phiên đăng nhập trên thiết bị khác và bảo vệ an toàn cho tài khoản của bạn. Hiện tại bạn đã có thể đăng nhập lại bình thường.\n\n` +
                            `Nếu bạn nghi ngờ mật khẩu đã bị lộ, vui lòng đổi mật khẩu mới trong phần Cài đặt tài khoản sau khi đăng nhập.\n\n` +
                            `Trân trọng,\nQuản trị viên EasyEng`
                          )}`}
                          className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                          title="Gửi email phản hồi xác nhận cho học sinh"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Gửi email phản hồi</span>
                        </a>

                        {/* Nút Xóa yêu cầu */}
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`Xác nhận đã xử lý xong và xóa yêu cầu xác minh tài khoản của ${req.fullName}?`)) {
                              soundEffects.playClick();
                              setVerificationRequests(prev => prev.filter(r => r.id !== req.id));
                              await deleteAccountVerificationRequestFromCloud(req.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                          title="Đã xử lý / Xóa yêu cầu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL LOAD JSON CHO TỪNG CỤM BÀI TẬP */}
      {clusterJsonModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                  <span>📥 Load JSON cho Học phần {clusterJsonModal.clusterIndex + 1}: {clusterJsonModal.title}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Dán mã JSON trích xuất từ tài liệu PDF bài tập hoặc tải tệp .json từ máy tính
                </p>
              </div>
              <button
                type="button"
                onClick={() => setClusterJsonModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Selector & Toolbar */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={clusterFileInputRef}
                    accept=".json"
                    onChange={handleClusterFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => clusterFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Chọn tệp .json từ máy
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {clusterJsonModal.rawText && (
                    <button
                      type="button"
                      onClick={handleCopyClusterJson}
                      className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition hover:bg-slate-100"
                      title="Sao chép toàn bộ mã JSON này để dán sang học phần hoặc lớp khác"
                    >
                      {copiedJsonSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép JSON</span>
                        </>
                      )}
                    </button>
                  )}

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    clusterJsonModal.detectedCount > 0
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}>
                    {clusterJsonModal.detectedCount > 0
                      ? `✓ Nhận diện được ${clusterJsonModal.detectedCount} câu hỏi`
                      : 'Chưa có câu hỏi'}
                  </span>
                </div>
              </div>

              {/* Quick Preset Selector */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                <span className="font-bold text-slate-700 shrink-0">
                  ⚡ Nạp tệp JSON mẫu có sẵn:
                </span>
                <select
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (isNaN(idx) || idx < 0) return;
                    const tpl = BUILT_IN_WORKBOOK_TEMPLATES[idx];
                    if (tpl) {
                      soundEffects.playClick();
                      handleClusterJsonTextChange(JSON.stringify(tpl.data, null, 2));
                    }
                  }}
                  defaultValue=""
                  className="px-2.5 py-1 bg-white border border-purple-200 text-purple-900 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer flex-1 max-w-sm"
                >
                  <option value="" disabled>-- Chọn tệp bài tập mẫu ({BUILT_IN_WORKBOOK_TEMPLATES.length} tệp) --</option>
                  {BUILT_IN_WORKBOOK_TEMPLATES.map((tpl, i) => (
                    <option key={i} value={i}>
                      {tpl.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guidance on JSON structure */}
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-2.5 text-[11px] text-amber-900 leading-relaxed space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                💡 Cấu trúc JSON bài tập được hệ thống hỗ trợ:
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-800/90">
                <li><strong>Định dạng Workbook SGK:</strong> Gồm các trường <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">book_title</code>, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">cluster_name / module_name</code> và mảng <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">units -&gt; sections -&gt; exercises -&gt; questions / pairs</code>.</li>
                <li><strong>Định dạng Trắc nghiệm đơn giản:</strong> Mảng danh sách <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">[ &#123; question, options: [...], answerIndex: 0, explanation: "..." &#125; ]</code>.</li>
              </ul>
            </div>

            {/* Textarea */}
            <textarea
              value={clusterJsonModal.rawText}
              onChange={(e) => handleClusterJsonTextChange(e.target.value)}
              placeholder="Dán mã JSON bài tập tại đây (mảng [ { question: '...', options: [...] } ] hoặc định dạng NotebookLM)..."
              className="w-full h-64 p-3 bg-slate-900 text-amber-300 font-mono text-xs rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none selection:bg-purple-600 selection:text-white"
              spellCheck={false}
            />

            {clusterJsonModal.error && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{clusterJsonModal.error}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClusterJsonModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyClusterJson}
                disabled={clusterJsonModal.detectedCount === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-display font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Áp dụng vào Học phần {clusterJsonModal.clusterIndex + 1}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
