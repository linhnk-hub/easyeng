import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Lock, KeyRound, Eye, EyeOff, AlertCircle, X, Star } from 'lucide-react';
import { soundEffects } from '../services/soundEffects';
import { EasyEngLogo } from './EasyEngLogo';
import { UserProfile } from '../types';
import { renderAvatarContent } from '../utils/avatarUtils';
import { getGradeLevelName } from '../utils/gradeUtils';
import { getRankTier } from '../data/ranksData';

interface LearnerSelectScreenProps {
  learners?: UserProfile[];
  isLoading?: boolean;
  onSelectLearner: (learnerId: string) => void;
  onOpenAdminManager?: () => void;
  notificationMessage?: string | null;
  onDismissNotification?: () => void;
  customLogo?: string | null;
  welcomeLogoSize?: number;
}

export const LearnerSelectScreen: React.FC<LearnerSelectScreenProps> = ({
  learners = [],
  isLoading = false,
  onSelectLearner,
  onOpenAdminManager,
  notificationMessage,
  onDismissNotification,
  customLogo,
  welcomeLogoSize
}) => {
  const displayLearners = learners;

  // PIN Login modal state
  const [selectedLearnerForPin, setSelectedLearnerForPin] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPinText, setShowPinText] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Focus input when PIN modal opens
  useEffect(() => {
    if (selectedLearnerForPin) {
      setPinInput('');
      setPinError(null);
      setIsShaking(false);
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [selectedLearnerForPin]);

  const handleCardClick = (learner: UserProfile) => {
    soundEffects.playClick();
    setSelectedLearnerForPin(learner);
  };

  const handleClosePinModal = () => {
    soundEffects.playClick();
    setSelectedLearnerForPin(null);
    setPinInput('');
    setPinError(null);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLearnerForPin) return;

    const actualPin = selectedLearnerForPin.pin ? selectedLearnerForPin.pin.trim() : '';

    if (pinInput.length !== 4) {
      soundEffects.playError();
      setPinError('Vui lòng nhập đủ 4 chữ số PIN!');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (pinInput === actualPin) {
      soundEffects.playSuccess();
      const learnerId = selectedLearnerForPin.learnerId;
      setSelectedLearnerForPin(null);
      onSelectLearner(learnerId);
    } else {
      soundEffects.playError();
      setPinError('Mã PIN không đúng, vui lòng thử lại!');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPinInput('');
    }
  };

  // Virtual Keypad press handler
  const handleKeypadPress = (digit: string) => {
    soundEffects.playClick();
    setPinError(null);
    if (digit === 'CLEAR') {
      setPinInput('');
      return;
    }
    if (digit === 'BACKSPACE') {
      setPinInput(prev => prev.slice(0, -1));
      return;
    }
    if (pinInput.length < 4) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      if (nextPin.length === 4 && selectedLearnerForPin) {
        // Auto-verify when 4th digit entered
        setTimeout(() => {
          const actualPin = selectedLearnerForPin.pin ? selectedLearnerForPin.pin.trim() : '';
          if (nextPin === actualPin) {
            soundEffects.playSuccess();
            const learnerId = selectedLearnerForPin.learnerId;
            setSelectedLearnerForPin(null);
            onSelectLearner(learnerId);
          } else {
            soundEffects.playError();
            setPinError('Mã PIN không đúng, vui lòng thử lại!');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            setPinInput('');
          }
        }, 150);
      }
    }
  };

  return (
    <div
      className="w-full min-h-screen min-h-dvh flex flex-col justify-center items-center bg-gradient-to-br from-amber-50 via-orange-50/40 to-indigo-50/50 p-2 sm:p-4 lg:py-4 gap-2 sm:gap-3 overflow-y-auto overscroll-y-contain"
      style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
    >
      {/* Toast Notification */}
      {notificationMessage && (
        <div className="max-w-md mx-auto w-full mb-1 animate-in fade-in slide-in-from-top-4 duration-300 shrink-0">
          <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl shadow-xs text-xs font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notificationMessage}</span>
            </div>
            {onDismissNotification && (
              <button
                onClick={onDismissNotification}
                className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Brand Banner */}
      <div className="max-w-4xl mx-auto w-full text-center pt-0 shrink-0 flex flex-col items-center">
        <div className="flex items-center justify-center">
          <EasyEngLogo 
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 drop-shadow-md" 
            src={customLogo || undefined} 
            size={welcomeLogoSize}
          />
        </div>

        {/* Chào mừng - Khoảng cách thu hẹp sát logo */}
        <div className="mt-1 sm:mt-1.5">
          <div className="inline-flex items-center gap-1.5 bg-amber-100/90 border border-amber-300 text-amber-900 px-4 py-1 rounded-full text-[11px] sm:text-xs font-bold shadow-2xs">
            <span>✨ Xin chào bạn, chọn tên để bắt đầu nhé! ✨</span>
          </div>
        </div>
      </div>

      {/* Dynamic Learner Cards Grid: On iPad (md), display vertically (grid-cols-1); on Desktop (lg), display horizontally (lg:grid-cols-3) */}
      <div className="flex-initial flex flex-col justify-center my-1 sm:my-2 w-full">
        {isLoading && displayLearners.length === 0 ? (
          <div className="mx-auto w-full max-w-md py-8 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200 p-6 shadow-sm">
            <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-700 font-bold text-sm">Đang tải danh sách người học từ cơ sở dữ liệu...</p>
          </div>
        ) : !isLoading && displayLearners.length === 0 ? (
          <div className="mx-auto w-full max-w-md py-8 text-center bg-white/80 backdrop-blur-md rounded-2xl border border-amber-200 p-6 shadow-sm space-y-2">
            <p className="text-slate-700 font-bold text-sm">Chưa có người học nào trong cơ sở dữ liệu.</p>
            <p className="text-slate-500 text-xs">
              Bấm vào chữ <span className="font-semibold text-slate-700">LinhNK</span> ở chân trang để mở phần Quản lý và thêm người học mới.
            </p>
          </div>
        ) : (
          <div className={`mx-auto w-full grid gap-3 sm:gap-4 ${
            displayLearners.length <= 1
              ? 'grid-cols-1 max-w-sm'
              : displayLearners.length === 2
              ? 'grid-cols-1 md:grid-cols-1 lg:grid-cols-2 max-w-md lg:max-w-3xl'
              : displayLearners.length === 3
              ? 'grid-cols-1 md:grid-cols-1 lg:grid-cols-3 max-w-md lg:max-w-5xl'
              : 'grid-cols-1 md:grid-cols-1 lg:grid-cols-4 max-w-md lg:max-w-6xl'
          }`}>
            {displayLearners.map((learner) => {
              const isLop4 = learner.grade === 4;
              const isLop7 = learner.grade === 7;

              const borderClass = isLop4
                ? 'border-amber-300 hover:border-amber-500 hover:shadow-amber-500/20'
                : isLop7
                ? 'border-indigo-300 hover:border-indigo-500 hover:shadow-indigo-500/20'
                : 'border-emerald-300 hover:border-emerald-500 hover:shadow-emerald-500/20';

              const badgeBg = isLop4
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : isLop7
                ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                : 'bg-emerald-100 text-emerald-800 border-emerald-300';

              const btnGradient = isLop4
                ? 'from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600 shadow-amber-500/25'
                : isLop7
                ? 'from-indigo-600 to-purple-600 group-hover:from-indigo-700 group-hover:to-purple-700 shadow-indigo-600/25'
                : 'from-emerald-500 to-teal-600 group-hover:from-emerald-600 group-hover:to-teal-700 shadow-emerald-500/25';

              const avatarGradient = isLop4
                ? 'from-amber-300 to-orange-400 shadow-amber-400/30'
                : isLop7
                ? 'from-indigo-400 via-purple-400 to-pink-400 shadow-indigo-400/30'
                : 'from-emerald-300 to-teal-400 shadow-emerald-400/30';

              const hasPin = Boolean(learner.pin && /^\d{4}$/.test(learner.pin));

              return (
                <div
                  key={learner.learnerId}
                  onClick={() => handleCardClick(learner)}
                  className={`group relative bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 border-2 sm:border-3 ${borderClass} shadow-md shadow-slate-900/5 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between transform hover:-translate-y-1 active:scale-98`}
                >
                  <div className="space-y-2">
                    {/* Avatar */}
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 mx-auto rounded-2xl bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-3xl sm:text-4xl shadow-sm group-hover:scale-105 group-hover:rotate-2 transition-transform overflow-hidden border-2 border-white/80`}>
                      {renderAvatarContent(learner.avatar, isLop7 ? '🦄' : '🦊')}
                    </div>

                    {/* Tên tài khoản và chữ Lớp nằm ngay bên dưới tên tài khoản */}
                    <div className="text-center space-y-1">
                      <h2 className="font-display font-bold text-lg sm:text-xl md:text-2xl text-slate-800 leading-snug">
                        {learner.name}
                      </h2>
                      <div>
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-0.5 rounded-full border ${badgeBg}`}>
                          🎓 Lớp {learner.grade}
                        </span>
                      </div>
                    </div>

                    {/* Bảng thành tích học tập chi tiết của tài khoản */}
                    <div className="bg-slate-50/90 rounded-xl p-2 sm:p-2.5 border border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                        Thành tích
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="bg-white rounded-lg px-2 py-1 border border-slate-150 flex items-center justify-between shadow-2xs">
                          <span className="text-slate-500 font-medium">⭐ Tổng sao:</span>
                          <span className="font-extrabold text-amber-600">{learner.totalStars || 0}</span>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1 border border-slate-150 flex items-center justify-between shadow-2xs">
                          <span className="text-slate-500 font-medium">🏆 Cấp độ:</span>
                          <span className="font-extrabold text-indigo-600 flex items-center gap-1" title={getRankTier(learner.level || 1, learner.xp || 0).title}>
                            <span>Lv.{learner.level || 1}</span>
                            <span>{getRankTier(learner.level || 1, learner.xp || 0).icon}</span>
                          </span>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1 border border-slate-150 flex items-center justify-between shadow-2xs">
                          <span className="text-slate-500 font-medium">🎖️ Huy hiệu:</span>
                          <span className="font-extrabold text-purple-600">{(learner.unlockedBadges || []).length}</span>
                        </div>
                        <div className="bg-white rounded-lg px-2 py-1 border border-slate-150 flex items-center justify-between shadow-2xs">
                          <span className="text-slate-500 font-medium">🔥 Chuỗi ngày:</span>
                          <span className="font-extrabold text-orange-600">{learner.currentStreak || 0} ngày</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3">
                    <button className={`w-full py-2 sm:py-2.5 px-4 rounded-xl bg-gradient-to-r ${btnGradient} text-white font-display font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer`}>
                      <span>Vào học cùng {learner.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Click chữ LinhNK để vào trang Quản lý - giữ nguyên hiển thị và con trỏ chuột khi hover */}
      <footer className="text-center py-2 text-xs font-semibold text-slate-500 shrink-0 select-none">
        © 2026{' '}
        <span
          onClick={onOpenAdminManager}
          className="cursor-default"
        >
          LinhNK
        </span>
      </footer>

      {/* ========================================================================= */}
      {/* 4-DIGIT PIN LOGIN MODAL (Strictly 4 digits 0-9, no letters or special chars) */}
      {/* ========================================================================= */}
      {selectedLearnerForPin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className={`bg-white rounded-3xl max-w-sm w-full shadow-2xl p-5 sm:p-6 space-y-4 border border-slate-100 transition-all ${
            isShaking ? 'animate-bounce' : ''
          }`}>
            {/* Header with learner avatar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl overflow-hidden shrink-0 shadow-xs">
                  {renderAvatarContent(selectedLearnerForPin.avatar)}
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-800 leading-tight">
                    {selectedLearnerForPin.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Lớp {selectedLearnerForPin.grade}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePinModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & prompt */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Nhập mã PIN 4 số của bạn</span>
              </div>
            </div>

            {/* Hidden Input for direct physical typing */}
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <input
                ref={pinInputRef}
                type={showPinText ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinInput(cleaned);
                  setPinError(null);
                  if (cleaned.length === 4) {
                    setTimeout(() => {
                      const actualPin = selectedLearnerForPin.pin ? selectedLearnerForPin.pin.trim() : '';
                      if (cleaned === actualPin) {
                        soundEffects.playSuccess();
                        const learnerId = selectedLearnerForPin.learnerId;
                        setSelectedLearnerForPin(null);
                        onSelectLearner(learnerId);
                      } else {
                        soundEffects.playError();
                        setPinError('Mã PIN không đúng, vui lòng thử lại!');
                        setIsShaking(true);
                        setTimeout(() => setIsShaking(false), 500);
                        setPinInput('');
                      }
                    }, 120);
                  }
                }}
                className="sr-only"
                autoComplete="off"
              />

              {/* Visual 4-Digit Display Boxes */}
              <div
                onClick={() => pinInputRef.current?.focus()}
                className="flex items-center justify-center gap-3 cursor-pointer py-1"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const digit = pinInput[idx];
                  const isFilled = digit !== undefined;
                  const isCurrent = pinInput.length === idx;

                  return (
                    <div
                      key={idx}
                      className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-display font-black transition-all ${
                        isCurrent
                          ? 'border-amber-500 ring-4 ring-amber-200 bg-amber-50/50 scale-105'
                          : isFilled
                          ? 'border-amber-400 bg-white text-slate-800 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-300'
                      }`}
                    >
                      {isFilled ? (showPinText ? digit : '●') : ''}
                    </div>
                  );
                })}
              </div>

              {/* Toggle Show/Hide PIN */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowPinText(!showPinText)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer py-0.5"
                >
                  {showPinText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPinText ? 'Ẩn mã PIN' : 'Hiện mã PIN'}</span>
                </button>
              </div>

              {/* Error Notice */}
              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{pinError}</span>
                </div>
              )}

              {/* Virtual Touch Keypad for Phones & Tablets */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="py-3 rounded-2xl bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 font-display font-bold text-lg shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleKeypadPress('CLEAR')}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer"
                >
                  Xóa hết
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 font-display font-bold text-lg shadow-xs transition active:scale-95 cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('BACKSPACE')}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-base transition active:scale-95 cursor-pointer"
                  title="Xóa 1 số"
                >
                  ⌫
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
