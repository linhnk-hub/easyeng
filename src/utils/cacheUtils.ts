export const STORAGE_KEYS = {
  ACTIVE_LEARNER: 'easyeng_active_learner_id_v3',
  LEARNERS: 'easyeng_learners_list_v3',
  CLASSES: 'easyeng_classes_list_v3',
  CURRICULUM: 'easyeng_curriculum_map_v3',
  CUSTOM_AVATARS: 'easyeng_custom_avatars_v3',
  SOUND_ENABLED: 'eduquest_sound_enabled',
  AUTO_SPEAK: 'easyeng_auto_speak',
  VOICE_GENDER: 'easyeng_voice_gender'
};

export interface ClearCacheOptions {
  clearBrowserCache?: boolean;
  clearSessionStorage?: boolean;
  clearActiveSession?: boolean;
  resetAllData?: boolean;
}

export interface ClearCacheResult {
  cachesDeleted: number;
  sessionCleared: boolean;
  activeSessionCleared: boolean;
  allDataReset: boolean;
}

/**
 * Clears browser cache (CacheStorage), sessionStorage, active learner session,
 * and optionally resets all stored application data.
 */
export async function clearAppCache(options: ClearCacheOptions = {}): Promise<ClearCacheResult> {
  const {
    clearBrowserCache = true,
    clearSessionStorage = true,
    clearActiveSession = true,
    resetAllData = false
  } = options;

  let cachesDeleted = 0;

  // 1. Clear CacheStorage (window.caches)
  if (clearBrowserCache && typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await window.caches.keys();
      const results = await Promise.all(cacheNames.map(name => window.caches.delete(name)));
      cachesDeleted = results.filter(Boolean).length;
    } catch (err) {
      console.warn('Không thể xóa CacheStorage:', err);
    }
  }

  // 2. Unregister any service workers
  if (clearBrowserCache && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
    } catch (err) {
      console.warn('Không thể hủy Service Worker:', err);
    }
  }

  // 3. Stop speech synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  // 4. Clear sessionStorage
  let sessionCleared = false;
  if (clearSessionStorage && typeof window !== 'undefined') {
    try {
      window.sessionStorage.clear();
      sessionCleared = true;
    } catch (err) {
      console.warn('Không thể xóa sessionStorage:', err);
    }
  }

  // 5. Clear active learner session
  let activeSessionCleared = false;
  if (clearActiveSession && typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_LEARNER);
      activeSessionCleared = true;
    } catch (err) {
      console.warn('Không thể xóa phiên người học hiện tại:', err);
    }
  }

  // 6. Optionally reset all stored data
  let allDataReset = false;
  if (resetAllData && typeof window !== 'undefined') {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      allDataReset = true;
    } catch (err) {
      console.warn('Không thể đặt lại dữ liệu ứng dụng:', err);
    }
  }

  return {
    cachesDeleted,
    sessionCleared,
    activeSessionCleared,
    allDataReset
  };
}
