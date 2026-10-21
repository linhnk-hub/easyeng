/**
 * Tiện ích quản lý danh tính thiết bị và phiên đăng nhập (Device & Session Management)
 */

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('easyeng_device_id');
    if (!id) {
      id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('easyeng_device_id', id);
    }
    return id;
  } catch (e) {
    return `dev_fallback_${Date.now()}`;
  }
}

export function getDeviceDescription(): string {
  if (typeof navigator === 'undefined') return 'Thiết bị người dùng';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'Điện thoại Android';
  if (/iphone|ipod/i.test(ua)) return 'Điện thoại iPhone';
  if (/ipad/i.test(ua)) return 'Máy tính bảng iPad';
  if (/mobile/i.test(ua)) return 'Thiết bị di động';
  if (/macintosh|mac os x/i.test(ua)) return 'Máy tính Mac (macOS)';
  if (/windows/i.test(ua)) return 'Máy tính Windows';
  if (/linux/i.test(ua)) return 'Máy tính Linux';
  return 'Máy tính (Desktop)';
}
