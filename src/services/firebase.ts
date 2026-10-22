import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, UnitData, ExerciseCluster, PasswordResetRequest, AccountVerificationRequest, UserActiveSession } from '../types';
import { resolveValidUsername } from '../utils/userUtils';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// CRITICAL: Initialize Firestore with specific database ID from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Connected to Cloud Firestore database successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or unreachable.');
    }
  }
}

// Helper to convert UserProfile to clean Firestore document
function formatLearnerForFirestore(learner: UserProfile) {
  // Convert completedUnits keys to strings for Firestore map
  const cleanCompletedUnits: Record<string, any> = {};
  if (learner.completedUnits) {
    Object.entries(learner.completedUnits).forEach(([k, v]) => {
      cleanCompletedUnits[String(k)] = {
        flashcardsDone: Boolean(v.flashcardsDone),
        flashcardStars: v.flashcardStars !== undefined ? Math.round(Number(v.flashcardStars)) : 0,
        memoryStars: Math.round(Number(v.memoryStars || 0)),
        wordScrambleStars: Math.round(Number(v.wordScrambleStars || 0)),
        sentenceStars: Math.round(Number(v.sentenceStars || 0)),
        quizStars: Math.round(Number(v.quizStars || 0)),
      };
    });
  }

  return {
    id: String(learner.learnerId),
    name: String(learner.nickname || learner.name || 'Học sinh').slice(0, 64),
    fullName: learner.fullName ? String(learner.fullName).trim().slice(0, 32) : '',
    nickname: learner.nickname ? String(learner.nickname).trim().slice(0, 32) : String(learner.name || '').slice(0, 32),
    grade: Math.max(1, Math.min(12, Math.round(Number(learner.grade) || 4))),
    avatar: String(learner.avatar || '🦊').slice(0, 350000),
    totalStars: Math.max(0, Math.round(Number(learner.totalStars || 0))),
    level: Math.max(1, Math.round(Number(learner.level || 1))),
    xp: Math.max(0, Math.round(Number(learner.xp || 0))),
    currentStreak: Math.max(0, Math.round(Number(learner.currentStreak || 1))),
    highestStreak: Math.max(0, Math.round(Number(learner.highestStreak || 1))),
    completedUnits: cleanCompletedUnits,
    unlockedBadges: Array.isArray(learner.unlockedBadges) ? learner.unlockedBadges.slice(0, 50) : [],
    pin: learner.pin !== undefined && learner.pin !== null ? String(learner.pin).trim() : '',
    username: resolveValidUsername(learner.username, learner.nickname || learner.name),
    phone: learner.phone ? String(learner.phone).trim() : '',
    email: learner.email ? String(learner.email).trim().toLowerCase() : '',
    customAvatarUrl: learner.customAvatarUrl ? String(learner.customAvatarUrl).slice(0, 350000) : '',
    lastActiveDate: learner.lastActiveDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Helper to convert Firestore document back to UserProfile
function formatFirestoreToLearner(data: any): UserProfile {
  const completedUnits: Record<number, any> = {};
  if (data.completedUnits && typeof data.completedUnits === 'object') {
    Object.entries(data.completedUnits).forEach(([k, v]: [string, any]) => {
      completedUnits[Number(k)] = {
        flashcardsDone: Boolean(v?.flashcardsDone),
        flashcardStars: v?.flashcardStars !== undefined ? Number(v.flashcardStars) : (v?.flashcardsDone ? 1 : 0),
        memoryStars: Number(v?.memoryStars || 0),
        wordScrambleStars: Number(v?.wordScrambleStars || 0),
        sentenceStars: Number(v?.sentenceStars || 0),
        quizStars: Number(v?.quizStars || 0),
      };
    });
  }

  const nickname = data.nickname || data.name || 'Học sinh';

  return {
    learnerId: data.id || 'ty',
    name: nickname,
    fullName: data.fullName || '',
    nickname: nickname,
    grade: Math.max(1, Math.min(12, Math.round(Number(data.grade) || 4))),
    avatar: data.avatar || '🦊',
    totalStars: Number(data.totalStars || 0),
    level: Number(data.level || 1),
    xp: Number(data.xp || 0),
    currentStreak: Number(data.currentStreak || 1),
    highestStreak: Number(data.highestStreak || 1),
    completedUnits,
    unlockedBadges: Array.isArray(data.unlockedBadges) ? data.unlockedBadges : [],
    pin: data.pin !== undefined && data.pin !== null ? String(data.pin).trim() : '',
    username: resolveValidUsername(data.username, nickname),
    phone: data.phone || '',
    email: data.email || '',
    customAvatarUrl: data.customAvatarUrl || '',
    lastActiveDate: data.lastActiveDate || new Date().toISOString(),
  };
}

/**
 * Save / sync a learner profile to Cloud Firestore
 */
export async function syncLearnerToCloud(learner: UserProfile): Promise<boolean> {
  const path = `learners/${learner.learnerId}`;
  try {
    const payload = formatLearnerForFirestore(learner);
    await setDoc(doc(db, 'learners', learner.learnerId), payload);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Delete a learner profile from Cloud Firestore
 */
export async function deleteLearnerFromCloud(learnerId: string): Promise<boolean> {
  const path = `learners/${learnerId}`;
  try {
    await deleteDoc(doc(db, 'learners', learnerId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Fetch all learners from Cloud Firestore
 */
export async function fetchLearnersFromCloud(): Promise<UserProfile[]> {
  const path = 'learners';
  try {
    const querySnapshot = await getDocs(collection(db, 'learners'));
    const list: UserProfile[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(formatFirestoreToLearner(docSnap.data()));
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Subscribe to real-time changes across devices
 */
export function subscribeToLearners(callback: (learners: UserProfile[]) => void): () => void {
  const path = 'learners';
  try {
    return onSnapshot(
      collection(db, 'learners'),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach(docSnap => {
          list.push(formatFirestoreToLearner(docSnap.data()));
        });
        if (list.length > 0) {
          callback(list);
        }
      },
      async (error) => {
        handleFirestoreError(error, OperationType.GET, path);
        try {
          const fallbackList = await fetchLearnersFromCloud();
          if (fallbackList.length > 0) {
            callback(fallbackList);
          }
        } catch {
          // ignore
        }
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    fetchLearnersFromCloud().then(list => {
      if (list.length > 0) callback(list);
    }).catch(() => {});
    return () => {};
  }
}

/**
 * Custom Avatar Cloud Sync helpers
 */
export interface CloudCustomAvatar {
  id: string;
  name: string;
  icon: string;
  isCustom?: boolean;
  ownerLearnerId?: string;
}

export async function syncCustomAvatarToCloud(avatar: CloudCustomAvatar): Promise<boolean> {
  const path = `custom_avatars/${avatar.id}`;
  try {
    await setDoc(doc(db, 'custom_avatars', avatar.id), {
      id: avatar.id,
      name: avatar.name.slice(0, 64),
      icon: String(avatar.icon).slice(0, 350000),
      isCustom: true,
      ownerLearnerId: avatar.ownerLearnerId || '',
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function deleteCustomAvatarFromCloud(avatarId: string): Promise<boolean> {
  const path = `custom_avatars/${avatarId}`;
  try {
    await deleteDoc(doc(db, 'custom_avatars', avatarId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function fetchCustomAvatarsFromCloud(): Promise<CloudCustomAvatar[]> {
  const path = 'custom_avatars';
  try {
    const querySnapshot = await getDocs(collection(db, 'custom_avatars'));
    const list: CloudCustomAvatar[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.id && data.icon) {
        list.push({
          id: data.id,
          name: data.name || 'Avatar',
          icon: data.icon,
          isCustom: true,
          ownerLearnerId: data.ownerLearnerId || undefined
        });
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Curriculum Cloud Sync: saves imported JSON units per grade to Cloud Firestore
 */
export async function syncCurriculumToCloud(grade: number, units: UnitData[]): Promise<boolean> {
  const path = `curriculum/${grade}`;
  try {
    const cleanUnits = JSON.parse(JSON.stringify(units));
    await setDoc(doc(db, 'curriculum', String(grade)), {
      grade: Number(grade),
      units: cleanUnits,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchCurriculumFromCloud(): Promise<Record<number, UnitData[]>> {
  const path = 'curriculum';
  try {
    const querySnapshot = await getDocs(collection(db, 'curriculum'));
    const result: Record<number, UnitData[]> = {};
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.grade && Array.isArray(data.units)) {
        result[Number(data.grade)] = data.units;
      }
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

/**
 * Subscribe to real-time curriculum changes across all devices
 */
export function subscribeToCurriculum(callback: (curriculumMap: Record<number, UnitData[]>) => void): () => void {
  const path = 'curriculum';
  try {
    return onSnapshot(
      collection(db, 'curriculum'),
      (snapshot) => {
        const result: Record<number, UnitData[]> = {};
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.grade && Array.isArray(data.units)) {
            result[Number(data.grade)] = data.units;
          }
        });
        if (Object.keys(result).length > 0) {
          callback(result);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

/**
 * Exercise Clusters Cloud Sync: saves imported exercise clusters per grade to Cloud Firestore
 */
export async function syncExercisesToCloud(grade: number, clusters: ExerciseCluster[]): Promise<boolean> {
  const path = `exercises/${grade}`;
  try {
    // Tối ưu hóa kích thước dữ liệu: loại bỏ rawJson trùng lặp để tài liệu không vượt quá giới hạn 1MB của Firestore
    const cleanClusters = clusters.map(c => ({
      id: c.id,
      clusterNumber: c.clusterNumber,
      title: c.title,
      description: c.description || '',
      grade: Number(c.grade || grade),
      itemsCount: c.questions?.length || 0,
      updatedAt: c.updatedAt || new Date().toISOString(),
      questions: (c.questions || []).map(q => {
        const item: any = {
          id: q.id,
          question: q.question,
          options: q.options || [],
          answerIndex: typeof q.answerIndex === 'number' ? q.answerIndex : 0,
          type: q.type || 'quiz'
        };
        if (q.explanation) item.explanation = q.explanation;
        if (q.hint) item.hint = q.hint;
        if (q.unitNumber) item.unitNumber = q.unitNumber;
        return item;
      })
    }));

    await setDoc(doc(db, 'exercises', String(grade)), {
      grade: Number(grade),
      clusters: cleanClusters,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchExercisesFromCloud(): Promise<Record<number, ExerciseCluster[]>> {
  const path = 'exercises';
  try {
    const querySnapshot = await getDocs(collection(db, 'exercises'));
    const result: Record<number, ExerciseCluster[]> = {};
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.grade && Array.isArray(data.clusters)) {
        result[Number(data.grade)] = data.clusters;
      }
    });
    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return {};
  }
}

export function subscribeToExercises(callback: (exercisesMap: Record<number, ExerciseCluster[]>) => void): () => void {
  const path = 'exercises';
  try {
    return onSnapshot(
      collection(db, 'exercises'),
      (snapshot) => {
        const result: Record<number, ExerciseCluster[]> = {};
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.grade && Array.isArray(data.clusters)) {
            result[Number(data.grade)] = data.clusters;
          }
        });
        if (Object.keys(result).length > 0) {
          callback(result);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}


/**
 * Custom Classes Cloud Sync
 */
export interface CloudClassItem {
  grade: number;
  name: string;
  description: string;
  emoji: string;
}

export async function syncClassToCloud(classItem: CloudClassItem): Promise<boolean> {
  const path = `classes/${classItem.grade}`;
  try {
    await setDoc(doc(db, 'classes', String(classItem.grade)), {
      grade: Number(classItem.grade),
      name: classItem.name,
      description: classItem.description,
      emoji: classItem.emoji,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function syncAllClassesToCloud(classList: CloudClassItem[]): Promise<boolean> {
  try {
    const promises = classList.map(c => syncClassToCloud(c));
    await Promise.all(promises);
    return true;
  } catch (err) {
    console.warn('syncAllClassesToCloud error:', err);
    return false;
  }
}

export async function deleteClassFromCloud(grade: number): Promise<boolean> {
  const path = `classes/${grade}`;
  try {
    await deleteDoc(doc(db, 'classes', String(grade)));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

export async function fetchClassesFromCloud(): Promise<CloudClassItem[]> {
  const path = 'classes';
  try {
    const querySnapshot = await getDocs(collection(db, 'classes'));
    const list: CloudClassItem[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data && data.grade && data.name) {
        list.push({
          grade: Number(data.grade),
          name: String(data.name),
          description: String(data.description || ''),
          emoji: String(data.emoji || '📚')
        });
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Subscribe to real-time classes changes across all devices
 */
export function subscribeToClasses(callback: (classes: CloudClassItem[]) => void): () => void {
  const path = 'classes';
  try {
    return onSnapshot(
      collection(db, 'classes'),
      (snapshot) => {
        const list: CloudClassItem[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data && data.grade && data.name) {
            list.push({
              grade: Number(data.grade),
              name: String(data.name),
              description: String(data.description || ''),
              emoji: String(data.emoji || '📚')
            });
          }
        });
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return () => {};
  }
}

/**
 * Application Branding & Logo Settings Cloud Sync
 * Persists logo and display sizes across all devices in Cloud Firestore
 */
export interface CloudBrandingSettings {
  customLogo?: string | null;
  headerLogoSize?: number;
  welcomeLogoSize?: number;
  updatedAt?: string;
}

export async function syncBrandingToCloud(settings: CloudBrandingSettings): Promise<boolean> {
  const path = 'app_settings/branding';
  try {
    const logoPayload = settings.customLogo !== undefined ? settings.customLogo : null;
    await setDoc(doc(db, 'app_settings', 'branding'), {
      customLogo: logoPayload,
      headerLogoSize: Number(settings.headerLogoSize || 200),
      welcomeLogoSize: Number(settings.welcomeLogoSize || 300),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

export async function fetchBrandingFromCloud(): Promise<CloudBrandingSettings | null> {
  const path = 'app_settings/branding';
  try {
    const docSnap = await getDoc(doc(db, 'app_settings', 'branding'));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        customLogo: data.customLogo !== undefined ? data.customLogo : null,
        headerLogoSize: data.headerLogoSize !== undefined ? Number(data.headerLogoSize) : 200,
        welcomeLogoSize: data.welcomeLogoSize !== undefined ? Number(data.welcomeLogoSize) : 300,
        updatedAt: data.updatedAt
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export function subscribeToBranding(callback: (settings: CloudBrandingSettings) => void): () => void {
  const path = 'app_settings/branding';
  try {
    return onSnapshot(
      doc(db, 'app_settings', 'branding'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({
            customLogo: data.customLogo !== undefined ? data.customLogo : null,
            headerLogoSize: data.headerLogoSize !== undefined ? Number(data.headerLogoSize) : 200,
            welcomeLogoSize: data.welcomeLogoSize !== undefined ? Number(data.welcomeLogoSize) : 300,
            updatedAt: data.updatedAt
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}

/**
 * Lưu yêu cầu cấp lại mật khẩu lên Cloud Firestore
 */
export async function savePasswordResetRequestToCloud(request: PasswordResetRequest): Promise<boolean> {
  const path = `password_reset_requests/${request.id}`;
  try {
    await setDoc(doc(db, 'password_reset_requests', request.id), {
      id: request.id,
      fullName: String(request.fullName || '').slice(0, 100),
      nickname: String(request.nickname || '').slice(0, 100),
      phone: String(request.phone || '').slice(0, 20),
      email: String(request.email || '').slice(0, 120),
      createdAt: request.createdAt || new Date().toISOString(),
      status: request.status || 'pending',
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Lấy danh sách các yêu cầu cấp lại mật khẩu từ Cloud Firestore
 */
export async function fetchPasswordResetRequestsFromCloud(): Promise<PasswordResetRequest[]> {
  const path = 'password_reset_requests';
  try {
    const colSnap = await getDocs(collection(db, 'password_reset_requests'));
    const list: PasswordResetRequest[] = [];
    colSnap.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: data.id || docSnap.id,
        fullName: data.fullName || '',
        nickname: data.nickname || '',
        phone: data.phone || '',
        email: data.email || '',
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || 'pending',
      });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Xóa hoặc hoàn tất yêu cầu cấp lại mật khẩu
 */
export async function deletePasswordResetRequestFromCloud(id: string): Promise<boolean> {
  const path = `password_reset_requests/${id}`;
  try {
    await deleteDoc(doc(db, 'password_reset_requests', id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Lưu yêu cầu xác minh tài khoản khi bị xung đột đăng nhập thiết bị
 */
export async function saveAccountVerificationRequestToCloud(req: AccountVerificationRequest): Promise<boolean> {
  const path = `account_verification_requests/${req.id}`;
  try {
    await setDoc(doc(db, 'account_verification_requests', req.id), {
      id: req.id,
      learnerId: String(req.learnerId || '').slice(0, 64),
      fullName: String(req.fullName || '').slice(0, 64),
      nickname: String(req.nickname || '').slice(0, 64),
      phone: String(req.phone || '').slice(0, 20),
      email: String(req.email || '').slice(0, 120),
      createdAt: req.createdAt || new Date().toISOString(),
      status: req.status || 'pending',
      deviceInfo: req.deviceInfo || '',
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return false;
  }
}

/**
 * Tải danh sách các yêu cầu xác minh tài khoản cho Admin
 */
export async function fetchAccountVerificationRequestsFromCloud(): Promise<AccountVerificationRequest[]> {
  const path = 'account_verification_requests';
  try {
    const colSnap = await getDocs(collection(db, 'account_verification_requests'));
    const list: AccountVerificationRequest[] = [];
    colSnap.forEach(docSnap => {
      const data = docSnap.data();
      list.push({
        id: data.id || docSnap.id,
        learnerId: data.learnerId || '',
        fullName: data.fullName || '',
        nickname: data.nickname || '',
        phone: data.phone || '',
        email: data.email || '',
        createdAt: data.createdAt || new Date().toISOString(),
        status: data.status || 'pending',
        deviceInfo: data.deviceInfo || '',
      });
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

/**
 * Xóa yêu cầu xác minh tài khoản (sau khi Admin xử lý)
 */
export async function deleteAccountVerificationRequestFromCloud(id: string): Promise<boolean> {
  const path = `account_verification_requests/${id}`;
  try {
    await deleteDoc(doc(db, 'account_verification_requests', id));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
}

/**
 * =========================================================================
 * QUẢN LÝ PHIÊN ĐĂNG NHẬP DUY NHẤT (1 THỜI ĐIỂM CHỈ 1 THIẾT BỊ ĐĂNG NHẬP)
 * =========================================================================
 */

/**
 * Kiểm tra xem tài khoản này có đang đăng nhập trên một thiết bị khác không
 * Hoặc kiểm tra phiên hiện tại có còn hợp lệ không (có bị Admin ngắt/mở khóa không)
 */
export async function checkLearnerActiveSession(
  learnerId: string,
  currentDeviceId: string,
  currentSessionId?: string | null
): Promise<{
  isConflict: boolean;
  isTerminated?: boolean;
  terminationMessage?: string;
  activeSession?: UserActiveSession;
}> {
  const path = `active_sessions/${learnerId}`;
  try {
    const docSnap = await getDoc(doc(db, 'active_sessions', learnerId));
    if (!docSnap.exists()) {
      return { isConflict: false };
    }
    const data = docSnap.data() as UserActiveSession;

    // 1. Nếu tài khoản đã bị đánh dấu ngắt phiên (Admin mở khóa hoặc có yêu cầu xác minh)
    if (!data.isLoggedIn || data.terminationReason === 'admin_unlocked' || data.terminationReason === 'device_conflict') {
      return {
        isConflict: false,
        isTerminated: true,
        terminationMessage: data.terminatedMessage || 'Phiên đăng nhập này sẽ bị ngắt do có báo cáo xác minh tình trạng đăng nhập trên thiết bị lạ',
        activeSession: data
      };
    }

    // 2. Nếu phiên hiện tại có sessionId khác với phiên mới nhất trên Firestore
    if (currentSessionId && data.sessionId && data.sessionId !== currentSessionId) {
      return {
        isConflict: true,
        isTerminated: true,
        terminationMessage: 'Phiên đăng nhập này sẽ bị ngắt do có báo cáo xác minh tình trạng đăng nhập trên thiết bị lạ',
        activeSession: data
      };
    }

    // 3. Nếu cùng 1 thiết bị đang dùng -> cho phép vào tiếp
    if (data.deviceId === currentDeviceId) {
      return { isConflict: false, activeSession: data };
    }

    // 4. Kiểm tra thời gian hoạt động gần nhất (nếu quá 30 phút không hoạt động -> coi như phiên cũ hết hạn)
    const lastActiveTime = new Date(data.lastHeartbeat || data.loginAt).getTime();
    const now = Date.now();
    const THIRTY_MINS = 30 * 60 * 1000;
    if (now - lastActiveTime > THIRTY_MINS) {
      // Phiên cũ đã hết hạn
      return { isConflict: false };
    }

    // Đang có thiết bị khác đăng nhập hoạt động!
    return { isConflict: true, activeSession: data };
  } catch (error) {
    console.warn('Could not check active session from Firestore:', error);
    return { isConflict: false };
  }
}

/**
 * Lắng nghe thời gian thực thay đổi phiên đăng nhập của người học (onSnapshot)
 * Khi Admin mở khóa hoặc khi thiết bị khác đăng nhập, thiết bị cũ sẽ nhận thông báo tức thì (<1s)
 */
export function subscribeToLearnerActiveSession(
  learnerId: string,
  callback: (session: UserActiveSession | null) => void
): () => void {
  const path = `active_sessions/${learnerId}`;
  try {
    return onSnapshot(
      doc(db, 'active_sessions', learnerId),
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as UserActiveSession);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('subscribeToLearnerActiveSession error:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeToLearnerActiveSession init error:', err);
    return () => {};
  }
}

/**
 * Ghi nhận thiết bị hiện tại đã đăng nhập tài khoản
 */
export async function setAccountActiveSession(session: UserActiveSession): Promise<boolean> {
  const path = `active_sessions/${session.learnerId}`;
  try {
    await setDoc(doc(db, 'active_sessions', session.learnerId), {
      learnerId: session.learnerId,
      username: session.username || '',
      nickname: session.nickname || '',
      sessionId: session.sessionId,
      deviceId: session.deviceId,
      deviceDescription: session.deviceDescription,
      isLoggedIn: true,
      loginAt: session.loginAt || new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      terminationReason: null,
      terminatedMessage: null,
      terminatedAt: null
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Cập nhật nhịp tim (heartbeat) định kỳ khi người dùng đang học
 * Không tự ý hồi sinh phiên nếu đã bị Admin ngắt hoặc đã bị thiết bị khác thay thế!
 */
export async function updateSessionHeartbeat(
  learnerId: string,
  deviceId: string,
  currentSessionId?: string | null
): Promise<void> {
  try {
    const docRef = doc(db, 'active_sessions', learnerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as UserActiveSession;
      // Nếu phiên đã bị ngắt -> TUYỆT ĐỐI không ghi đè lại thành isLoggedIn: true
      if (!data.isLoggedIn || data.terminationReason === 'admin_unlocked') {
        return;
      }
      // Nếu sessionId trên Firestore không khớp với phiên hiện tại -> không ghi đè
      if (currentSessionId && data.sessionId && data.sessionId !== currentSessionId) {
        return;
      }
      if (deviceId && data.deviceId && data.deviceId !== deviceId) {
        return;
      }
    }
    await setDoc(
      docRef,
      {
        deviceId,
        isLoggedIn: true,
        lastHeartbeat: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    // Silent heartbeat fail
  }
}

/**
 * Xóa / Ngắt phiên đăng nhập (khi người dùng đăng xuất hoặc khi Admin mở khóa)
 */
export async function clearAccountActiveSession(
  learnerId: string,
  reason = 'admin_unlocked',
  customMessage = 'Phiên đăng nhập này sẽ bị ngắt do có báo cáo xác minh tình trạng đăng nhập trên thiết bị lạ'
): Promise<boolean> {
  const path = `active_sessions/${learnerId}`;
  try {
    const payload = {
      isLoggedIn: false,
      terminatedAt: new Date().toISOString(),
      terminationReason: reason,
      terminatedMessage: customMessage,
      lastHeartbeat: new Date().toISOString(),
      loggedOutAt: new Date().toISOString(),
    };

    // 1. Ghi ngắt phiên trực tiếp vào active_sessions/{learnerId}
    await setDoc(doc(db, 'active_sessions', learnerId), payload, { merge: true });

    // 2. Quét toàn bộ active_sessions để tìm bất kỳ document nào có learnerId hoặc username/nickname khớp
    try {
      const querySnap = await getDocs(collection(db, 'active_sessions'));
      const targetLower = learnerId.trim().toLowerCase();
      querySnap.forEach(d => {
        const data = d.data();
        const dLearnerId = (data.learnerId || '').toLowerCase();
        const dUsername = (data.username || '').toLowerCase();
        const dNickname = (data.nickname || '').toLowerCase();
        const dDocId = d.id.toLowerCase();

        if (dDocId === targetLower || dLearnerId === targetLower || dUsername === targetLower || dNickname === targetLower) {
          setDoc(doc(db, 'active_sessions', d.id), payload, { merge: true }).catch(() => {});
        }
      });
    } catch (scanErr) {
      console.warn('clearAccountActiveSession scan notice:', scanErr);
    }

    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Lấy danh sách tất cả các phiên đang đăng nhập (dành cho Admin)
 */
export async function fetchAllActiveSessions(): Promise<UserActiveSession[]> {
  const path = 'active_sessions';
  try {
    const colSnap = await getDocs(collection(db, 'active_sessions'));
    const list: UserActiveSession[] = [];
    colSnap.forEach(docSnap => {
      const data = docSnap.data() as UserActiveSession;
      if (data.isLoggedIn) {
        list.push(data);
      }
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}


