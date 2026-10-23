import React, { useState, useRef } from 'react';
import { X, Check, Lock, KeyRound, AlertCircle, Eye, EyeOff, User, Upload, Phone, Mail, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from '../types';
import { AVATARS } from '../data/unitsData';
import { soundEffects } from '../services/soundEffects';
import { renderAvatarContent, CustomAvatarItem } from '../utils/avatarUtils';
import { resolveValidUsername, validatePassword } from '../utils/userUtils';

interface AvatarModalProps {
  user: UserProfile;
  customAvatars?: CustomAvatarItem[];
  allLearners?: UserProfile[];
  onSave: (
    newName: string,
    newAvatar: string,
    newPin?: string,
    newPhone?: string,
    newEmail?: string,
    uploadedCustomAvatar?: string,
    newFullName?: string,
    newNickname?: string
  ) => void;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  user,
  customAvatars = [],
  allLearners = [],
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile state (SĐT, Email)
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || '');
  const [profileError, setProfileError] = useState<string | null>(null);

  // Avatar state
  // Check if user has an existing uploaded custom avatar
  const existingUserCustomAvatar = user.customAvatarUrl || 
    customAvatars.find(a => a.ownerLearnerId === user.learnerId)?.icon ||
    (user.avatar.startsWith('data:image/') ? user.avatar : null);

  const [userUploadedAvatar, setUserUploadedAvatar] = useState<string | null>(existingUserCustomAvatar);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);
  const userAvatarFileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const currentActualPin = user.pin ? user.pin : '';
  // Tên đăng nhập dùng để đăng nhập (không viết hoa, không ký tự đặc biệt, có thể có số)
  const username = resolveValidUsername(user.username, user.nickname || user.name);

  // Handle phone input: Digits only (không cho phép gõ chữ)
  const handlePhoneChange = (val: string) => {
    const digitsOnly = val.replace(/\D/g, '').slice(0, 11);
    setPhone(digitsOnly);
    setProfileError(null);
  };

  // Handle email input: No Vietnamese accented characters, no spaces, no invalid special characters
  const handleEmailChange = (val: string) => {
    const sanitized = val
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9.@_-]/g, '')
      .toLowerCase();
    setEmail(sanitized);
    setProfileError(null);
  };

  // Handle user uploading their single personal avatar (overwriting previous one if uploaded again)
  const handleUserAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      soundEffects.playError();
      setProfileError('Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      soundEffects.playError();
      setProfileError('Dung lượng ảnh không được vượt quá 5MB!');
      return;
    }

    soundEffects.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      // Resize/compress to thumbnail 200x200 max so it syncs cleanly to Firestore
      const img = new Image();
      img.onload = () => {
        const maxDim = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          // Ghi đè lên avatar cũ của người dùng
          setUserUploadedAvatar(compressed);
          setSelectedAvatar(compressed);
          setProfileError(null);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (e.target) e.target.value = '';
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    // 1. Kiểm tra số điện thoại (nếu có nhập)
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      if (cleanPhone.length < 9 || cleanPhone.length > 11) {
        soundEffects.playError();
        setProfileError('Số điện thoại không hợp lệ (phải gồm từ 9 đến 11 chữ số)!');
        return;
      }
      // Đối chiếu với dữ liệu SDT của các người dùng khác trên CSDL
      const phoneConflict = allLearners.find(
        l => l.learnerId !== user.learnerId && l.phone && l.phone.trim() === cleanPhone
      );
      if (phoneConflict) {
        soundEffects.playError();
        setProfileError(`Số điện thoại "${cleanPhone}" đã tồn tại trong hệ thống (được sử dụng bởi tài khoản khác)!`);
        return;
      }
    }

    // 2. Kiểm tra email (nếu có nhập)
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(cleanEmail)) {
        soundEffects.playError();
        setProfileError('Địa chỉ email không đúng định dạng (ví dụ: user@gmail.com, không có dấu hay ký tự đặc biệt)!');
        return;
      }
      // Đối chiếu với dữ liệu Email của các người dùng khác trên CSDL
      const emailConflict = allLearners.find(
        l => l.learnerId !== user.learnerId && l.email && l.email.trim().toLowerCase() === cleanEmail
      );
      if (emailConflict) {
        soundEffects.playError();
        setProfileError(`Địa chỉ email "${cleanEmail}" đã tồn tại trong hệ thống (được sử dụng bởi tài khoản khác)!`);
        return;
      }
    }

    soundEffects.playSuccess();
    onSave(
      username,
      selectedAvatar,
      undefined,
      cleanPhone,
      cleanEmail,
      userUploadedAvatar || undefined,
      undefined,
      username
    );
    onClose();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    // 1. Kiểm tra mật khẩu cũ
    if (oldPin !== currentActualPin) {
      soundEffects.playError();
      setPinError('Mật khẩu cũ không chính xác!');
      return;
    }

    // 2. Kiểm tra quy tắc đặt mật khẩu: tối thiểu 4 kí tự, tối đa 16 kí tự bao gồm cả chữ, số và ký tự đặc biệt
    const passValidation = validatePassword(newPin);
    if (!passValidation.isValid) {
      soundEffects.playError();
      setPinError(passValidation.error || 'Mật khẩu mới phải từ 4 đến 16 ký tự!');
      return;
    }

    // 3. Kiểm tra xác nhận mật khẩu
    if (newPin !== confirmPin) {
      soundEffects.playError();
      setPinError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    soundEffects.playSuccess();
    onSave(
      username,
      selectedAvatar,
      newPin,
      phone.trim(),
      email.trim(),
      userUploadedAvatar || undefined,
      undefined,
      username
    );
    setPinSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  // Avatar visibility rule:
  // - Built-in animal avatars
  // - Global admin avatars (!ownerLearnerId)
  // - ONLY this user's uploaded avatar (ownerLearnerId === user.learnerId)
  // - OTHER users' avatars are filtered out!
  const visibleCustomAvatars = customAvatars.filter(
    a => !a.ownerLearnerId || a.ownerLearnerId === user.learnerId
  );

  const builtInAvatarsList = AVATARS.map(a => ({ id: a.id, name: a.name, icon: a.icon }));

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-7 space-y-4 animate-float border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-800">
              Thông tin tài khoản
            </h2>
            <p className="text-xs text-slate-500">
              Cập nhật hồ sơ, số điện thoại, email và mật khẩu
            </p>
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

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('profile');
              setProfileError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>Hồ sơ & Avatar</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('password');
              setPinError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Đổi mật khẩu</span>
          </button>
        </div>

        {/* TAB 1: PROFILE, USERNAME, PHONE, EMAIL & AVATAR */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
            {profileError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{profileError}</span>
              </div>
            )}

            {/* Tên đăng nhập (Cố định, người dùng không thể tự sửa, chỉ Quản lý có quyền đổi) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-600" />Tên đăng nhập:
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  disabled
                  readOnly
                  className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-xs cursor-not-allowed select-none"
                  title="Tên đăng nhập không thể tự chỉnh sửa"
                />
              </div>
            </div>

            {/* Số điện thoại (Chỉ cho phép nhập số 0-9, không cho phép gõ chữ) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-amber-600" />Số điện thoại:
                </span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={11}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-xs sm:text-sm"
              />
            </div>

            {/* Địa chỉ Email (Không dấu, không ký tự đặc biệt) */}
            <div className="space-y-1">
              <label className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />Địa chỉ Email:
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                maxLength={60}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-xs sm:text-sm"
              />
            </div>

            {/* PHẦN TỰ UPLOAD AVATAR CỦA NGƯỜI DÙNG (TỐI ĐA 1 AVA, UPLOAD TIẾP GHI ĐÈ, RIÊNG TƯ) */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Hình đại diện:
                </label>
                <div>
                  <input
                    type="file"
                    ref={userAvatarFileInputRef}
                    accept="image/*"
                    onChange={handleUserAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => userAvatarFileInputRef.current?.click()}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                    title="Tải hình lên"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{userUploadedAvatar ? 'Đổi hình' : 'Tải hình lên'}</span>
                  </button>
                </div>
              </div>

              {/* Box Avatar cá nhân đã upload */}
              {userUploadedAvatar && (
                <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-white border-2 border-amber-400 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {renderAvatarContent(userUploadedAvatar)}
                    </div>
                    <div className="min-w-0 text-left">
                      <span className="block text-xs font-bold text-amber-900 truncate">
                        Hình của bạn
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedAvatar(userUploadedAvatar);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      selectedAvatar === userUploadedAvatar
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white hover:bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {selectedAvatar === userUploadedAvatar ? '✓ Đang chọn' : 'Chọn hình'}
                  </button>
                </div>
              )}

              {/* Danh sách avatar hệ thống (người dùng khác không thấy avatar riêng tư) */}
              {visibleCustomAvatars.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 block">
                    Hoặc chọn trong bộ sưu tập ({visibleCustomAvatars.length}):
                  </span>
                  <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
                    {visibleCustomAvatars.map((av) => {
                      const isSelected = selectedAvatar === av.icon || selectedAvatar === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => {
                            soundEffects.playClick();
                            setSelectedAvatar(av.icon || av.id);
                          }}
                          className={`p-1.5 rounded-xl border-2 transition-all flex items-center justify-center cursor-pointer aspect-square ${
                            isSelected
                              ? 'border-amber-500 bg-white shadow-md scale-105 ring-2 ring-amber-300'
                              : 'border-transparent bg-white/70 hover:bg-white'
                          }`}
                          title={av.name}
                        >
                          <div className="w-10 h-10 flex items-center justify-center text-2xl overflow-hidden rounded-lg">
                            {renderAvatarContent(av.icon, '🎓')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-display font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer active:scale-95 transition"
              >
                Lưu thông tin ✨
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: CHANGE PIN PASSWORD */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3.5 overflow-y-auto pr-1 flex-1">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Độ dài mật khẩu: 4 - 16 kí tự
              </span>
            </div>

            {/* Old PIN */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Mật khẩu hiện tại:
              </label>
              <div className="relative">
                <input
                  type={showOldPin ? 'text' : 'password'}
                  maxLength={16}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  required
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPin(!showOldPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Mật khẩu mới:
              </label>
              <div className="relative">
                <input
                  type={showNewPin ? 'text' : 'password'}
                  maxLength={16}
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value);
                    setPinError(null);
                  }}
                  required
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin(!showNewPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Xác nhận mật khẩu mới:
              </label>
              <div className="relative">
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  maxLength={16}
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value);
                    setPinError(null);
                  }}
                  required
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pinError && (
              <p className="text-xs text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {pinError}
              </p>
            )}

            {pinSuccess && (
              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 shrink-0" /> {pinSuccess}
              </p>
            )}

            <div className="pt-2 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Đổi mật khẩu 🔐
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
