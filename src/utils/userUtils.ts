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
 * Biểu thức chính quy cho nickname (chữ hoa/thường, có thể có số, không ký tự đặc biệt)
 */
export const NICKNAME_REGEX =
  /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+$/;

/**
 * 1. Quy tắc đặt Họ tên:
 * - 4 - 16 kí tự
 * - Là tên gọi đầy đủ
 * - Có thể viết hoa
 * - Không được có kí tự đặc biệt hoặc số
 */
export function validateFullName(fullName?: string): { isValid: boolean; error?: string } {
  if (!fullName || !fullName.trim()) {
    return { isValid: false, error: 'Vui lòng nhập họ và tên đầy đủ!' };
  }
  const clean = fullName.trim();
  if (clean.length < 4) {
    return { isValid: false, error: 'Họ tên phải có tối thiểu 4 ký tự!' };
  }
  if (clean.length > 16) {
    return { isValid: false, error: 'Họ tên chỉ được tối đa 16 ký tự!' };
  }
  if (/\d/.test(clean)) {
    return { isValid: false, error: 'Họ tên không được chứa chữ số!' };
  }
  if (!VIETNAMESE_NAME_REGEX.test(clean)) {
    return { isValid: false, error: 'Họ tên không được chứa ký tự đặc biệt!' };
  }
  return { isValid: true };
}

/**
 * 2. Quy tắc đặt Nickname:
 * - Tên gọi thân mật hoặc tên viết tắt, sẽ hiển thị kế bên Avatar
 * - Tối đa 16 kí tự (từ 2 đến 16 kí tự)
 * - Có thể viết hoa
 * - Có thể có số
 * - Không được có kí tự đặc biệt
 */
export function validateNickname(nickname?: string): { isValid: boolean; error?: string } {
  if (!nickname || !nickname.trim()) {
    return { isValid: false, error: 'Vui lòng nhập nickname (tên hiển thị kế bên Avatar)!' };
  }
  const clean = nickname.trim();
  if (clean.length < 2) {
    return { isValid: false, error: 'Nickname phải có tối thiểu 2 ký tự!' };
  }
  if (clean.length > 16) {
    return { isValid: false, error: 'Nickname chỉ được tối đa 16 ký tự!' };
  }
  if (!NICKNAME_REGEX.test(clean)) {
    return { isValid: false, error: 'Nickname không được chứa ký tự đặc biệt (chỉ dùng chữ và số)!' };
  }
  return { isValid: true };
}

/**
 * 3. Quy tắc đặt Tên đăng nhập / Username:
 * - 4 - 16 kí tự
 * - Là tên dùng để đăng nhập
 * - Không được viết hoa (chỉ dùng chữ thường)
 * - Không được có kí tự đặc biệt (chỉ gồm a-z và 0-9)
 * - Có thể có số
 */
export function validateUsername(username?: string): { isValid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { isValid: false, error: 'Vui lòng nhập tên đăng nhập / username!' };
  }
  const clean = username.trim();
  if (clean.length < 4) {
    return { isValid: false, error: 'Tên đăng nhập phải có tối thiểu 4 ký tự!' };
  }
  if (clean.length > 16) {
    return { isValid: false, error: 'Tên đăng nhập chỉ được tối đa 16 ký tự!' };
  }
  if (/\s/.test(clean)) {
    return { isValid: false, error: 'Tên đăng nhập không được chứa khoảng trắng (dấu cách)!' };
  }
  if (/[A-Z]/.test(clean)) {
    return { isValid: false, error: 'Tên đăng nhập không được viết hoa (chỉ sử dụng chữ viết thường)!' };
  }
  if (/[^\u0000-\u007F]/.test(clean)) {
    return { isValid: false, error: 'Tên đăng nhập không được có dấu tiếng Việt!' };
  }
  if (!/^[a-z0-9]+$/.test(clean)) {
    return { isValid: false, error: 'Tên đăng nhập không được có ký tự đặc biệt (chỉ gồm chữ thường a-z và số 0-9)!' };
  }
  if (clean.startsWith('learner')) {
    return { isValid: false, error: 'Tên đăng nhập không được bắt đầu bằng "learner"!' };
  }
  return { isValid: true };
}

