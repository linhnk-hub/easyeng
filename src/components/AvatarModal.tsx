import React, { useState } from 'react';
import { X, Check, Lock, KeyRound, AlertCircle, Eye, EyeOff, User } from 'lucide-react';
import { UserProfile } from '../types';
import { AVATARS } from '../data/unitsData';
import { soundEffects } from '../services/soundEffects';
import { renderAvatarContent, CustomAvatarItem } from '../utils/avatarUtils';

interface AvatarModalProps {
  user: UserProfile;
  customAvatars?: CustomAvatarItem[];
  onSave: (newName: string, newAvatar: string, newPin?: string) => void;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  user,
  customAvatars = [],
  onSave,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile state
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar);

  // Password state
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const currentActualPin = user.pin && /^\d{4}$/.test(user.pin) ? user.pin : '0000';

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    soundEffects.playSuccess();
    onSave(name.trim(), selectedAvatar);
    onClose();
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    // 1. Kiểm tra mật khẩu cũ
    if (oldPin !== currentActualPin) {
      soundEffects.playError();
      setPinError('Mật khẩu cũ không chính xác! (Mã PIN mặc định là 0000)');
      return;
    }

    // 2. Khống chế 4 chữ số
    if (!/^\d{4}$/.test(newPin)) {
      soundEffects.playError();
      setPinError('Mật khẩu mới phải gồm đúng 4 ký tự số (0-9), không chứa chữ hoặc ký tự đặc biệt!');
      return;
    }

    // 3. Kiểm tra xác nhận mật khẩu
    if (newPin !== confirmPin) {
      soundEffects.playError();
      setPinError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }

    soundEffects.playSuccess();
    onSave(name.trim(), selectedAvatar, newPin);
    setPinSuccess('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật.');
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const allAvatars = [
    ...AVATARS.map(a => ({ id: a.id, name: a.name, icon: a.icon })),
    ...customAvatars
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-5 sm:p-7 space-y-4 animate-float border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800">
                Thông tin
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

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('profile');
              setPinError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-display font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-500" />
            <span>Tên & Avatar</span>
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
            <span>Đổi mật khẩu (PIN)</span>
          </button>
        </div>

        {/* TAB 1: PROFILE & AVATAR */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-4 overflow-y-auto pr-1 flex-1">
            {/* Name input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Tên/Nickname:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                placeholder="Nhập họ tên hoặc nickname..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition text-sm"
                required
              />
            </div>

            {/* Avatar selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Ảnh đại diện/Avatar:
              </label>
              <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {allAvatars.map((av) => {
                  const isSelected = selectedAvatar === av.id || selectedAvatar === av.icon;

                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedAvatar(av.icon || av.id);
                      }}
                      className={`p-2 rounded-2xl border-2 transition-all flex items-center justify-center cursor-pointer aspect-square ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 shadow-md scale-105'
                          : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center text-3xl overflow-hidden rounded-xl">
                        {renderAvatarContent(av.icon, '🦊', customAvatars)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

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
                Mật khẩu gồm <strong>đúng 4 ký tự số</strong> (từ 0 đến 9), không dùng chữ cái hoặc ký tự đặc biệt.
              </span>
            </div>

            {/* Old PIN */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Mật khẩu cũ (4 số):
              </label>
              <div className="relative">
                <input
                  type={showOldPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Mã PIN 4 số hiện tại..."
                  required
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
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

            {/* New PIN */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Mật khẩu mới (4 số):
              </label>
              <div className="relative">
                <input
                  type={showNewPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="4 số mới..."
                  required
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
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

            {/* Confirm New PIN */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-600">
                Xác nhận mật khẩu mới:
              </label>
              <div className="relative">
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Nhập lại 4 số mới..."
                  required
                  className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white"
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

            {/* Error & Success Messages */}
            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pinError}</span>
              </div>
            )}
            {pinSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{pinSuccess}</span>
              </div>
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
                disabled={newPin.length !== 4 || confirmPin.length !== 4}
                className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                Lưu mật khẩu mới 🔐
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
