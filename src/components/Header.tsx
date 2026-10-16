import React from 'react';
import { Flame, Star, Award, Settings, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
import { AVATARS } from '../data/unitsData';
import { soundEffects } from '../services/soundEffects';
import { VoiceGender } from '../services/speechService';
import { EasyEngLogo } from './EasyEngLogo';

import { renderAvatarContent } from '../utils/avatarUtils';

interface HeaderProps {
  user: UserProfile;
  soundOn?: boolean;
  bgmOn?: boolean;
  voiceGender?: VoiceGender;
  onToggleSound?: () => void;
  onToggleBgm?: () => void;
  onToggleVoiceGender?: () => void;
  onOpenBadges: () => void;
  onOpenAdminManager: () => void;
  onOpenAvatarModal: () => void;
  onGoHome: () => void;
  onSwitchLearner?: () => void;
  onExitLearner?: () => void;
  currentUnitTitle?: string;
  customLogo?: string | null;
  headerLogoSize?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  bgmOn,
  onToggleBgm,
  onOpenBadges,
  onOpenAdminManager,
  onOpenAvatarModal,
  onGoHome,
  onSwitchLearner,
  onExitLearner,
  currentUnitTitle,
  customLogo,
  headerLogoSize
}) => {
  const isTy = user.learnerId === 'ty';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 min-h-14 sm:min-h-16 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={() => {
              soundEffects.playClick();
              onGoHome();
            }}
            className="flex items-center gap-2.5 sm:gap-3 text-left group transition transform active:scale-95 cursor-pointer max-w-[48vw] sm:max-w-none"
            title="EasyEng"
          >
            {/* Logo */}
            <EasyEngLogo 
              className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-xs" 
              src={customLogo || undefined} 
              size={headerLogoSize}
              style={{ maxHeight: '72px' }}
            />
          </button>
        </div>

        {/* Center: Mobile Achievement Button vs Desktop 3 Pills */}
        {/* Mobile: Chỉ hiển thị icon huy hiệu */}
        <button
          onClick={() => {
            soundEffects.playClick();
            onOpenBadges();
          }}
          className="sm:hidden h-9 w-9 flex items-center justify-center bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl shadow-xs transition active:scale-95 cursor-pointer text-purple-700 shrink-0"
          title="Thành tích: Xem bảng sao, chuỗi học và huy hiệu"
        >
          <Award className="w-4.5 h-4.5 text-purple-600" />
        </button>

        {/* Desktop / Tablet (sm trở lên): Hiển thị đầy đủ 3 mục */}
        <div className="hidden sm:flex items-center gap-1.5 sm:gap-2.5">
          {/* Stars */}
          <div className="h-9 sm:h-10 flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 sm:px-3 rounded-2xl shadow-xs shrink-0">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-500 animate-pulse" />
            <span className="font-display font-bold text-amber-900 text-xs sm:text-sm">
              {user.totalStars}
            </span>
            <span className="text-xs text-amber-700/80 hidden xs:inline">sao</span>
          </div>

          {/* Streak */}
          <div className="h-9 sm:h-10 flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2.5 sm:px-3 rounded-2xl shadow-xs shrink-0" title="Chuỗi học tập liên tục">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500 text-orange-500" />
            <span className="font-display font-bold text-orange-900 text-xs sm:text-sm">
              {user.currentStreak}
            </span>
            <span className="text-xs text-orange-700/80 hidden xs:inline">ngày</span>
          </div>

          {/* Badges */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenBadges();
            }}
            className="h-9 sm:h-10 flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 sm:px-3 rounded-2xl transition cursor-pointer text-purple-700 active:scale-95 shadow-xs shrink-0"
            title="Bảng thành tích"
          >
            <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-600" />
            <span className="text-xs font-bold hidden sm:inline">Huy hiệu</span>
            <span className="text-xs bg-purple-200 text-purple-800 font-bold px-1.5 py-0.2 rounded-full">
              {user.unlockedBadges.length}
            </span>
          </button>
        </div>

        {/* Controls: Profile & Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Cài đặt Logo & Quản lý ngay kế bên tài khoản & avatar */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenAdminManager();
            }}
            className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 hover:text-amber-900 border border-amber-200 hover:border-amber-400 transition cursor-pointer active:scale-95 shadow-xs shrink-0"
            title="Cài đặt Logo & Quản lý hệ thống"
          >
            <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-700" />
          </button>

          {/* Avatar Profile */}
          <button
            onClick={() => {
              soundEffects.playClick();
              onOpenAvatarModal();
            }}
            className="h-9 w-9 sm:h-10 sm:w-10 md:w-auto flex items-center justify-center md:justify-start gap-2 p-0 md:pl-1 md:pr-3 rounded-2xl bg-amber-100/80 hover:bg-amber-200/80 border border-amber-300 transition cursor-pointer active:scale-95 shadow-xs shrink-0"
            title={`Xem thông tin tài khoản: ${user.name}`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-lg sm:text-xl overflow-hidden rounded-xl bg-white/70">
              {renderAvatarContent(user.avatar, isTy ? '🦊' : '🦄')}
            </div>
            <div className="text-left hidden md:block leading-none pr-1">
              <span className="block text-xs font-bold text-amber-900 truncate max-w-[80px]">
                {user.name}
              </span>
              <span className="block text-[10px] text-amber-700 mt-0.5">
                Lv.{user.level}
              </span>
            </div>
          </button>

          {/* Exit / Switch Learner Screen Button */}
          {onExitLearner && (
            <button
              onClick={() => {
                soundEffects.playClick();
                onExitLearner();
              }}
              className="h-9 w-9 sm:h-10 sm:w-auto px-0 sm:px-2.5 flex items-center justify-center gap-1 rounded-2xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition cursor-pointer active:scale-95 shadow-xs shrink-0"
              title="Thoát"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
