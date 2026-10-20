/**
 * Các tiện ích quản lý và chuẩn hóa tài khoản người dùng / học sinh
 */

/**
 * Chuyển đổi tên hiển thị (nickname) thành tên đăng nhập mặc định
 * Ví dụ: "Tý" -> "ty", "Bé Na" -> "bena", "Hoàng Minh" -> "hoangminh"
 */
export function generateDefaultUsernameFromName(name?: string): string {
  if (!name || !name.trim()) return 'user';
  const clean = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
  return clean || 'user';
}

/**
 * Lấy tên đăng nhập hợp lệ cho người dùng và giao diện:
 * - Tuyệt đối không hiển thị mã kỹ thuật dạng learner... (mã CSDL nội bộ)
 * - Đối với người dùng ban đầu chưa có tên đăng nhập (hoặc đang dính mã learner...),
 *   tự động chọn tên nickname làm tên đăng nhập.
 * - Tên đăng nhập này được ánh xạ với hồ sơ learner tương ứng và chỉ có Quản lý có quyền đổi.
 */
export function resolveValidUsername(username?: string, name?: string): string {
  if (username && typeof username === 'string') {
    const trimmed = username.trim();
    // Loại trừ hoàn toàn ID kỹ thuật csdl tự sinh dạng "learner" / "learner_..."
    if (trimmed && !trimmed.toLowerCase().startsWith('learner')) {
      return trimmed;
    }
  }
  // Đối với người dùng ban đầu chưa có tên đăng nhập thì tự động chọn tên nickname là tên đăng nhập
  if (name && typeof name === 'string' && name.trim()) {
    const trimmedName = name.trim();
    if (!trimmedName.toLowerCase().startsWith('learner')) {
      return trimmedName;
    }
  }
  return 'user';
}

/**
 * Chuẩn hóa số điện thoại: Chỉ cho phép ký tự số 0-9, tối đa 11 số
 */
export function sanitizePhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(0, 11);
}

/**
 * Chuẩn hóa email: Không dấu tiếng Việt, không khoảng trắng, không ký tự đặc biệt, chữ thường
 */
export function sanitizeEmailAddress(email?: string): string {
  if (!email) return '';
  return email
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9.@_-]/g, '')
    .toLowerCase();
}
