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

/**
 * Tự động clear cache mỗi khi tải lại trang (F5 / reload)
 */
export async function autoClearCacheOnReload(): Promise<void> {
  if (typeof window === 'undefined') return;

  let isReload = false;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0) {
      isReload = (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
    }
    if (!isReload && (performance as any)?.navigation?.type === 1) {
      isReload = true;
    }
  } catch {}

  if (isReload) {
    try {
      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(name => window.caches.delete(name)));
      }
      window.sessionStorage.clear();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      console.info('⚡ [EasyEng] Đã tự động xóa sạch bộ nhớ đệm (cache) khi tải lại trang (F5).');
    } catch (e) {
      console.warn('Lỗi khi tự động dọn dẹp cache:', e);
    }
  }
}

/**
 * Khởi tạo trình lắng nghe dọn cache khi nhấn F5 hoặc tải lại trang
 */
export function initAutoClearCacheListeners(): void {
  if (typeof window === 'undefined') return;

  // Chạy dọn cache nếu lần tải này do reload (F5)
  autoClearCacheOnReload();

  // Bắt phím F5 hoặc Ctrl+R để xóa cache ngay trước khi reload
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R'))) {
      try {
        if ('caches' in window) {
          window.caches.keys().then(names => names.forEach(n => window.caches.delete(n)));
        }
        window.sessionStorage.clear();
      } catch {}
    }
  });
}
