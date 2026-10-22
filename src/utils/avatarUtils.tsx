import React from 'react';
import { AVATARS } from '../data/unitsData';

export interface CustomAvatarItem {
  id: string;
  name: string;
  icon: string; // can be emoji or data:image URL
  isCustom?: boolean;
  ownerLearnerId?: string; // ID của người học sở hữu avatar tải lên (riêng tư)
}

export const STORAGE_KEY_CUSTOM_AVATARS = 'easyeng_custom_avatars_v3';

export function isImageAvatar(avatarStr?: string): boolean {
  if (!avatarStr) return false;
  return (
    avatarStr.startsWith('data:image/') ||
    avatarStr.startsWith('http://') ||
    avatarStr.startsWith('https://') ||
    avatarStr.startsWith('blob:')
  );
}

/**
 * Resolves avatar string (which may be a custom_av_ ID, a built-in avatar ID, a data URL, or an emoji)
 * to its renderable asset (either image URL or emoji).
 */
export function resolveAvatarIcon(avatarStr?: string, customList?: CustomAvatarItem[]): string {
  if (!avatarStr) return '🎓';

  // Direct image URL
  if (isImageAvatar(avatarStr)) return avatarStr;

  // Built-in animal ID (fox, cat, bear, etc.)
  const builtIn = AVATARS.find(a => a.id === avatarStr);
  if (builtIn) return builtIn.icon;

  // Custom list passed directly
  if (customList && customList.length > 0) {
    const matched = customList.find(c => c.id === avatarStr || c.icon === avatarStr);
    if (matched && matched.icon) return matched.icon;
  }

  // Lookup in localStorage if it is a custom avatar ID
  if (avatarStr.startsWith('custom_av_')) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_AVATARS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const matched = parsed.find((c: CustomAvatarItem) => c.id === avatarStr || c.icon === avatarStr);
          if (matched && matched.icon) return matched.icon;
        }
      }
    } catch {
      // ignore
    }
  }

  // Fallback (e.g. raw emoji or string)
  return avatarStr;
}

export function renderAvatarContent(
  avatarStr?: string,
  fallback: string = '🎓',
  customList?: CustomAvatarItem[]
): React.ReactNode {
  if (!avatarStr) return <span>{fallback}</span>;

  const resolved = resolveAvatarIcon(avatarStr, customList);

  if (isImageAvatar(resolved)) {
    return (
      <img
        src={resolved}
        alt="Avatar"
        className="w-full h-full object-cover rounded-xl"
        onError={(e) => {
          // If image fails to load, replace with fallback
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  return <span>{resolved}</span>;
}
