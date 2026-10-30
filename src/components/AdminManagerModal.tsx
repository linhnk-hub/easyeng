import React, { useState, useRef, useEffect } from 'react';
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
  Shield,
  ShieldAlert,
  CheckCircle2,
  Search,
  Clock,
  Laptop,
  ExternalLink,
  Send,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Award,
  Star,
  Calendar,
  Activity,
  History,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  UserProfile,
  UnitData,
  ExerciseCluster,
  PasswordResetRequest,
  AccountVerificationRequest,
  UserActivityLogItem,
  UserActiveSession
} from '../types';
import { AVATARS, BADGES } from '../data/unitsData';
import { soundEffects } from '../services/soundEffects';
import { renderAvatarContent, CustomAvatarItem } from '../utils/avatarUtils';
import { getGradeLevelName, getDefaultGradeEmoji, getDefaultGradeDescription, ALL_12_GRADES, normalizeGradeUnits, GRADE_12_METADATA } from '../utils/gradeUtils';
import { clearAppCache } from '../utils/cacheUtils';
import { parseExerciseJson, createDefaultClusters, createEmptyCluster, BUILT_IN_WORKBOOK_TEMPLATES } from '../utils/exerciseUtils';
import { EasyEngLogo } from './EasyEngLogo';
import {
  resolveValidUsername,
  generateDefaultUsernameFromName,
  validatePassword,
  validateFullName,
  validateUsername
} from '../utils/userUtils';
import {
  fetchPasswordResetRequestsFromCloud,
  deletePasswordResetRequestFromCloud,
  fetchAccountVerificationRequestsFromCloud,
  deleteAccountVerificationRequestFromCloud,
  clearAccountActiveSession,
  fetchLearnersFromCloud,
  subscribeToAllActiveSessions,
  isLearnerOnline
} from '../services/firebase';

const ADMIN_EMAIL = 'admin@easyeng.online';

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
  onRefreshLearners?: () => Promise<void> | void;
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
  onRefreshAllData?: () => Promise<void> | void;
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
  onRefreshLearners,
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
  onSaveExercises,
  onRefreshAllData
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem('easyeng_admin_session_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [clearCacheNotice, setClearCacheNotice] = useState<string | null>(null);

  const handleClearCacheFromLogin = async () => {
    soundEffects.playClick();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ nhớ đệm trên thiết bị này không? Sau khi xóa, trang web sẽ làm mới để đồng bộ lại dữ liệu mới nhất từ cơ sở dữ liệu.')) {
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
  const [activeTab, setActiveTab] = useState<'learners' | 'classes' | 'curriculum' | 'avatars' | 'branding' | 'resets' | 'verifications'>('learners');

  // Password Reset Requests submitted to admin (linhnk.online@gmail.com)
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoadingResetRequests, setIsLoadingResetRequests] = useState(false);

  // Account Verification Requests submitted to admin (linhnk.online@gmail.com)
  const [verificationRequests, setVerificationRequests] = useState<AccountVerificationRequest[]>([]);
  const [isLoadingVerificationRequests, setIsLoadingVerificationRequests] = useState(false);
  const [unlockedSessionMsg, setUnlockedSessionMsg] = useState<string | null>(null);

  // Search terms for request tabs & learners
  const [resetSearchTerm, setResetSearchTerm] = useState('');
  const [verificationSearchTerm, setVerificationSearchTerm] = useState('');
  const [learnerSearchTerm, setLearnerSearchTerm] = useState('');

  // Filtered learners list matching search input
  const filteredLearners = React.useMemo(() => {
    const q = learnerSearchTerm.trim().toLowerCase();
    if (!q) return learners;
    return learners.filter((learner) => {
      const username = (learner.username || '').toLowerCase();
      const name = (learner.name || '').toLowerCase();
      const phone = (learner.phone || '').toLowerCase();
      const email = (learner.email || '').toLowerCase();
      const gradeStr = `lớp ${learner.grade}`;
      const gradeNum = String(learner.grade);
      const secNum = learner.securityNumber !== undefined ? String(learner.securityNumber) : '';

      return (
        username.includes(q) ||
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        gradeStr.includes(q) ||
        gradeNum === q ||
        secNum === q
      );
    });
  }, [learners, learnerSearchTerm]);

  // Phân trang danh sách tài khoản: Tối đa 5 tài khoản 1 trang
  const LEARNERS_PER_PAGE = 5;
  const [learnerPage, setLearnerPage] = useState(1);

  // Tự động chuyển về trang 1 khi thay đổi từ khóa tìm kiếm
  useEffect(() => {
    setLearnerPage(1);
  }, [learnerSearchTerm]);

  const totalLearnerPages = Math.max(1, Math.ceil(filteredLearners.length / LEARNERS_PER_PAGE));
  const safeLearnerPage = Math.min(Math.max(1, learnerPage), totalLearnerPages);
  const paginatedLearners = React.useMemo(() => {
    const start = (safeLearnerPage - 1) * LEARNERS_PER_PAGE;
    return filteredLearners.slice(start, start + LEARNERS_PER_PAGE);
  }, [filteredLearners, safeLearnerPage]);

  // Refresh learners state & handler
  const [isRefreshingLearners, setIsRefreshingLearners] = useState(false);
  const [refreshLearnersSuccess, setRefreshLearnersSuccess] = useState<string | null>(null);

  const handleRefreshLearnersList = async () => {
    soundEffects.playClick();
    setIsRefreshingLearners(true);
    setRefreshLearnersSuccess(null);
    try {
      if (onRefreshLearners) {
        await onRefreshLearners();
      } else {
        await fetchLearnersFromCloud();
      }
      soundEffects.playSuccess();
      setRefreshLearnersSuccess('Đã làm mới danh sách tài khoản từ Cloud Firestore!');
      setTimeout(() => setRefreshLearnersSuccess(null), 3500);
    } catch (err) {
      console.warn('Refresh learners error:', err);
      soundEffects.playError();
    } finally {
      setTimeout(() => {
        setIsRefreshingLearners(false);
      }, 500);
    }
  };

  // Làm mới toàn bộ dữ liệu hệ thống kiêm dọn dẹp cache (không làm mất phiên admin)
  const [isGlobalRefreshing, setIsGlobalRefreshing] = useState(false);
  const [globalRefreshNotice, setGlobalRefreshNotice] = useState<string | null>(null);

  const handleRefreshAndClearCache = async () => {
    soundEffects.playClick();
    setIsGlobalRefreshing(true);
    setGlobalRefreshNotice(null);

    try {
      // 1. Dọn dẹp CacheStorage của trình duyệt (giữ nguyên phiên admin trong sessionStorage)
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          await Promise.all(cacheKeys.map(k => window.caches.delete(k)));
        } catch (e) {
          console.warn('Lỗi xóa CacheStorage:', e);
        }
      }

      // 2. Tải lại toàn bộ dữ liệu ứng dụng (Tài khoản, Lớp học, Json bài tập, Hình đại diện, Logo)
      if (onRefreshAllData) {
        await onRefreshAllData();
      } else if (onRefreshLearners) {
        await onRefreshLearners();
      } else {
        await fetchLearnersFromCloud();
      }

      // 3. Tải lại các yêu cầu Hỗ trợ (Cấp mật khẩu & Xác minh tài khoản)
      const [freshResets, freshVerifs] = await Promise.all([
        fetchPasswordResetRequestsFromCloud().catch(() => []),
        fetchAccountVerificationRequestsFromCloud().catch(() => [])
      ]);
      setResetRequests(freshResets);
      setVerificationRequests(freshVerifs);

      soundEffects.playSuccess();
      setGlobalRefreshNotice('Đã cập nhật toàn bộ thay đổi mới nhất và xóa bộ nhớ đệm thành công!');
      setTimeout(() => {
        setGlobalRefreshNotice(null);
      }, 3500);
    } catch (err) {
      console.warn('Lỗi làm mới toàn bộ hệ thống:', err);
      soundEffects.playError();
      setGlobalRefreshNotice('Có lỗi xảy ra khi làm mới dữ liệu. Vui lòng thử lại!');
      setTimeout(() => setGlobalRefreshNotice(null), 3500);
    } finally {
      setTimeout(() => {
        setIsGlobalRefreshing(false);
      }, 500);
    }
  };

  // Member detail modal state & Action dropdown state
  const [viewingDetailLearner, setViewingDetailLearner] = useState<UserProfile | null>(null);
  const [activeActionMenuLearnerId, setActiveActionMenuLearnerId] = useState<string | null>(null);
  const [showDetailPin, setShowDetailPin] = useState(false);
  const [showDetailSecNum, setShowDetailSecNum] = useState(false);

  // Format "Đăng nhập gần nhất"
  const formatLastLogin = (dateStr?: string): string => {
    if (!dateStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Chưa ghi nhận';
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      if (isToday) {
        return `Hôm nay ${hours}:${minutes}`;
      }
      if (isYesterday) {
        return `Hôm qua ${hours}:${minutes}`;
      }
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch {
      return 'Chưa ghi nhận';
    }
  };

  // Format thời gian chi tiết cho nhật ký hoạt động (có cả giây)
  const formatActivityTime = (dateStr?: string): string => {
    if (!dateStr) return 'Chưa ghi nhận';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Chưa ghi nhận';
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();

      if (isToday) {
        return `Hôm nay ${hours}:${minutes}:${seconds}`;
      }
      return `${hours}:${minutes}:${seconds} • ${day}/${month}/${year}`;
    } catch {
      return 'Chưa ghi nhận';
    }
  };

  // Tra cứu chính xác tên, biểu tượng và mô tả của huy hiệu
  const getBadgeDisplayInfo = (badgeId: string): { icon: string; title: string; description: string } => {
    if (!badgeId) return { icon: '🏅', title: 'Huy hiệu', description: '' };

    // 1. Tìm trong danh sách BADGES chính thức của hệ thống (unitsData.ts)
    const officialBadge = BADGES.find(
      b => b.id.toLowerCase() === String(badgeId).toLowerCase() ||
           b.title.toLowerCase() === String(badgeId).toLowerCase()
    );
    if (officialBadge) {
      return {
        icon: officialBadge.icon,
        title: officialBadge.title,
        description: officialBadge.description || officialBadge.reqSummary || ''
      };
    }

    // 2. Tìm trong danh mục huy hiệu khối lớp GRADE_12_METADATA
    const gradeMatch = Object.values(GRADE_12_METADATA).find(
      g => `grade_${g.grade}`.toLowerCase() === String(badgeId).toLowerCase() ||
           `lop_${g.grade}`.toLowerCase() === String(badgeId).toLowerCase() ||
           g.badgeTitle.toLowerCase() === String(badgeId).toLowerCase()
    );
    if (gradeMatch) {
      return {
        icon: gradeMatch.emoji,
        title: gradeMatch.badgeTitle,
        description: `Huy hiệu vinh danh ${gradeMatch.description}`
      };
    }

    // 3. Fallback: chuyển đổi id sang dạng tiêu đề dễ đọc nếu là chuỗi id tùy biến
    const cleanTitle = String(badgeId)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    return {
      icon: '🏅',
      title: cleanTitle,
      description: ''
    };
  };

  // Modal xem chi tiết toàn bộ log hoạt động & Xuất log
  const [viewingLogsLearner, setViewingLogsLearner] = useState<UserProfile | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Xuất log ra file log_têntk_ngày xuất(dd-mm-yyyy).txt
  const handleExportLearnerLog = (learner: UserProfile) => {
    soundEffects.playClick();
    const rawLogs: UserActivityLogItem[] = Array.isArray(learner.activityLogs) && learner.activityLogs.length > 0
      ? learner.activityLogs
      : [
          {
            id: 'init_act',
            activity: learner.lastActiveActivity || 'Chưa có hoạt động',
            timestamp: learner.lastActiveDate || new Date().toISOString(),
            type: 'system'
          }
        ];

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // Tên file theo đúng yêu cầu: log_têntk_ngày xuất(dd-mm-yyyy).txt
    const tentk = (learner.username || learner.name || 'taikhoan')
      .trim()
      .replace(/\s+/g, '_');
    const fileName = `log_${tentk}_${dd}-${mm}-${yyyy}.txt`;

    const reversedLogs = [...rawLogs].reverse();

    const typeConfig: Record<string, string> = {
      home: 'Trang chủ',
      game: 'Minigame',
      exercise: 'Bài tập',
      profile: 'Tài khoản',
      badges: 'Thành tích',
      login: 'Đăng nhập',
      system: 'Hệ thống'
    };

    const lines: string[] = [
      '================================================================================',
      `NHẬT KÝ HOẠT ĐỘNG TÀI KHOẢN: ${learner.username || learner.name}`,
      '================================================================================',
      `Tên đăng nhập:       ${learner.username || '—'}`,
      `Họ và tên:           ${learner.name || '—'}`,
      `Lớp:                 Lớp ${learner.grade}`,
      `Số điện thoại:       ${learner.phone || 'Chưa cập nhật'}`,
      `Email:               ${learner.email || 'Chưa cập nhật'}`,
      `Huy hiệu đã đạt:     ${Array.isArray(learner.unlockedBadges) && learner.unlockedBadges.length > 0 ? learner.unlockedBadges.map(bId => getBadgeDisplayInfo(bId).title).join(', ') : 'Chưa có'}`,
      `Thời gian xuất log:  ${hours}:${minutes}:${seconds} ngày ${dd}/${mm}/${yyyy}`,
      `Tổng số hoạt động:   ${reversedLogs.length} ghi nhận`,
      '================================================================================',
      '',
      'DANH SÁCH CHI TIẾT CÁC HOẠT ĐỘNG (XẾP TỪ MỚI NHẤT ĐẾN CŨ NHẤT):',
      '--------------------------------------------------------------------------------'
    ];

    reversedLogs.forEach((log, index) => {
      const typeLabel = typeConfig[log.type || 'home'] || 'Hoạt động';
      const timeFormatted = formatActivityTime(log.timestamp);
      lines.push(`[${String(index + 1).padStart(3, ' ')}] [${timeFormatted}] [${typeLabel}] ${log.activity}`);
    });

    lines.push('');
    lines.push('--------------------------------------------------------------------------------');
    lines.push('EasyEng - Tiếng Anh dễ mà!');
    lines.push('================================================================================');

    const fileContent = lines.join('\r\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    soundEffects.playSuccess();
    setExportNotice(`Đã xuất file log "${fileName}" thành công!`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  // Real-time Active Sessions Map
  const [activeSessionsMap, setActiveSessionsMap] = useState<Record<string, UserActiveSession>>({});

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = subscribeToAllActiveSessions((sessions) => {
      setActiveSessionsMap(sessions);
    });
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated]);

  /**
   * Quy tắc xác định tình trạng đăng nhập và hoạt động:
   * 1. Chỉ coi là "Online" khi có bản ghi active_sessions, isLoggedIn === true,
   *    không có terminationReason, và nhịp tim trong vòng 3 phút.
   * 2. Nếu không trực tuyến -> Hiển thị "Offline", hoạt động hiển thị "Đã đăng xuất",
   *    "Chưa đăng nhập" hoặc "Lần cuối: ...". Tuyệt đối không để "Đang ở Trang chủ" với chấm xanh hoạt động.
   */
  const getLearnerOnlineInfo = (learner: UserProfile) => {
    const session =
      activeSessionsMap[learner.learnerId] ||
      activeSessionsMap[learner.learnerId.toLowerCase()] ||
      (learner.username ? activeSessionsMap[learner.username.toLowerCase()] : undefined);

    const isOnline = isLearnerOnline(session);

    if (isOnline) {
      const rawActivity = learner.lastActiveActivity;
      const activityDisplay =
        rawActivity && rawActivity !== 'Đã đăng xuất' && rawActivity !== 'Chưa có hoạt động'
          ? rawActivity
          : 'Đang ở Trang chủ';

      return {
        isOnline: true,
        statusBadgeText: 'Online',
        statusBadgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        activityDisplay,
        activityBadgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200/70',
        activityIconColor: 'text-emerald-500',
      };
    }

    // Tài khoản Offline
    const rawActivity = learner.lastActiveActivity;
    let activityDisplay = 'Chưa đăng nhập';
    if (rawActivity === 'Đã đăng xuất') {
      activityDisplay = 'Đã đăng xuất';
    } else if (rawActivity && rawActivity !== 'Chưa có hoạt động') {
      const cleaned = rawActivity.replace(/^Đang\s+/i, '');
      activityDisplay = `Lần cuối: ${cleaned}`;
    } else if (learner.lastLoginAt || learner.lastActiveDate) {
      activityDisplay = 'Offline';
    }

    return {
      isOnline: false,
      statusBadgeText: 'Offline',
      statusBadgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
      dotClass: 'bg-slate-400',
      activityDisplay,
      activityBadgeClass: 'text-slate-600 bg-slate-50 border-slate-200/70',
      activityIconColor: 'text-slate-400',
    };
  };

  // Email Reply Modal State (Nội dung soạn sẵn, sao chép dán vào trình duyệt, KHÔNG mở mailto client)
  interface EmailReplyModalState {
    isOpen: boolean;
    type: 'reset' | 'verification';
    reqId: string;
    recipient: string;
    fullName?: string;
    username?: string;
    nickname?: string;
    phone?: string;
    subject: string;
    body: string;
    newPassword?: string;
  }
  const [emailReplyModal, setEmailReplyModal] = useState<EmailReplyModalState | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (fieldKey: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      soundEffects.playClick();
      setCopiedField(fieldKey);
      setTimeout(() => {
        setCopiedField(prev => (prev === fieldKey ? null : prev));
      }, 2500);
    } catch (e) {
      console.warn('Copy text error:', e);
    }
  };

  const handleOpenResetEmailReply = (req: PasswordResetRequest) => {
    soundEffects.playClick();
    const defaultPassword = '123456';
    const accountUser = req.username || req.nickname || 'học sinh';
    const greetingName = req.fullName || accountUser;
    const subject = `[EasyEng] Cấp lại mật khẩu tài khoản: ${accountUser}`;
    const body = `Xin chào ${greetingName},

EasyEng đã tiếp nhận và xử lý yêu cầu cấp lại mật khẩu của bạn.

Thông tin tài khoản:
- Tên tài khoản: ${accountUser}
- Mật khẩu cấp mới: ${defaultPassword}

Bạn vui lòng truy cập website EasyEng trên trình duyệt, đăng nhập bằng Tên tài khoản và Mật khẩu mới ở trên. Sau khi đăng nhập thành công, bạn nên vào phần "Cài đặt tài khoản" để đổi lại mật khẩu cá nhân theo ý muốn.

Nếu bạn cần hỗ trợ thêm, hãy phản hồi lại qua email này.

Chúc bạn học tập thật tốt cùng EasyEng!
Trân trọng,
EasyEng`;

    setEmailReplyModal({
      isOpen: true,
      type: 'reset',
      reqId: req.id,
      recipient: req.email,
      fullName: req.fullName || accountUser,
      username: accountUser,
      nickname: accountUser,
      phone: req.phone,
      subject,
      body,
      newPassword: defaultPassword
    });
  };

  const handleOpenVerificationEmailReply = (req: AccountVerificationRequest) => {
    soundEffects.playClick();
    const accountUser = req.username || req.nickname || 'học sinh';
    const greetingName = req.fullName || accountUser;
    const subject = `[EasyEng] Xác minh tài khoản và hỗ trợ mở khóa: ${accountUser}`;
    const body = `Xin chào ${greetingName},

EasyEng đã tiếp nhận và xử lý yêu cầu xác minh tài khoản "${accountUser}" của bạn.

Hệ thống đã tiến hành:
> Xác minh quyền sở hữu tài khoản thành công.
> Ngắt kết nối phiên đăng nhập trên thiết bị lạ để bảo vệ an toàn cho tài khoản.
> Hiện tại bạn đã có thể đăng nhập lại vào ứng dụng EasyEng bình thường trên thiết bị của mình.
* Lưu ý: Nếu bạn nghi ngờ mật khẩu đã từng bị người khác biết, vui lòng đổi mật khẩu mới trong phần "Cài đặt tài khoản" ngay sau khi đăng nhập.

Chúc bạn có những giờ học tập hiệu quả cùng EasyEng!
Trân trọng,
EasyEng`;

    setEmailReplyModal({
      isOpen: true,
      type: 'verification',
      reqId: req.id,
      recipient: req.email,
      fullName: req.fullName || accountUser,
      username: accountUser,
      nickname: accountUser,
      phone: req.phone,
      subject,
      body
    });
  };

  const handleUpdateResetPassword = (newPass: string) => {
    if (!emailReplyModal) return;
    const oldPass = emailReplyModal.newPassword || '123456';
    const updatedBody = emailReplyModal.body.includes(oldPass)
      ? emailReplyModal.body.replace(oldPass, newPass)
      : emailReplyModal.body;
    setEmailReplyModal({
      ...emailReplyModal,
      newPassword: newPass,
      body: updatedBody
    });
  };

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

  // Learners Tab editing state
  const [editingLearnerId, setEditingLearnerId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editGrade, setEditGrade] = useState<number>(4);
  const [editAvatar, setEditAvatar] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editPinConfirm, setEditPinConfirm] = useState('');
  const [editPinError, setEditPinError] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSecurityNumber, setEditSecurityNumber] = useState<number>(0);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Add Learner state
  const [isAddingLearner, setIsAddingLearner] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newGrade, setNewGrade] = useState<number>(4);
  const [newAvatar, setNewAvatar] = useState('🎓');
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [newPinError, setNewPinError] = useState<string | null>(null);
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSecurityNumber, setNewSecurityNumber] = useState<number>(0);
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
      setExerciseSaveSuccess(`Đã lưu và đồng bộ thành công ${current.length} Học phần bài tập Lớp ${selectedExerciseGrade} lên Cloud Firestore! Dữ liệu đã có hiệu lực.`);
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
      try {
        sessionStorage.setItem('easyeng_admin_session_auth', 'true');
      } catch {}
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
    setEditName(l.name);
    setEditUsername(l.username || resolveValidUsername(l.username, l.name));
    setEditGrade(l.grade);
    setEditAvatar(l.avatar);
    setEditPin(l.pin ? l.pin : '');
    setEditPinConfirm(l.pin ? l.pin : '');
    setEditPhone(l.phone || '');
    setEditEmail(l.email || '');
    setEditSecurityNumber(l.securityNumber !== undefined && l.securityNumber !== null ? Number(l.securityNumber) : 0);
    setEditPinError(null);
    setEditFormError(null);
  };

  // Save edited learner
  const handleSaveEditLearner = (original: UserProfile) => {
    setEditPinError(null);
    setEditFormError(null);

    // 1. Validate Tên đăng nhập: 4 - 16 kí tự, dùng để đăng nhập, không được viết hoa, không được có kí tự đặc biệt, có thể có số
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
            resolveValidUsername(l.username, l.name).toLowerCase() === cleanUsername.toLowerCase())
    );
    if (usernameConflict) {
      soundEffects.playError();
      setEditFormError(`Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống (tài khoản: ${usernameConflict.username || usernameConflict.name})!`);
      return;
    }

    // 2. Validate Mật khẩu: tối thiểu 4 kí tự, tối đa 16 kí tự bao gồm cả chữ, số và ký tự đặc biệt
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
      fullName: '',
      nickname: cleanUsername,
      username: cleanUsername,
      name: cleanUsername,
      grade: Number(editGrade) || original.grade || 4,
      avatar: editAvatar || original.avatar,
      pin: editPin,
      phone: cleanPhone,
      email: cleanEmail,
      securityNumber: Math.max(0, Math.min(10, Math.round(Number(editSecurityNumber) || 0)))
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

    // 1. Validate Tên đăng nhập / Username: 4 - 16 kí tự, dùng để đăng nhập, không được viết hoa, không được có kí tự đặc biệt, có thể có số
    const cleanNewUsername = newUsername.trim().toLowerCase();
    const userVal = validateUsername(cleanNewUsername);
    if (!userVal.isValid) {
      soundEffects.playError();
      setNewFormError(userVal.error || 'Tên đăng nhập không hợp lệ (4 - 16 ký tự, chữ thường và số, không viết hoa, không ký tự đặc biệt)!');
      return;
    }

    const usernameConflict = learners.find(
      l => (l.username && l.username.toLowerCase() === cleanNewUsername.toLowerCase()) ||
           resolveValidUsername(l.username, l.name).toLowerCase() === cleanNewUsername.toLowerCase()
    );
    if (usernameConflict) {
      soundEffects.playError();
      setNewFormError(`Tên đăng nhập "${cleanNewUsername}" đã tồn tại trong hệ thống (tài khoản: ${usernameConflict.username || usernameConflict.name})!`);
      return;
    }

    // 2. Validate Mật khẩu: tối thiểu 4 kí tự, tối đa 16 kí tự bao gồm cả chữ, số và ký tự đặc biệt
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
      fullName: '',
      nickname: cleanNewUsername,
      username: cleanNewUsername,
      grade: Number(newGrade) || 4,
      name: cleanNewUsername,
      avatar: newAvatar,
      pin: newPin,
      phone: cleanPhone,
      email: cleanEmail,
      securityNumber: Math.max(0, Math.min(10, Math.round(Number(newSecurityNumber) || 0))),
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
    setNewName('');
    setNewUsername('');
    setNewPin('');
    setNewPinConfirm('');
    setNewPhone('');
    setNewEmail('');
    setNewSecurityNumber(0);
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
      const normalized = normalizeGradeUnits(parsed);
      soundEffects.playSuccess();
      onSaveCurriculum(selectedJsonGrade, normalized);
      setJsonSuccess(`Đã lưu thành công ${normalized.length} Unit cho Lớp ${selectedJsonGrade}!`);
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

  // Hàm đối chiếu dữ liệu giữa thông tin người dùng gửi lên và thông tin có trong CSDL
  const renderVerificationAuditCard = (req: PasswordResetRequest | AccountVerificationRequest) => {
    const cleanUsername = (req.username || req.nickname || '').trim().toLowerCase();
    const reqLearnerId = ('learnerId' in req && req.learnerId ? req.learnerId.trim() : '');

    // Tìm tài khoản tương ứng trong CSDL
    const matchedLearner = learners.find(l => {
      const u = (l.username || '').toLowerCase();
      const n = (l.name || '').toLowerCase();
      const id = (l.learnerId || '').toLowerCase();
      return (reqLearnerId && id === reqLearnerId.toLowerCase()) ||
             (cleanUsername && (id === cleanUsername || u === cleanUsername || n === cleanUsername)) ||
             (req.email && l.email && l.email.trim().toLowerCase() === req.email.trim().toLowerCase());
    });

    // 1. Kiểm tra username
    const usernameEntered = req.username || req.nickname || '—';
    const csdlUsername = matchedLearner ? (matchedLearner.username || matchedLearner.name) : 'Không tìm thấy';
    const isUsernameMatch = !!(matchedLearner && (
      (matchedLearner.username && matchedLearner.username.toLowerCase() === cleanUsername) ||
      (matchedLearner.name && matchedLearner.name.toLowerCase() === cleanUsername) ||
      (matchedLearner.learnerId && matchedLearner.learnerId.toLowerCase() === cleanUsername)
    ));

    // 2. Kiểm tra email
    const emailEntered = (req.email || '').trim().toLowerCase();
    const csdlEmail = (matchedLearner?.email || '').trim().toLowerCase();
    const isEmailMatch = Boolean(emailEntered && csdlEmail && emailEntered === csdlEmail);

    // 3. Kiểm tra số điện thoại (SĐT không bắt buộc)
    const phoneEntered = (req.phone || '').trim();
    const csdlPhone = (matchedLearner?.phone || '').trim();
    const hasPhoneProvided = phoneEntered.length > 0;
    const isPhoneMatch = hasPhoneProvided ? (csdlPhone.length > 0 && phoneEntered === csdlPhone) : null;

    // 4. Kiểm tra số bảo mật (câu hỏi bí mật, 0 đến 10)
    const secEntered = req.securityNumber;
    const csdlSec = matchedLearner?.securityNumber !== undefined ? matchedLearner.securityNumber : 0;
    const isSecMatch = secEntered !== undefined && secEntered === csdlSec;

    // Tính điểm đối chiếu theo 4 tiêu chí chuẩn: Tên đăng nhập, Email, Số điện thoại, Số bảo mật (câu hỏi bí mật)
    const isPhoneChecked = Boolean(hasPhoneProvided && isPhoneMatch);
    let matchScore = 0;
    if (isUsernameMatch) matchScore += 1;
    if (isEmailMatch) matchScore += 1;
    if (isSecMatch) matchScore += 1;
    if (isPhoneChecked) matchScore += 1;
    const totalChecks = 4;

    let badgeText = '';
    let badgeBg = '';
    let badgeBorder = '';
    let badgeTextCol = '';
    let badgeIcon = '';

    if (!matchedLearner) {
      badgeText = 'Không tìm thấy tài khoản trong CSDL';
      badgeBg = 'bg-rose-50';
      badgeBorder = 'border-rose-200';
      badgeTextCol = 'text-rose-700';
      badgeIcon = '⚠️';
    } else if (matchScore === totalChecks) {
      badgeText = '100% Khớp - Đúng chính chủ tài khoản';
      badgeBg = 'bg-emerald-50';
      badgeBorder = 'border-emerald-300';
      badgeTextCol = 'text-emerald-800';
      badgeIcon = '🛡️';
    } else if (matchScore >= 2 && isSecMatch) {
      // Độ tin cậy cao: chỉ xác định khi có ít nhất 2/4 thông tin khớp đúng trong đó bắt buộc phải khớp đúng câu hỏi bí mật
      badgeText = `Độ tin cậy cao (${matchScore}/4 thông tin khớp)`;
      badgeBg = 'bg-teal-50';
      badgeBorder = 'border-teal-200';
      badgeTextCol = 'text-teal-800';
      badgeIcon = '✅';
    } else if (matchScore >= 1) {
      badgeText = `Cần kiểm tra lại (${matchScore}/4 thông tin khớp)`;
      badgeBg = 'bg-amber-50';
      badgeBorder = 'border-amber-200';
      badgeTextCol = 'text-amber-800';
      badgeIcon = '🔍';
    } else {
      badgeText = 'Cảnh báo sai lệch thông tin CSDL';
      badgeBg = 'bg-rose-50';
      badgeBorder = 'border-rose-300';
      badgeTextCol = 'text-rose-800';
      badgeIcon = '❌';
    }

    const auditItems = [
      {
        label: 'Tên đăng nhập',
        entered: usernameEntered,
        csdl: csdlUsername,
        isMatch: isUsernameMatch,
        copyKey: null,
        copyVal: ''
      },
      {
        label: 'Địa chỉ Email',
        entered: req.email || '— (Bỏ trống)',
        csdl: csdlEmail || 'Chưa thiết lập',
        isMatch: isEmailMatch,
        copyKey: req.email ? `email_${req.id}` : null,
        copyVal: req.email || ''
      },
      {
        label: 'Số điện thoại',
        entered: phoneEntered || '— (Bỏ trống)',
        csdl: csdlPhone || 'Chưa thiết lập',
        isMatch: !hasPhoneProvided ? null : isPhoneMatch,
        copyKey: req.phone ? `phone_${req.id}` : null,
        copyVal: req.phone || ''
      },
      {
        label: 'Số bảo mật (câu hỏi bí mật)',
        entered: secEntered !== undefined ? `Số ${secEntered}` : 'Chưa có',
        csdl: `Số ${csdlSec}`,
        isMatch: isSecMatch,
        copyKey: null,
        copyVal: ''
      }
    ];

    return (
      <div className="mt-2.5 bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden text-xs">
        {/* Header đối chiếu */}
        <div className="px-3.5 py-2 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Đối chiếu dữ liệu xác minh với CSDL:</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeBg} ${badgeBorder} ${badgeTextCol}`}>
            <span>{badgeIcon}</span>
            <span>{badgeText}</span>
          </span>
        </div>

        {/* Danh sách so sánh theo hàng gọn gàng, không bị tràn hay cắt chữ */}
        <div className="divide-y divide-slate-200/60">
          {auditItems.map((item, itemIdx) => (
            <div key={itemIdx} className="px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-white/80 transition">
              {/* Mục */}
              <div className="w-28 shrink-0 font-bold text-slate-500">
                {item.label}:
              </div>

              {/* Thông tin nhập & CSDL */}
              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-4 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-medium">Nhập:</span>
                  <span className="font-mono font-bold text-slate-800 break-all">{item.entered}</span>
                  {item.copyKey && item.copyVal && (
                    <button
                      type="button"
                      onClick={() => handleCopyText(item.copyKey!, item.copyVal)}
                      className="text-slate-400 hover:text-amber-600 p-0.5 rounded cursor-pointer transition"
                      title="Sao chép"
                    >
                      {copiedField === item.copyKey ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="text-slate-400 font-medium">CSDL:</span>
                  <span className="font-medium text-slate-700 break-all">{item.csdl}</span>
                </div>
              </div>

              {/* Trạng thái đối chiếu */}
              <div className="shrink-0 self-start sm:self-center">
                {item.isMatch === null ? (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                    Bỏ trống
                  </span>
                ) : item.isMatch ? (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> Khớp CSDL
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 inline-flex items-center gap-1">
                    <X className="w-3 h-3 text-rose-500" /> Không khớp
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
                <span>{isClearingCache ? 'Đang dọn dẹp bộ nhớ đệm...' : 'Xóa bộ nhớ đệm'}</span>
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
      <div className="bg-[#F8FAFC] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-bold text-xl text-slate-900">
              Cài đặt hệ thống
            </h2>

            {/* Nút làm mới kiêm dọn dẹp cache không cần F5 */}
            <button
              type="button"
              onClick={handleRefreshAndClearCache}
              disabled={isGlobalRefreshing}
              className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center shrink-0 ${
                isGlobalRefreshing
                  ? 'bg-amber-50 text-amber-600 border-amber-300'
                  : 'bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border-slate-200'
              }`}
              title="Làm mới dữ liệu & xóa bộ nhớ đệm (cập nhật toàn bộ thay đổi mà không cần tải lại trang F5)"
            >
              <RotateCcw className={`w-4 h-4 ${isGlobalRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>
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
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo kết quả làm mới dữ liệu & xóa cache */}
        {globalRefreshNotice && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs font-semibold text-emerald-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{globalRefreshNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setGlobalRefreshNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Navigation - 4 Nhóm chính */}
        <div className="flex px-4 sm:px-6 border-b border-slate-200 bg-white gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden shrink-0 h-14 sm:h-16 items-stretch scrollbar-none">
          {/* 1. Tài khoản */}
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('learners');
            }}
            className={`px-4 sm:px-5 font-display font-bold text-sm border-b-2 transition flex items-center justify-center cursor-pointer shrink-0 whitespace-nowrap -mb-px ${
              activeTab === 'learners'
                ? 'border-amber-500 text-amber-700 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Tài khoản</span>
          </button>

          {/* 2. Nhóm Lớp học (Lớp học + Json) */}
          <button
            onClick={() => {
              soundEffects.playClick();
              if (activeTab !== 'classes' && activeTab !== 'curriculum') {
                setActiveTab('classes');
              }
            }}
            className={`px-4 sm:px-5 font-display font-bold text-sm border-b-2 transition flex items-center justify-center cursor-pointer shrink-0 whitespace-nowrap -mb-px ${
              activeTab === 'classes' || activeTab === 'curriculum'
                ? 'border-amber-500 text-amber-700 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Lớp học</span>
          </button>

          {/* 3. Nhóm Hình ảnh (Hình đại diện + Logo) */}
          <button
            onClick={() => {
              soundEffects.playClick();
              if (activeTab !== 'avatars' && activeTab !== 'branding') {
                setActiveTab('avatars');
              }
            }}
            className={`px-4 sm:px-5 font-display font-bold text-sm border-b-2 transition flex items-center justify-center cursor-pointer shrink-0 whitespace-nowrap -mb-px ${
              activeTab === 'avatars' || activeTab === 'branding'
                ? 'border-amber-500 text-amber-700 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Hình ảnh</span>
          </button>

          {/* 4. Nhóm Hỗ trợ (Cấp mật khẩu + Xác minh tài khoản) */}
          <button
            onClick={() => {
              soundEffects.playClick();
              if (activeTab !== 'resets' && activeTab !== 'verifications') {
                setActiveTab('resets');
              }
            }}
            className={`px-4 sm:px-5 font-display font-bold text-sm border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap -mb-px ${
              activeTab === 'resets' || activeTab === 'verifications'
                ? 'border-amber-500 text-amber-700 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Hỗ trợ</span>
            {(resetRequests.length + verificationRequests.length) > 0 && (
              <span className="text-[11px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full leading-none">
                {resetRequests.length + verificationRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Thanh Menu con cho các Nhóm (Sub-bars) */}
        {(activeTab === 'classes' || activeTab === 'curriculum') && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('classes');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center transition cursor-pointer ${
                activeTab === 'classes'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Lớp học</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('curriculum');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center transition cursor-pointer ${
                activeTab === 'curriculum'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Json</span>
            </button>
          </div>
        )}

        {(activeTab === 'avatars' || activeTab === 'branding') && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('avatars');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center transition cursor-pointer ${
                activeTab === 'avatars'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Hình đại diện</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('branding');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center transition cursor-pointer ${
                activeTab === 'branding'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Logo EasyEng</span>
            </button>
          </div>
        )}

        {(activeTab === 'resets' || activeTab === 'verifications') && (
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">

            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('resets');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'resets'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Cấp mật khẩu</span>
              {resetRequests.length > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full leading-none">
                  {resetRequests.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setActiveTab('verifications');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'verifications'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Xác minh tài khoản</span>
              {verificationRequests.length > 0 && (
                <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full leading-none">
                  {verificationRequests.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">

          {/* ========================================================= */}
          {/* TAB 1: LEARNERS ACCOUNT MANAGEMENT */}
          {/* ========================================================= */}
          {activeTab === 'learners' && (
            <div className="space-y-6">
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

                {refreshLearnersSuccess && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{refreshLearnersSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRefreshLearnersSuccess(null)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-bold text-lg text-slate-800">
                      Danh sách tài khoản
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                      {learnerSearchTerm.trim() ? `${filteredLearners.length}/${learners.length}` : learners.length} tài khoản
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={learnerSearchTerm}
                        onChange={(e) => setLearnerSearchTerm(e.target.value)}
                        placeholder="Tìm tên đăng nhập, họ tên, SĐT, lớp..."
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition shadow-2xs"
                      />
                      {learnerSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setLearnerSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                          title="Xóa tìm kiếm"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Refresh Button */}
                    <button
                      type="button"
                      onClick={handleRefreshLearnersList}
                      disabled={isRefreshingLearners}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-60"
                      title="Làm mới danh sách tài khoản từ Cloud"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRefreshingLearners ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
                      <span className="hidden sm:inline">Làm mới</span>
                    </button>

                    {!isAddingLearner && (
                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          setIsAddingLearner(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Thêm tài khoản
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Learner Form */}
                {isAddingLearner && (
                  <form onSubmit={handleCreateLearner} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-sm text-slate-800">
                        Tạo tài khoản mới
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingLearner(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-amber-600" />Tên đăng nhập <span className="text-rose-500">*</span>:
                          </span>
                        </label>
                        <input
                          type="text"
                          maxLength={16}
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          value={newUsername}
                          onChange={(e) => {
                            setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                            setNewFormError(null);
                          }}
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 lowercase"
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
                        <label className="block text-xs font-bold text-slate-600 mb-1">Hình đại diện:</label>
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

                    {/* Số điện thoại, Email và Số bảo mật  */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-amber-600" /> SĐT:
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
                      <div>
                        <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-indigo-600" /> Số bảo mật:
                          </span>
                        </label>
                        <select
                          value={newSecurityNumber}
                          onChange={(e) => setNewSecurityNumber(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                        >
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>
                              Số: {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {newFormError && (
                      <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {newFormError}
                      </p>
                    )}

                    {/* Mật khẩu đăng nhập */}
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
                {filteredLearners.length === 0 ? (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                    <div className="w-11 h-11 mx-auto rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Không tìm thấy tài khoản phù hợp
                    </p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Không có tài khoản nào khớp với từ khóa &ldquo;{learnerSearchTerm}&rdquo;. Vui lòng thử tìm với tên đăng nhập, họ tên, số điện thoại hoặc lớp khác.
                    </p>
                    <button
                      type="button"
                      onClick={() => setLearnerSearchTerm('')}
                      className="mt-1 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                    {paginatedLearners.map((learner) => {
                    const isEditing = editingLearnerId === learner.learnerId;

                    if (isEditing) {
                      return (
                        <div key={learner.learnerId} className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-amber-300 shadow-sm space-y-3.5">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800">
                              Đang chỉnh sửa hồ sơ: {learner.username || learner.name}
                            </span>
                            <button
                              onClick={() => setEditingLearnerId(null)}
                              className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 text-amber-600" />Tên đăng nhập <span className="text-rose-500">*</span>:
                                </span>
                              </label>
                              <input
                                type="text"
                                maxLength={16}
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                value={editUsername}
                                onChange={(e) => {
                                  setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                                  setEditFormError(null);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 lowercase"
                                required
                              />
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
                              <label className="block text-xs font-bold text-slate-600 mb-1">Hình đại diện:</label>
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

                          {/* SĐT, Email và Số bảo mật  */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200/80">
                            <div>
                              <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5 text-amber-600" /> SĐT (không bắt buộc):
                                </span>
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
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                            </div>
                            <div>
                              <label className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                                <span className="flex items-center gap-1">
                                  <Shield className="w-3.5 h-3.5 text-indigo-600" /> Số bảo mật:
                                </span>
                              </label>
                              <select
                                value={editSecurityNumber}
                                onChange={(e) => setEditSecurityNumber(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                              >
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                  <option key={n} value={n}>
                                    Số: {n}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {editFormError && (
                            <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {editFormError}
                            </p>
                          )}

                          {/* Avatar preview */}
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-xs font-bold text-slate-500">Hình đang chọn:</span>
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
                              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5 transition active:scale-95"
                            >
                              <Save className="w-3.5 h-3.5" /> Lưu
                            </button>
                          </div>
                        </div>
                      );
                    }

                    const isMenuOpen = activeActionMenuLearnerId === learner.learnerId;
                    const lastLoginDisplay = formatLastLogin(learner.lastLoginAt || learner.lastActiveDate);
                    const onlineInfo = getLearnerOnlineInfo(learner);

                    return (
                      <div
                        key={learner.learnerId}
                        className={`group relative p-3 sm:px-4 sm:py-3.5 rounded-2xl bg-white border ${
                          isMenuOpen
                            ? 'border-amber-400 ring-2 ring-amber-100 shadow-sm'
                            : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                        } transition-all duration-150 flex items-center justify-between gap-3 shadow-2xs`}
                      >
                        {/* Cụm thông tin tài khoản: Hình đại diện, Tên đăng nhập & Đăng nhập gần nhất */}
                        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                          {/* Hình đại diện */}
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/90 flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-2xs">
                            {renderAvatarContent(learner.avatar)}
                          </div>

                          {/* Tên đăng nhập & Đăng nhập gần nhất */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-display font-bold text-sm sm:text-base text-slate-900 font-mono tracking-tight">
                                {learner.username || resolveValidUsername(learner.username, learner.name)}
                              </span>
                              {learner.name && learner.name.toLowerCase() !== (learner.username || '').toLowerCase() && (
                                <span className="text-xs text-slate-500 font-medium hidden xs:inline">
                                  ({learner.name})
                                </span>
                              )}
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                                Lớp {learner.grade}
                              </span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${onlineInfo.statusBadgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${onlineInfo.dotClass} ${onlineInfo.isOnline ? 'animate-pulse' : ''}`} />
                                {onlineInfo.statusBadgeText}
                              </span>
                            </div>

                            {/* Mục Đăng nhập gần nhất & Hoạt động: ẩn trên điện thoại (<sm), hiện từ sm trở lên */}
                            <div className="hidden sm:flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500 font-medium">
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <span className="text-slate-500">Đăng nhập:</span>
                                <span className="font-semibold text-slate-700">{lastLoginDisplay}</span>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Activity className={`w-3.5 h-3.5 ${onlineInfo.activityIconColor} shrink-0`} />
                                <span className="text-slate-500">Hoạt động:</span>
                                <span
                                  className={`font-semibold px-2 py-0.5 rounded-md border truncate max-w-[190px] sm:max-w-[280px] ${onlineInfo.activityBadgeClass}`}
                                  title={onlineInfo.activityDisplay}
                                >
                                  {onlineInfo.activityDisplay}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Khi rà chuột lên hàng của tài khoản nào thì góc bên phải hiện nút Chi tiết và nút Hành động */}
                        <div className={`flex items-center gap-1.5 shrink-0 transition-opacity duration-150 relative ${
                          isMenuOpen ? 'opacity-100 z-30' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100'
                        }`}>
                          {/* Nút Chi tiết */}
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setShowDetailPin(false);
                              setShowDetailSecNum(false);
                              setViewingDetailLearner(learner);
                              setActiveActionMenuLearnerId(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                            title="Xem chi tiết bảng thông tin thành viên"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                            
                          </button>

                          {/* Nút Hành động */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                soundEffects.playClick();
                                setActiveActionMenuLearnerId(isMenuOpen ? null : learner.learnerId);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ${
                                isMenuOpen
                                  ? 'bg-amber-500 text-white border border-amber-600 shadow-xs'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                              title="Các thao tác quản lý tài khoản"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                          
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Menu bung ra khi bấm vào Hành động: Ngắt phiên, Sửa thông tin, Reset TK, Xóa TK */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
                              >
                                {/* Ngắt phiên */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    soundEffects.playClick();
                                    setActiveActionMenuLearnerId(null);
                                    await clearAccountActiveSession(
                                      learner.learnerId,
                                      'admin_unlocked',
                                      'Tài khoản này đang được yêu cầu xác minh tình trạng đăng nhập'
                                    );
                                    if (learner.username && learner.username !== learner.learnerId) {
                                      await clearAccountActiveSession(
                                        learner.username,
                                        'admin_unlocked',
                                        'Tài khoản này đang được yêu cầu xác minh tình trạng đăng nhập'
                                      );
                                    }
                                    soundEffects.playSuccess();
                                    setUnlockedSessionMsg(`Đã ngắt phiên truy cập tài khoản "${learner.username || learner.name}" thành công!`);
                                    setTimeout(() => setUnlockedSessionMsg(null), 5000);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2.5 transition cursor-pointer"
                                >
                                  <Unlock className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>Ngắt phiên</span>
                                </button>

                                {/* Sửa thông tin */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEffects.playClick();
                                    setActiveActionMenuLearnerId(null);
                                    handleStartEditLearner(learner);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-sky-800 flex items-center gap-2.5 transition cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4 text-sky-600 shrink-0" />
                                  <span>Sửa hồ sơ</span>
                                </button>

                            
                                {/* Reset TK */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEffects.playClick();
                                    setActiveActionMenuLearnerId(null);
                                    handleResetLearnerStats(learner);
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2.5 transition cursor-pointer"
                                  title="Đặt lại toàn bộ thành tích của tài khoản này về 0"
                                >
                                  <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>Reset TK</span>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                {/* Xóa TK */}
                                <button
                                  type="button"
                                  disabled={learners.length <= 1}
                                  onClick={() => {
                                    soundEffects.playClick();
                                    setActiveActionMenuLearnerId(null);
                                    if (window.confirm(`Bạn có chắc muốn xóa người học "${learner.username || learner.name}"? Thao tác này không thể hoàn tác.`)) {
                                      onDeleteLearner(learner.learnerId);
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center gap-2.5 transition cursor-pointer"
                                  title={learners.length <= 1 ? 'Không thể xóa tài khoản duy nhất' : 'Xóa tài khoản này'}
                                >
                                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>Xóa TK</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Phân trang tài khoản: Tối đa 5 tài khoản 1 trang */}
                {totalLearnerPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                      Hiển thị <span className="font-bold text-slate-800 font-mono">{(safeLearnerPage - 1) * LEARNERS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-800 font-mono">{Math.min(safeLearnerPage * LEARNERS_PER_PAGE, filteredLearners.length)}</span> trên <span className="font-bold text-slate-800 font-mono">{filteredLearners.length}</span> tài khoản (Trang {safeLearnerPage}/{totalLearnerPages})
                    </div>

                    <div className="flex items-center gap-1.5 order-1 sm:order-2">
                      <button
                        type="button"
                        disabled={safeLearnerPage <= 1}
                        onClick={() => {
                          soundEffects.playClick();
                          setLearnerPage(p => Math.max(1, p - 1));
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Trước</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalLearnerPages }, (_, i) => i + 1).map((pageNum) => {
                          if (
                            totalLearnerPages > 7 &&
                            pageNum !== 1 &&
                            pageNum !== totalLearnerPages &&
                            Math.abs(pageNum - safeLearnerPage) > 1
                          ) {
                            if (pageNum === 2 && safeLearnerPage > 3) {
                              return <span key={pageNum} className="px-1 text-slate-400 text-xs font-bold">...</span>;
                            }
                            if (pageNum === totalLearnerPages - 1 && safeLearnerPage < totalLearnerPages - 2) {
                              return <span key={pageNum} className="px-1 text-slate-400 text-xs font-bold">...</span>;
                            }
                            return null;
                          }

                          const isCurrent = pageNum === safeLearnerPage;
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                setLearnerPage(pageNum);
                              }}
                              className={`min-w-7 h-7 px-2 rounded-xl text-xs font-bold font-mono flex items-center justify-center transition cursor-pointer ${
                                isCurrent
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={safeLearnerPage >= totalLearnerPages}
                        onClick={() => {
                          soundEffects.playClick();
                          setLearnerPage(p => Math.min(totalLearnerPages, p + 1));
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition cursor-pointer shadow-2xs"
                      >
                        <span>Sau</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

              {/* Backdrop để đóng menu Hành động khi click ra ngoài */}
              {activeActionMenuLearnerId && (
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setActiveActionMenuLearnerId(null)}
                />
              )}
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
                    <h4 className="font-display font-bold text-sm text-indigo-900">
                      Tạo lớp học mới
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
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <span className="font-medium text-slate-700">{unitsCount} bài học (Units)</span>
                              <span className="text-slate-300 font-bold">•</span>
                              <span className="font-medium text-slate-700">{learnersInClass.length} học sinh</span>
                            </div>
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
                          Danh sách: {learnersInClass.map(l => l.name).join(', ') || 'Chưa có học sinh'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            handleSelectJsonGrade(cls.grade);
                            setActiveTab('curriculum');
                          }}
                          className="text-amber-600 hover:text-amber-700 hover:underline cursor-pointer font-bold shrink-0 ml-auto"
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
                  className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm transition flex items-center cursor-pointer ${
                    jsonSubTab === 'curriculum'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Dữ liệu Sách giáo khoa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setJsonSubTab('exercises');
                  }}
                  className={`px-4 py-2 rounded-xl font-display font-bold text-xs sm:text-sm transition flex items-center cursor-pointer ${
                    jsonSubTab === 'exercises'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
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
                          Hiện tại danh sách bài tập của lớp này đang trống. Bạn có thể bấm nút <strong>"Thêm học phần (+)"</strong> để thêm cụm bài tập mới.
                        </p>
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
          {/* TAB 3A: QUẢN LÝ HÌNH ĐẠI DIỆN (NHÓM HÌNH ẢNH) */}
          {/* ========================================================= */}
          {activeTab === 'avatars' && (
            <div className="space-y-6 max-w-4xl mx-auto">

              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">
                      Tải lên hình đại diện mới
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Kích thước tối đa <strong>1024 x 1024 px</strong>, dung lượng không quá <strong>3 MB/ảnh</strong>.
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
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Thêm hình mới
                    </button>
                  </div>
                </div>

                {/* Upload Feedback */}
                {avatarUploadError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" /> {avatarUploadError}
                  </div>
                )}
                {avatarUploadSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" /> {avatarUploadSuccess}
                  </div>
                )}

                {/* Avatar Gallery grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Thư viện hình hiện có ({allAvailableAvatars.length}):
                    </span>
                    <span className="text-xs text-slate-400">
                      Rà chuột vào hình tự tải lên để xóa
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {allAvailableAvatars.map((av) => {
                      const owner = (av as any).ownerLearnerId
                        ? learners.find(l => l.learnerId === (av as any).ownerLearnerId)
                        : null;
                      return (
                        <div
                          key={av.id}
                          className="relative group p-2 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-xs transition flex flex-col items-center justify-center aspect-square text-center"
                          title={`${av.name}${owner ? ` (Hình của: ${owner.name})` : ''}`}
                        >
                          <div className="w-12 h-12 flex items-center justify-center text-3xl overflow-hidden rounded-xl">
                            {renderAvatarContent(av.icon)}
                          </div>

                          <span className="text-[10px] text-slate-500 font-medium truncate w-full mt-1">
                            {av.name}
                          </span>

                          {owner && (
                            <span className="absolute -bottom-1 -left-1 px-1.5 py-0.2 bg-indigo-600 text-[8px] font-bold text-white rounded-full shadow-2xs">
                              user
                            </span>
                          )}

                          {/* Delete button only for custom uploaded avatars */}
                          {av.isCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                soundEffects.playClick();
                                if (window.confirm(`Xóa hình "${av.name}" khỏi thư viện?`)) {
                                  onDeleteCustomAvatar(av.id);
                                }
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer hover:bg-rose-600"
                              title="Xóa hình"
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
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3B: APP LOGO & BRANDING SETTINGS */}
          {/* ========================================================= */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-2xl mx-auto">


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
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">
                      1. Chọn hình ảnh Logo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tải ảnh mới từ thiết bị hoặc dán link ảnh trực tuyến
                    </p>
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
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-800">
                      2. Chỉnh kích thước hiển thị Logo
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kéo thanh trượt để tinh chỉnh và xem trước trực tiếp theo thời gian thực
                    </p>
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
                      Xem trước:
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
                        Kích thước trên Thanh Header
                      </label>
                    </div>
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-orange-100 text-orange-900 border border-orange-200">
                      {stagedHeaderLogoSize}px
                    </span>
                  </div>



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
                      Xem trước:
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
                        <span>Lưu thay đổi</span>
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
                    <span>Mặc định (200px / 300px)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: PASSWORD RESET REQUESTS (CẤP LẠI MẬT KHẨU) */}
          {/* ========================================================= */}
          {activeTab === 'resets' && (() => {
            const filteredResets = resetRequests.filter(req => {
              if (!resetSearchTerm.trim()) return true;
              const q = resetSearchTerm.toLowerCase();
              return (
                (req.username || '').toLowerCase().includes(q) ||
                (req.nickname || '').toLowerCase().includes(q) ||
                (req.fullName || '').toLowerCase().includes(q) ||
                (req.phone || '').toLowerCase().includes(q) ||
                (req.email || '').toLowerCase().includes(q)
              );
            });

            return (
              <div className="space-y-5 max-w-4xl mx-auto">
                {/* Header & Controls Box */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-base text-slate-900">
                        Yêu cầu cấp lại mật khẩu
                      </h3>
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        {resetRequests.length} yêu cầu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={resetSearchTerm}
                        onChange={(e) => setResetSearchTerm(e.target.value)}
                        placeholder="Tìm tên đăng nhập, SĐT, Email..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      />
                      {resetSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setResetSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Refresh Button */}
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
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                      title="Làm mới danh sách từ Cloud"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isLoadingResetRequests ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Làm mới</span>
                    </button>
                  </div>
                </div>

                {/* Requests List */}
                {isLoadingResetRequests ? (
                  <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-500">Đang tải danh sách yêu cầu từ cơ sở dữ liệu...</p>
                  </div>
                ) : resetRequests.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-display font-bold text-base text-slate-800">
                      Không có yêu cầu cấp lại mật khẩu nào
                    </h4>
                  </div>
                ) : filteredResets.length === 0 ? (
                  <div className="py-10 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                    <p className="text-sm font-bold text-slate-700">Không tìm thấy yêu cầu phù hợp với "{resetSearchTerm}"</p>
                    <button
                      type="button"
                      onClick={() => setResetSearchTerm('')}
                      className="text-xs text-amber-600 hover:underline font-bold"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResets.map((req, idx) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 shadow-2xs transition duration-200 space-y-3"
                      >
                        {/* Header của thẻ yêu cầu: Định danh bên trái, Action buttons bên phải */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-display font-bold text-base text-slate-900 font-mono">
                              {req.username || req.nickname}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                            <button
                              type="button"
                              onClick={() => handleOpenResetEmailReply(req)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                              title="Soạn email phản hồi"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Soạn email phản hồi</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (window.confirm(`Xác nhận đã xử lý xong và muốn xóa yêu cầu cấp lại mật khẩu của tài khoản "${req.username || req.nickname}"?`)) {
                                  soundEffects.playClick();
                                  setResetRequests(prev => prev.filter(r => r.id !== req.id));
                                  await deletePasswordResetRequestFromCloud(req.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                              title="Đã xử lý / Xóa yêu cầu này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* BẢNG ĐỐI CHIẾU DỮ LIỆU XÁC MINH CSDL (Gọn gàng, không lặp lại pill thừa) */}
                        {renderVerificationAuditCard(req)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 6: ACCOUNT VERIFICATION REQUESTS (XÁC MINH TÀI KHOẢN) */}
          {/* ========================================================= */}
          {activeTab === 'verifications' && (() => {
            const filteredVerifications = verificationRequests.filter(req => {
              if (!verificationSearchTerm.trim()) return true;
              const q = verificationSearchTerm.toLowerCase();
              return (
                (req.username || '').toLowerCase().includes(q) ||
                (req.nickname || '').toLowerCase().includes(q) ||
                (req.phone || '').toLowerCase().includes(q) ||
                (req.email || '').toLowerCase().includes(q) ||
                (req.deviceInfo || '').toLowerCase().includes(q)
              );
            });

            return (
              <div className="space-y-5 max-w-4xl mx-auto">
                {/* Header & Controls Box */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-base text-slate-900">
                        Yêu cầu xác minh tài khoản
                      </h3>
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        {verificationRequests.length} yêu cầu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        value={verificationSearchTerm}
                        onChange={(e) => setVerificationSearchTerm(e.target.value)}
                        placeholder="Tìm tên đăng nhập, thiết bị, SĐT..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
                      />
                      {verificationSearchTerm && (
                        <button
                          type="button"
                          onClick={() => setVerificationSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Refresh Button */}
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
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
                      title="Làm mới danh sách từ Cloud"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isLoadingVerificationRequests ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Làm mới</span>
                    </button>
                  </div>
                </div>

                {/* Notification Banner when account session was unlocked */}
                {unlockedSessionMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in">
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
                    <p className="text-xs font-bold text-slate-500">Đang tải danh sách yêu cầu từ cơ sở dữ liệu...</p>
                  </div>
                ) : verificationRequests.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-display font-bold text-base text-slate-800">
                      Không có yêu cầu xác minh tài khoản nào
                    </h4>
                  </div>
                ) : filteredVerifications.length === 0 ? (
                  <div className="py-10 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                    <p className="text-sm font-bold text-slate-700">Không tìm thấy yêu cầu phù hợp với "{verificationSearchTerm}"</p>
                    <button
                      type="button"
                      onClick={() => setVerificationSearchTerm('')}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredVerifications.map((req, idx) => (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-slate-300 shadow-2xs transition duration-200 space-y-3"
                      >
                        {/* Header của thẻ: Định danh & thiết bị bên trái, Action buttons bên phải */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-display font-bold text-base text-slate-900 font-mono">
                              {req.username || req.nickname}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                            </span>
                            {req.deviceInfo && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                <Laptop className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{req.deviceInfo}</span>
                              </span>
                            )}
                          </div>

                          {/* Action Buttons Group */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                            {/* Nút Ngắt phiên */}
                            <button
                              type="button"
                              onClick={async () => {
                                soundEffects.playClick();
                                const cleanAccountUser = (req.username || req.nickname || '').trim().toLowerCase();
                                const reqLearnerId = (req.learnerId || '').trim();
                                const matchedLearner = learners.find(l => {
                                  const u = (l.username || '').toLowerCase();
                                  const n = (l.nickname || '').toLowerCase();
                                  const name = (l.name || '').toLowerCase();
                                  const id = (l.learnerId || '').toLowerCase();
                                  return (reqLearnerId && id === reqLearnerId.toLowerCase()) || id === cleanAccountUser || u === cleanAccountUser || n === cleanAccountUser || name === cleanAccountUser;
                                });

                                const targetLearnerId = reqLearnerId || (matchedLearner ? matchedLearner.learnerId : (req.username || req.nickname || ''));

                                await clearAccountActiveSession(
                                  targetLearnerId,
                                  'admin_unlocked',
                                  'Tài khoản này đang được yêu cầu xác minh tình trạng đăng nhập'
                                );
                                if (cleanAccountUser && cleanAccountUser !== targetLearnerId) {
                                  await clearAccountActiveSession(
                                    cleanAccountUser,
                                    'admin_unlocked',
                                    'Tài khoản này đang được yêu cầu xác minh tình trạng đăng nhập'
                                  );
                                }
                                if (matchedLearner && matchedLearner.username && matchedLearner.username !== targetLearnerId) {
                                  await clearAccountActiveSession(
                                    matchedLearner.username,
                                    'admin_unlocked',
                                    'Tài khoản này đang được yêu cầu xác minh tình trạng đăng nhập'
                                  );
                                }

                                soundEffects.playSuccess();
                                const displayUser = req.username || req.nickname;
                                setUnlockedSessionMsg(
                                  `Đã mở khóa phiên và ngắt kết nối các thiết bị khác cho tài khoản "${displayUser}" thành công! Thiết bị lạ sẽ bị ngắt ngay lập tức.`
                                );
                                setTimeout(() => setUnlockedSessionMsg(null), 6000);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                              title="Ngắt kết nối các thiết bị khác và cho phép học sinh đăng nhập lại ngay"
                            >
                              <Unlock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Ngắt phiên</span>
                            </button>

                            {/* Nút Soạn email phản hồi */}
                            <button
                              type="button"
                              onClick={() => handleOpenVerificationEmailReply(req)}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                              title="Mở hộp thoại có sẵn nội dung phản hồi xác nhận cho học sinh"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Soạn email phản hồi</span>
                            </button>

                            {/* Nút Xóa yêu cầu */}
                            <button
                              type="button"
                              onClick={async () => {
                                const displayUser = req.username || req.nickname;
                                if (window.confirm(`Xác nhận đã xử lý xong và muốn xóa yêu cầu xác minh tài khoản của "${displayUser}"?`)) {
                                  soundEffects.playClick();
                                  setVerificationRequests(prev => prev.filter(r => r.id !== req.id));
                                  await deleteAccountVerificationRequestFromCloud(req.id);
                                }
                              }}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                              title="Đã xử lý / Xóa yêu cầu này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* BẢNG ĐỐI CHIẾU DỮ LIỆU XÁC MINH CSDL */}
                        {renderVerificationAuditCard(req)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
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
      {/* MODAL PHẢN HỒI EMAIL (NỘI DUNG SOẠN SẴN ĐỂ COPY & DÁN VÀO TRÌNH DUYỆT) */}
      {emailReplyModal && emailReplyModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col animate-scale-up">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                  emailReplyModal.type === 'reset'
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-rose-100 border-rose-300 text-rose-800'
                }`}>
                  {emailReplyModal.type === 'reset' ? (
                    <KeyRound className="w-5 h-5" />
                  ) : (
                    <ShieldAlert className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                    <span>Hộp thoại phản hồi email</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      emailReplyModal.type === 'reset'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {emailReplyModal.type === 'reset' ? 'Cấp lại mật khẩu' : 'Xác minh tài khoản'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tài khoản: <span className="font-bold text-slate-700 font-mono">{emailReplyModal.username || emailReplyModal.nickname || emailReplyModal.fullName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmailReplyModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-notice */}
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Cách gửi thư phản hồi bằng trình duyệt:</span>
                <p className="text-[11px] text-sky-800 leading-relaxed">
                  Bấm sao chép Email, Tiêu đề hoặc Nội dung thư ở dưới, sau đó mở web mail (như Gmail Web, Outlook...) trong trình duyệt của bạn, dán vào và bấm gửi. Không cần cài đặt hay bật phần mềm gửi thư trên máy tính!
                </p>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 text-xs sm:text-sm">
              {/* Field 1: Recipient Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Địa chỉ email người nhận (To)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={emailReplyModal.recipient}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none select-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('email', emailReplyModal.recipient)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                      copiedField === 'email'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedField === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Field 2: Subject */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Tiêu đề thư (Subject)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={emailReplyModal.subject}
                    onChange={(e) => setEmailReplyModal({ ...emailReplyModal, subject: e.target.value })}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyText('subject', emailReplyModal.subject)}
                    className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                      copiedField === 'subject'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedField === 'subject' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép Tiêu đề</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Field for Password Reset */}
              {emailReplyModal.type === 'reset' && (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                      Mật khẩu mới cấp lại cho học sinh:
                    </span>
                    <p className="text-[11px] text-amber-700">
                      Nhập mật khẩu bạn muốn cấp (thay đổi ở đây sẽ tự cập nhật vào nội dung thư bên dưới).
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={emailReplyModal.newPassword || '123456'}
                      onChange={(e) => handleUpdateResetPassword(e.target.value)}
                      maxLength={16}
                      className="w-32 px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-950 font-bold text-center text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyText('pass', emailReplyModal.newPassword || '123456')}
                      className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      {copiedField === 'pass' ? 'Đã chép' : 'Chép MK'}
                    </button>
                  </div>
                </div>
              )}

              {/* Field 3: Email Body */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    3. Nội dung email phản hồi (Body)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Có thể sửa trực tiếp trước khi sao chép
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={emailReplyModal.body}
                  onChange={(e) => setEmailReplyModal({ ...emailReplyModal, body: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white resize-y leading-relaxed"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Copy Entire Body Button */}
                <button
                  type="button"
                  onClick={() => handleCopyText('all', emailReplyModal.body)}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer ${
                    copiedField === 'all'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                  }`}
                >
                  {copiedField === 'all' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đã sao chép toàn bộ nội dung!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép toàn bộ nội dung thư</span>
                    </>
                  )}
                </button>

                {/* Open in Gmail Web in new browser tab */}
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailReplyModal.recipient)}&su=${encodeURIComponent(emailReplyModal.subject)}&body=${encodeURIComponent(emailReplyModal.body)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                  title="Mở sẵn thư này trong tab trình duyệt Gmail Web"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-500" />
                  <span>Mở nhanh trên Gmail Web</span>
                </a>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Delete / Processed Button */}
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm(`Xác nhận bạn đã gửi phản hồi cho ${emailReplyModal.fullName} và muốn hoàn tất (xóa) yêu cầu này khỏi danh sách?`)) {
                      soundEffects.playSuccess();
                      const targetId = emailReplyModal.reqId;
                      if (emailReplyModal.type === 'reset') {
                        setResetRequests(prev => prev.filter(r => r.id !== targetId));
                        await deletePasswordResetRequestFromCloud(targetId);
                      } else {
                        setVerificationRequests(prev => prev.filter(r => r.id !== targetId));
                        await deleteAccountVerificationRequestFromCloud(targetId);
                      }
                      setEmailReplyModal(null);
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-xs font-bold transition cursor-pointer"
                  title="Đánh dấu đã hoàn thành và xóa khỏi danh sách yêu cầu"
                >
                  Đã gửi & Xóa yêu cầu
                </button>

                <button
                  type="button"
                  onClick={() => setEmailReplyModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL CHI TIẾT BẢNG THÔNG TIN THÀNH VIÊN */}
      {/* ========================================================= */}
      {viewingDetailLearner && (() => {
        const targetDetail = learners.find(l => l.learnerId === viewingDetailLearner.learnerId) || viewingDetailLearner;
        const onlineInfo = getLearnerOnlineInfo(targetDetail);
        const lastLoginTimeDisplay = formatLastLogin(targetDetail.lastLoginAt || targetDetail.lastActiveDate);
        const lastActivityTimeDisplay = formatActivityTime(targetDetail.lastActiveDate);
        const currentActivityName = onlineInfo.activityDisplay;
        const activityLogsList: UserActivityLogItem[] = Array.isArray(targetDetail.activityLogs) && targetDetail.activityLogs.length > 0
          ? targetDetail.activityLogs
          : [
              {
                id: 'init_act',
                activity: currentActivityName,
                timestamp: targetDetail.lastActiveDate || new Date().toISOString(),
                type: onlineInfo.isOnline ? 'home' : 'system'
              }
            ];

        return (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => setViewingDetailLearner(null)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header modal */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 px-5 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base leading-tight">
                      Chi tiết thông tin tài khoản
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDetailLearner(null)}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile banner & Avatar */}
              <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-3xl shrink-0 overflow-hidden shadow-sm">
                    {renderAvatarContent(targetDetail.avatar)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-display font-bold text-lg text-slate-900 font-mono tracking-tight">
                        {targetDetail.username || resolveValidUsername(targetDetail.username, targetDetail.name)}
                      </h4>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                        Lớp {targetDetail.grade}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-lg border ${onlineInfo.statusBadgeClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${onlineInfo.dotClass} ${onlineInfo.isOnline ? 'animate-pulse' : ''}`} />
                        {onlineInfo.statusBadgeText}
                      </span>
                    </div>
                    {targetDetail.name && targetDetail.name.toLowerCase() !== (targetDetail.username || '').toLowerCase() && (
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Họ và tên: <span className="font-semibold text-slate-800">{targetDetail.name}</span>
                      </p>
                    )}
                    {targetDetail.nickname && targetDetail.nickname !== targetDetail.name && (
                      <p className="text-xs text-slate-500 font-medium">
                        Biệt danh: <span className="font-semibold text-slate-700">{targetDetail.nickname}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bảng chi tiết 1: Thông tin tài khoản & Bảo mật */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" /> Thông tin tài khoản 
                  </h5>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Tên đăng nhập:</span>
                      <span className="font-mono font-bold text-slate-800">{targetDetail.username || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Mật khẩu đăng nhập:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-800 tracking-wider">
                          {targetDetail.pin
                            ? (showDetailPin ? targetDetail.pin : '••••••••')
                            : '(Chưa đặt)'}
                        </span>
                        {Boolean(targetDetail.pin) && (
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setShowDetailPin(prev => !prev);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            title={showDetailPin ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                          >
                            {showDetailPin ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Số bảo mật:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                          {targetDetail.securityNumber !== undefined
                            ? (showDetailSecNum ? `Số ${targetDetail.securityNumber}` : 'Số ••')
                            : 'Chưa thiết lập'}
                        </span>
                        {targetDetail.securityNumber !== undefined && (
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              setShowDetailSecNum(prev => !prev);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                            title={showDetailSecNum ? 'Ẩn số bảo mật' : 'Hiện số bảo mật'}
                          >
                            {showDetailSecNum ? <EyeOff className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5 text-indigo-500" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Trình độ:</span>
                      <span className="font-semibold text-slate-800">Lớp {targetDetail.grade} ({getGradeLevelName(targetDetail.grade)})</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-slate-200/50">
                      <span className="text-slate-500 font-medium">Số điện thoại:</span>
                      <span className="font-semibold text-slate-800">{targetDetail.phone || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500 font-medium">Địa chỉ Email:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[220px]" title={targetDetail.email}>
                        {targetDetail.email || 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bảng chi tiết 2: Thời gian đăng nhập & Phiên hoạt động */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" /> Tình trạng đăng nhập &amp; Hoạt động
                  </h5>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 text-xs">

                    {/* Đăng nhập gần nhất */}
                    <div className="flex items-start justify-between py-1 border-b border-slate-200/50 gap-2">
                      <div>
                        <span className="text-slate-700 font-semibold block">Đăng nhập gần nhất</span>
                      </div>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {lastLoginTimeDisplay}
                      </span>
                    </div>

                    {/* Hoạt động */}
                    <div className="py-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                            <Activity className={`w-3.5 h-3.5 ${onlineInfo.activityIconColor}`} />
                            {onlineInfo.isOnline ? 'Hoạt động hiện tại' : 'Hoạt động ghi nhận gần nhất'}
                          </span>

                        </div>
                        <span className="font-semibold text-slate-700 flex items-center gap-1 shrink-0 bg-white px-2 py-0.5 rounded-lg border border-slate-200/60 text-[11px] shadow-2xs">
                          <Calendar className={`w-3 h-3 ${onlineInfo.activityIconColor}`} />
                          {lastActivityTimeDisplay}
                        </span>
                      </div>

                      {/* Nội dung chi tiết hoạt động */}
                      <div className={`p-2.5 rounded-xl bg-white border flex items-center gap-2.5 shadow-2xs ${
                        onlineInfo.isOnline ? 'border-emerald-300' : 'border-slate-200'
                      }`}>
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          {onlineInfo.isOnline && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${onlineInfo.dotClass}`}></span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 text-xs truncate" title={onlineInfo.activityDisplay}>
                            {onlineInfo.activityDisplay}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bảng chi tiết 3: Nhật ký hoạt động (5 hoạt động gần nhất) */}
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-indigo-600" /> Nhật ký hoạt động
                      </h5>

                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Nút Chi tiết mở màn hình chi tiết log hoạt động */}
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setViewingLogsLearner(targetDetail);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Xem toàn bộ nhật ký hoạt động của tài khoản này"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Chi tiết</span>
                      </button>

                      {/* Nút Xuất log ra file .txt */}
                      <button
                        type="button"
                        onClick={() => handleExportLearnerLog(targetDetail)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        title="Xuất file log hoạt động (.txt)"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Xuất log</span>
                      </button>
                    </div>
                  </div>

                  {exportNotice && (
                    <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{exportNotice}</span>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-1.5">
                    {/* Chỉ hiển thị 5 hoạt động gần nhất */}
                    {[...activityLogsList].reverse().slice(0, 5).map((logItem, idx) => {
                      const typeConfig: Record<string, { label: string; badgeCol: string; dotCol: string }> = {
                        home: { label: 'Trang chủ', badgeCol: 'bg-slate-100 text-slate-700 border-slate-200', dotCol: 'bg-slate-400' },
                        game: { label: 'Minigame', badgeCol: 'bg-amber-100 text-amber-800 border-amber-200', dotCol: 'bg-amber-500' },
                        exercise: { label: 'Bài tập', badgeCol: 'bg-sky-100 text-sky-800 border-sky-200', dotCol: 'bg-sky-500' },
                        profile: { label: 'Tài khoản', badgeCol: 'bg-purple-100 text-purple-800 border-purple-200', dotCol: 'bg-purple-500' },
                        badges: { label: 'Thành tích', badgeCol: 'bg-pink-100 text-pink-800 border-pink-200', dotCol: 'bg-pink-500' },
                        login: { label: 'Đăng nhập', badgeCol: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotCol: 'bg-emerald-500' },
                        system: { label: 'Hệ thống', badgeCol: 'bg-slate-100 text-slate-700 border-slate-200', dotCol: 'bg-slate-500' },
                      };
                      const cfg = typeConfig[logItem.type || 'home'] || typeConfig.home;
                      const isLatest = idx === 0;

                      return (
                        <div
                          key={logItem.id || idx}
                          className={`p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition ${
                            isLatest
                              ? 'bg-white border border-emerald-300 shadow-2xs'
                              : 'bg-white/70 border border-slate-200/60 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dotCol} ${isLatest ? 'ring-2 ring-emerald-200' : ''}`} />
                            <span className="font-semibold text-slate-800 truncate" title={logItem.activity}>
                              {logItem.activity}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${cfg.badgeCol}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatActivityTime(logItem.timestamp)}
                            </span>
                          </div>
                        </div>
                      );
                    })}


                  </div>
                </div>

                {/* Bảng chi tiết 4: Thành tích học tập */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> Thành tích &amp; Tiến trình học
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-amber-700">⭐ {targetDetail.totalStars || 0}</p>
                      <p className="text-[11px] font-medium text-amber-900">Tổng sao</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-blue-700">⚡ {targetDetail.xp || 0}</p>
                      <p className="text-[11px] font-medium text-blue-900">XP (Lv.{targetDetail.level || 1})</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-orange-700">🔥 {targetDetail.currentStreak || 0}</p>
                      <p className="text-[11px] font-medium text-orange-900">Chuỗi ngày</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                      <p className="text-lg font-bold text-emerald-700">📚 {Object.keys(targetDetail.completedUnits || {}).length}</p>
                      <p className="text-[11px] font-medium text-emerald-900">Bài đã học</p>
                    </div>
                  </div>
                </div>

                {/* Huy hiệu đã đạt */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Huy hiệu đã đạt ({targetDetail.unlockedBadges?.length || 0})
                  </h5>
                  {targetDetail.unlockedBadges && targetDetail.unlockedBadges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                      {targetDetail.unlockedBadges.map((badgeId) => {
                        const badgeInfo = getBadgeDisplayInfo(badgeId);

                        return (
                          <div
                            key={badgeId}
                            className="p-2.5 bg-white border border-amber-200/80 hover:border-amber-300 rounded-xl shadow-2xs flex items-center gap-2.5 transition"
                            title={badgeInfo.description ? `${badgeInfo.title}: ${badgeInfo.description}` : badgeInfo.title}
                          >
                            <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-lg shrink-0">
                              {badgeInfo.icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate">
                                {badgeInfo.title}
                              </p>
                              {badgeInfo.description && (
                                <p className="text-[10px] text-slate-500 truncate">
                                  {badgeInfo.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-500 italic">
                      Tài khoản này chưa mở khóa huy hiệu nào.
                    </div>
                  )}
                </div>
              </div>

              {/* Footer buttons */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const l = targetDetail;
                    setViewingDetailLearner(null);
                    handleStartEditLearner(l);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-sky-600" /> Sửa thông tin
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDetailLearner(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL MÀN HÌNH CHI TIẾT NHẬT KÝ HOẠT ĐỘNG CỦA TÀI KHOẢN */}
      {/* ========================================================= */}
      {viewingLogsLearner && (() => {
        const targetLearner = learners.find(l => l.learnerId === viewingLogsLearner.learnerId) || viewingLogsLearner;
        const rawLogs: UserActivityLogItem[] = Array.isArray(targetLearner.activityLogs) && targetLearner.activityLogs.length > 0
          ? targetLearner.activityLogs
          : [
              {
                id: 'init_act',
                activity: targetLearner.lastActiveActivity || 'Chưa có hoạt động',
                timestamp: targetLearner.lastActiveDate || new Date().toISOString(),
                type: 'system'
              }
            ];

        const allReversedLogs = [...rawLogs].reverse();

        const filteredLogs = allReversedLogs.filter(log => {
          if (!logSearchQuery.trim()) return true;
          const q = logSearchQuery.toLowerCase();
          const activityMatch = (log.activity || '').toLowerCase().includes(q);
          const typeMatch = (log.type || '').toLowerCase().includes(q);
          const timeMatch = formatActivityTime(log.timestamp).toLowerCase().includes(q);
          return activityMatch || typeMatch || timeMatch;
        });

        const typeConfig: Record<string, { label: string; badgeCol: string; dotCol: string }> = {
          home: { label: 'Trang chủ', badgeCol: 'bg-slate-100 text-slate-700 border-slate-200', dotCol: 'bg-slate-400' },
          game: { label: 'Minigame', badgeCol: 'bg-amber-100 text-amber-800 border-amber-200', dotCol: 'bg-amber-500' },
          exercise: { label: 'Bài tập', badgeCol: 'bg-sky-100 text-sky-800 border-sky-200', dotCol: 'bg-sky-500' },
          profile: { label: 'Tài khoản', badgeCol: 'bg-purple-100 text-purple-800 border-purple-200', dotCol: 'bg-purple-500' },
          badges: { label: 'Thành tích', badgeCol: 'bg-pink-100 text-pink-800 border-pink-200', dotCol: 'bg-pink-500' },
          login: { label: 'Đăng nhập', badgeCol: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotCol: 'bg-emerald-500' },
          system: { label: 'Hệ thống', badgeCol: 'bg-slate-100 text-slate-700 border-slate-200', dotCol: 'bg-slate-500' },
        };

        return (
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={() => {
              setViewingLogsLearner(null);
              setLogSearchQuery('');
            }}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-5 py-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base leading-tight">
                      Chi tiết nhật ký hoạt động
                    </h3>
                    <p className="text-xs text-indigo-100 font-medium">
                      Tài khoản: <span className="font-bold text-white font-mono">{targetLearner.username || targetLearner.name}</span> • Lớp {targetLearner.grade}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setViewingLogsLearner(null);
                    setLogSearchQuery('');
                  }}
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sub-header / Toolbar */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    placeholder="Tìm theo nội dung hoạt động, thời gian..."
                    className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-2xs"
                  />
                  {logSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setLogSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl shadow-2xs font-mono">
                    {filteredLogs.length}/{allReversedLogs.length} hoạt động
                  </span>

                  <button
                    type="button"
                    onClick={() => handleExportLearnerLog(targetLearner)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    title="Xuất nhật ký hoạt động ra file txt"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Xuất log (.txt)</span>
                  </button>
                </div>
              </div>

              {exportNotice && (
                <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{exportNotice}</span>
                </div>
              )}

              {/* Logs Content List */}
              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                    <History className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-slate-600">Không tìm thấy hoạt động nào phù hợp</p>
                    <p>Hãy thử thay đổi từ khóa tìm kiếm</p>
                  </div>
                ) : (
                  filteredLogs.map((logItem, idx) => {
                    const cfg = typeConfig[logItem.type || 'home'] || typeConfig.home;
                    const isLatest = idx === 0 && !logSearchQuery;

                    return (
                      <div
                        key={logItem.id || idx}
                        className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isLatest
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                            #{allReversedLogs.length - idx}
                          </span>
                          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${cfg.dotCol} ${isLatest ? 'ring-2 ring-indigo-300' : ''}`} />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 leading-snug">
                              {logItem.activity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pl-7 sm:pl-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.badgeCol}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatActivityTime(logItem.timestamp)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">

                <button
                  type="button"
                  onClick={() => {
                    setViewingLogsLearner(null);
                    setLogSearchQuery('');
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
