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

/**
 * Biểu thức chính quy cho họ tên Tiếng Việt và Tiếng Anh:
 * Cho phép chữ cái không dấu và có dấu của ngôn ngữ, cùng dấu cách.
 * Không cho phép ký tự đặc biệt ngoại trừ các dấu của ngôn ngữ.
 */
export const VIETNAMESE_NAME_REGEX =
  /^[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/;

/**
 * Quy tắc đặt mật khẩu:
 * - Tối thiểu 4 ký tự, tối đa 16 ký tự
 * - Bao gồm cả chữ, số và ký tự đặc biệt do người dùng đặt
 * - Bỏ khái niệm mặc định 0000
 */
export function validatePassword(password?: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Vui lòng nhập mật khẩu!' };
  }
  if (password.length < 4) {
    return { isValid: false, error: 'Mật khẩu phải có tối thiểu 4 ký tự!' };
  }
  if (password.length > 16) {
    return { isValid: false, error: 'Mật khẩu chỉ được tối đa 16 ký tự!' };
  }
  return { isValid: true };
}

/**
 * Quy tắc đặt nickname:
 * - Không dấu (không dùng dấu tiếng Việt)
 * - Không in hoa (chỉ dùng chữ thường)
 * - Tối thiểu 4 ký tự, tối đa 16 ký tự
 * - Không chứa khoảng trắng, không chứa ký tự đặc biệt khác ngoài a-z, 0-9 (và . _ -)
 */
export function validateNickname(nickname?: string): { isValid: boolean; error?: string } {
  if (!nickname || !nickname.trim()) {
    return { isValid: false, error: 'Vui lòng nhập nickname / tên đăng nhập!' };
  }
  const clean = nickname.trim();
  if (clean.length < 4) {
    return { isValid: false, error: 'Nickname phải có tối thiểu 4 ký tự!' };
  }
  if (clean.length > 16) {
    return { isValid: false, error: 'Nickname chỉ được tối đa 16 ký tự!' };
  }
  if (/\s/.test(clean)) {
    return { isValid: false, error: 'Nickname không được chứa dấu cách (khoảng trắng)!' };
  }
  if (/[A-Z]/.test(clean)) {
    return { isValid: false, error: 'Nickname không được viết in hoa (chỉ sử dụng chữ viết thường)!' };
  }
  // Kiểm tra dấu tiếng Việt hoặc ký tự Unicode
  if (/[^\u0000-\u007F]/.test(clean)) {
    return { isValid: false, error: 'Nickname phải viết không dấu (không có dấu tiếng Việt)!' };
  }
  // Chỉ chấp nhận chữ thường a-z và số 0-9 (cho phép dấu gạch dưới _, gạch nối -, dấu chấm .)
  if (!/^[a-z0-9_.-]+$/.test(clean)) {
    return { isValid: false, error: 'Nickname chỉ được chứa chữ thường và số (không chứa ký tự đặc biệt)!' };
  }
  if (clean.toLowerCase().startsWith('learner')) {
    return { isValid: false, error: 'Nickname không được bắt đầu bằng "learner" (tiền tố kỹ thuật hệ thống)!' };
  }
  return { isValid: true };
}

/**
 * Quy tắc đặt họ tên:
 * - Có thể không dấu hoặc có dấu
 * - Tối thiểu 4 ký tự, tối đa 32 ký tự
 * - Không cho phép ký tự đặc biệt ngoại trừ các dấu của ngôn ngữ (không cho phép số và ký tự đặc biệt)
 */
export function validateFullName(fullName?: string): { isValid: boolean; error?: string } {
  if (!fullName || !fullName.trim()) {
    return { isValid: false, error: 'Vui lòng nhập họ và tên!' };
  }
  const clean = fullName.trim();
  if (clean.length < 4) {
    return { isValid: false, error: 'Họ tên phải có tối thiểu 4 ký tự!' };
  }
  if (clean.length > 32) {
    return { isValid: false, error: 'Họ tên chỉ được tối đa 32 ký tự!' };
  }
  if (/\d/.test(clean)) {
    return { isValid: false, error: 'Họ tên không được chứa chữ số!' };
  }
  if (!VIETNAMESE_NAME_REGEX.test(clean)) {
    return { isValid: false, error: 'Họ tên không cho phép ký tự đặc biệt ngoại trừ các dấu của ngôn ngữ!' };
  }
  return { isValid: true };
}

