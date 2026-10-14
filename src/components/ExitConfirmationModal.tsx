import React from 'react';
import { Save, LogOut, BookOpen, Star, Flame, Award } from 'lucide-react';
import { UserProfile } from '../types';
import { renderAvatarContent } from '../utils/avatarUtils';
import { soundEffects } from '../services/soundEffects';

interface ExitConfirmationModalProps {
  isOpen: boolean;
  user: UserProfile;
  onSaveAndExit: () => void;
  onCancel: () => void;
}

export const ExitConfirmationModal: React.FC<ExitConfirmationModalProps> = ({
  isOpen,
  user,
  onSaveAndExit,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isTy = user.learnerId === 'ty';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden transform animate-scaleUp text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white text-center relative overflow-hidden">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-3xl shadow-inner">
            {renderAvatarContent(user.avatar, isTy ? '🦊' : '🦄')}
          </div>
          <h2 className="font-display font-bold text-2xl text-white">
            Xác nhận 
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Stats Summary Grid */}
          <div className="grid grid-cols-3 gap-2.5 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-amber-600 font-bold text-base">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                <span>{user.totalStars}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Sao đạt được</span>
            </div>

            <div className="flex flex-col items-center border-x border-amber-200/60">
              <div className="flex items-center gap-1 text-orange-600 font-bold text-base">
                <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
                <span>{user.currentStreak}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Chuỗi ngày</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-purple-600 font-bold text-base">
                <Award className="w-4 h-4 text-purple-500" />
                <span>{user.unlockedBadges.length}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Huy hiệu</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* Primary: Save & Exit */}
            <button
              onClick={() => {
                soundEffects.playSuccess();
                onSaveAndExit();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white font-display font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Thoát</span>
            </button>

            {/* Secondary: Continue learning */}
            <button
              onClick={() => {
                soundEffects.playClick();
                onCancel();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition border border-slate-200"
            >
              <BookOpen className="w-4 h-4 text-slate-600" />
              <span>Tiếp tục</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
