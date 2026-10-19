import React, { useState } from 'react';
import { X, Award, CheckCircle2, Lock, Star, Sparkles, Flame, Shield, ChevronRight, HelpCircle, Trophy } from 'lucide-react';
import { UnitData, UserProfile } from '../types';
import { BADGES } from '../data/unitsData';
import { RANK_TIERS, getRankTier, getNextRankTier } from '../data/ranksData';
import { soundEffects } from '../services/soundEffects';

interface BadgesModalProps {
  user: UserProfile;
  units?: UnitData[];
  onClose: () => void;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({ user, units = [], onClose }) => {
  const [activeTab, setActiveTab] = useState<'ranks' | 'badges'>('ranks');
  const totalUnitsCount = units.length > 0 ? units.length : 20;

  const currentRank = getRankTier(user.level, user.xp);
  const nextRank = getNextRankTier(user.level);

  const getBadgeProgress = (badgeId: string) => {
    const completed = user.completedUnits || {};
    if (badgeId === 'memory_champion') {
      const count = Object.values(completed).filter((u: any) => (Number(u.memoryStars) || 0) === 3).length;
      return { count, total: totalUnitsCount, label: `${count}/${totalUnitsCount} Unit (3⭐)` };
    }
    if (badgeId === 'spelling_hero') {
      const count = Object.values(completed).filter((u: any) => (Number(u.wordScrambleStars) || 0) === 3).length;
      return { count, total: totalUnitsCount, label: `${count}/${totalUnitsCount} Unit (3⭐)` };
    }
    if (badgeId === 'sentence_master') {
      const count = Object.values(completed).filter((u: any) => (Number(u.sentenceStars) || 0) === 3).length;
      return { count, total: totalUnitsCount, label: `${count}/${totalUnitsCount} Unit (3⭐)` };
    }
    if (badgeId === 'quiz_scholar') {
      const count = Object.values(completed).filter((u: any) => (Number(u.quizStars) || 0) === 3).length;
      return { count, total: totalUnitsCount, label: `${count}/${totalUnitsCount} Unit (3⭐)` };
    }
    if (badgeId === 'volume1_grad') {
      const count = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(id => {
        const u = completed[id];
        return (
          u &&
          ((u.flashcardStars || 0) > 0 ||
            (u.memoryStars || 0) > 0 ||
            (u.wordScrambleStars || 0) > 0 ||
            (u.sentenceStars || 0) > 0 ||
            (u.quizStars || 0) > 0 ||
            u.flashcardsDone)
        );
      }).length;
      return { count, total: 10, label: `${count}/10 Unit` };
    }
    if (badgeId === 'volume2_grad') {
      const count = Array.from({ length: 20 }, (_, i) => i + 1).filter(id => {
        const u = completed[id];
        return (
          u &&
          ((u.flashcardStars || 0) > 0 ||
            (u.memoryStars || 0) > 0 ||
            (u.wordScrambleStars || 0) > 0 ||
            (u.sentenceStars || 0) > 0 ||
            (u.quizStars || 0) > 0 ||
            u.flashcardsDone)
        );
      }).length;
      return { count, total: 20, label: `${count}/20 Unit` };
    }
    return null;
  };

  // Level requirements:
  // - 500 XP per level (Levels 1 to 8: 0, 500, 1000, 1500, 2000, 2500, 3000, 3500)
  // - Level 9 requires 1000 XP to reach Level 10 (4000 to 5000 XP)
  // - Level 10 is max level (5000+ XP)
  const currentTierSpan = nextRank ? (nextRank.minXp - currentRank.minXp) : 1000;
  const currentLevelXp = nextRank ? Math.max(0, user.xp - currentRank.minXp) : currentTierSpan;
  const xpPercent = nextRank ? Math.min(Math.round((currentLevelXp / currentTierSpan) * 100), 100) : 100;
  const xpToNextLevel = nextRank ? Math.max(0, nextRank.minXp - user.xp) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 sm:p-7 space-y-5 animate-float border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-xl shadow-sm">
              🏆
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-slate-800">
                Bảng thành tích
              </h2>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bảng tóm tắt chỉ số: Tổng số sao, Chuỗi học tập, Huy hiệu */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Ngôi sao */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-2.5 sm:p-3 text-center space-y-0.5 shadow-2xs">
            <div className="flex items-center justify-center">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-400 text-amber-500" />
            </div>
            <div className="font-display font-black text-lg sm:text-xl text-amber-900 leading-tight">
              {user.totalStars}
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-tight">
              Ngôi sao
            </div>
          </div>

          {/* Chuỗi học */}
          <div className="bg-orange-50 border border-orange-200/90 rounded-2xl p-2.5 sm:p-3 text-center space-y-0.5 shadow-2xs">
            <div className="flex items-center justify-center">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-orange-500 text-orange-500" />
            </div>
            <div className="font-display font-black text-lg sm:text-xl text-orange-900 leading-tight">
              {user.currentStreak} <span className="text-[11px] font-semibold text-orange-700">ngày</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-orange-700 uppercase tracking-tight">
              Chuỗi học
            </div>
          </div>

          {/* Huy hiệu */}
          <div className="bg-purple-50 border border-purple-200/90 rounded-2xl p-2.5 sm:p-3 text-center space-y-0.5 shadow-2xs">
            <div className="flex items-center justify-center">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="font-display font-black text-lg sm:text-xl text-purple-900 leading-tight">
              {user.unlockedBadges.length} <span className="text-[11px] font-semibold text-purple-600">/{BADGES.length}</span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-tight">
              Huy hiệu
            </div>
          </div>
        </div>

        {/* Level & XP Card */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-4 sm:p-5 text-white space-y-3 shadow-md shadow-purple-500/20">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-purple-200 uppercase font-bold tracking-wider">
                <span>Cấp bậc hiện tại</span>
              </div>
              <h3 className="font-display font-extrabold text-xl sm:text-2xl mt-0.5 flex items-center gap-2">
                Cấp {user.level}: {currentRank.title}
              </h3>
              <p className="text-xs text-purple-100/90 mt-1 max-w-xs leading-relaxed">
                {currentRank.description}
              </p>
            </div>
            <div className="text-right shrink-0 bg-white/10 px-3 py-2 rounded-xl backdrop-blur-xs border border-white/20">
              <span className="text-[10px] text-purple-200 uppercase font-semibold block">Tổng điểm</span>
              <span className="font-display font-black text-lg sm:text-xl text-amber-300">{user.xp} XP</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 border-t border-white/15">
            <div className="flex justify-between items-center text-xs font-semibold text-purple-100">
              <span className="text-amber-300 font-bold">
                {nextRank 
                  ? `${currentLevelXp} / ${currentTierSpan} XP (Còn ${xpToNextLevel} XP lên Cấp ${user.level + 1})` 
                  : `${user.xp} XP (Đạt cấp tối đa 10)`}
              </span>
            </div>
            <div className="w-full bg-black/25 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-amber-400 to-yellow-300 h-1.5 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tab Switcher: Bảng Cấp Bậc vs Bộ Sưu Tập Huy Hiệu */}
        <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('ranks');
            }}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'ranks'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Cấp bậc</span>
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('badges');
            }}
            className={`flex-1 py-2 sm:py-2.5 px-3 rounded-xl font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-purple-500" />
            <span>Huy hiệu</span>
          </button>
        </div>

        {/* TAB 1: DANH SÁCH CẤP BẬC VÀ QUY ĐỊNH SỐ ĐIỂM */}
        {activeTab === 'ranks' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>Danh sách cấp bậc</span>
              </h3>
              <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                10 Cấp Bậc
              </span>
            </div>

            {/* Quy tắc tính điểm XP */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs space-y-1.5 text-amber-900">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quy tắc cộng điểm XP để thăng cấp:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800/90 leading-relaxed">
                <li><strong>Thắng trò chơi mới:</strong> Nhận 50 XP cơ bản + 30 XP cho mỗi Sao đạt được (Đạt 3 sao nhận tối đa <strong>140 XP</strong>!).</li>
                <li><strong>Luyện tập lại bài cũ:</strong> Đạt đủ 3 sao nhận <strong>5 XP</strong> mỗi lần hoàn thành.</li>
                <li><strong>Quy định lên cấp:</strong> Mỗi <strong>500 XP</strong> tích lũy sẽ thăng 1 Cấp bậc mới (riêng từ Cấp 9 lên Cấp 10 cần <strong>1000 XP</strong>). Tối đa 10 Cấp Bậc!</li>
              </ul>
            </div>

            {/* Danh sách từng cấp bậc */}
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {RANK_TIERS.map((tier) => {
                const isCurrent = user.level === tier.level;
                const isPassed = user.level > tier.level;
                const isLocked = user.level < tier.level;
                const neededXpForThis = tier.minXp - user.xp;

                return (
                  <div
                    key={tier.level}
                    className={`p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-400/40 shadow-sm'
                        : isPassed
                        ? 'bg-slate-50/80 border-slate-200'
                        : 'bg-white border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-2xs mt-0.5 ${
                        isCurrent
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white'
                          : isPassed
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {tier.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-sm text-slate-800">
                            Cấp {tier.level}: {tier.title}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-600 text-white animate-pulse">
                              ★ Cấp hiện tại
                            </span>
                          )}
                        </div>

                        {/* Dòng XP quy định */}
                        <div className="mt-1">
                          <span className="inline-block text-xs font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-md border border-purple-200/50">
                            {tier.maxXp ? `${tier.minXp} - ${tier.maxXp} XP` : `${tier.minXp}+ XP`}
                          </span>
                        </div>

                        {/* Dòng mô tả xếp xuống dưới dòng XP quy định, hiển thị đầy đủ không bị dấu ... */}
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {tier.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right pt-0.5">
                      {isCurrent ? (
                        <div className="text-[11px] font-extrabold text-purple-700 bg-purple-100/80 px-2 py-1 rounded-lg border border-purple-200">
                          {nextRank ? `${currentLevelXp}/${currentTierSpan} XP` : 'Cấp tối đa'}
                        </div>
                      ) : isPassed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 block text-center">
                          +{neededXpForThis} XP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: BỘ SƯU TẬP HUY HIỆU */}
        {activeTab === 'badges' && (
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-slate-700 uppercase tracking-wider">
              Bộ sưu tập huy hiệu ({user.unlockedBadges.length} / {BADGES.length})
            </h3>

            <div className="grid grid-cols-1 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {BADGES.map((badge) => {
                const isUnlocked = user.unlockedBadges.includes(badge.id);
                const progress = getBadgeProgress(badge.id);

                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isUnlocked
                        ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                        isUnlocked ? 'bg-amber-100 border border-amber-300' : 'bg-slate-200 text-slate-400'
                      }`}>
                        {badge.icon}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                          {badge.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[11px] text-amber-700 font-semibold block">
                            Yêu cầu: {badge.reqSummary}
                          </span>
                          {progress && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              isUnlocked
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              Tiến độ: {progress.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isUnlocked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Lock className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            soundEffects.playClick();
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-display font-bold text-sm shadow-md shadow-purple-600/20 cursor-pointer transition active:scale-[0.99]"
        >
          Đóng lại
        </button>
      </div>
    </div>
  );
};
