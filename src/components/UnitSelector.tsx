import React, { useState } from 'react';
import { BookOpen, Star, Sparkles, CheckCircle2, Play, Search, Gamepad2, Trophy, Flame, X } from 'lucide-react';
import { UnitData, UserProfile } from '../types';
import { soundEffects } from '../services/soundEffects';
import { renderAvatarContent } from '../utils/avatarUtils';

interface UnitSelectorProps {
  units: UnitData[];
  user: UserProfile;
  selectedUnitId: number;
  onSelectUnit: (unit: UnitData) => void;
  onSelectGame: (unit: UnitData, gameType: 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz') => void;
  onStartChallenge?: () => void;
  onOpenAvatarModal?: () => void;
}

interface PreGamePrompt {
  unit: UnitData;
  gameType: 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz';
  gameName: string;
  currentStars: number;
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  units,
  user,
  selectedUnitId,
  onSelectUnit,
  onSelectGame,
  onStartChallenge,
  onOpenAvatarModal
}) => {
  const [activeBookTab, setActiveBookTab] = useState<'Phần 1' | 'Phần 2'>('Phần 1');
  const [searchQuery, setSearchQuery] = useState('');
  const [preGamePrompt, setPreGamePrompt] = useState<PreGamePrompt | null>(null);

  // Chương trình từ Cấp 2 (Lớp 6 - 12) hoặc danh sách <= 12 unit: hiển thị trọn vẹn toàn bộ 12 unit không chia 2 phần
  const isSecondaryOrHigher = user.grade >= 6 || units.length <= 12;

  const isPart1 = (b?: string) => b === 'Phần 1' || b === 'Tập 1';
  const isPart2 = (b?: string) => b === 'Phần 2' || b === 'Tập 2';

  const filteredUnits = units.filter(unit => {
    const matchesBook = isSecondaryOrHigher
      ? true
      : (activeBookTab === 'Phần 1' ? isPart1(unit.book) : isPart2(unit.book));

    const matchesQuery = searchQuery === '' || 
      unit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `unit ${unit.unit}`.includes(searchQuery.toLowerCase()) ||
      unit.vocabulary.some(v => v.word.toLowerCase().includes(searchQuery.toLowerCase()) || v.meaning.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesBook && matchesQuery;
  });

  const getUnitStars = (unitNumber: number): number => {
    const data = user.completedUnits?.[unitNumber] || (user.completedUnits as any)?.[String(unitNumber)];
    if (!data) return 0;
    const vocabStars = data.flashcardStars !== undefined ? Number(data.flashcardStars) : (data.flashcardsDone ? 1 : 0);
    return vocabStars + (Number(data.memoryStars) || 0) + (Number(data.wordScrambleStars) || 0) + (Number(data.sentenceStars) || 0) + (Number(data.quizStars) || 0);
  };

  const getUnitMaxStars = () => 15; // 3 stars x 5 sections (Học từ + Lật thẻ + Ghép chữ + Xếp câu + Trắc nghiệm)

  const getGameStars = (unitNumber: number, gameType: 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz'): number => {
    const data = user.completedUnits?.[unitNumber] || (user.completedUnits as any)?.[String(unitNumber)];
    if (!data) return 0;
    if (gameType === 'flashcards') return data.flashcardStars !== undefined ? Number(data.flashcardStars) : (data.flashcardsDone ? 1 : 0);
    if (gameType === 'memory') return Number(data.memoryStars || 0);
    if (gameType === 'wordScramble') return Number(data.wordScrambleStars || 0);
    if (gameType === 'sentence') return Number(data.sentenceStars || 0);
    if (gameType === 'quiz') return Number(data.quizStars || 0);
    return 0;
  };

  const GAME_NAMES: Record<string, string> = {
    flashcards: 'Học từ',
    memory: 'Lật thẻ',
    wordScramble: 'Ghép chữ',
    sentence: 'Xếp câu',
    quiz: 'Trắc nghiệm'
  };

  const handleGameSelect = (unit: UnitData, gameType: 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz') => {
    soundEffects.playClick();
    const currentStars = getGameStars(unit.unit, gameType);

    if (currentStars <= 0) {
      // Trường hợp nội dung chưa có sao nào: vào học bình thường
      onSelectGame(unit, gameType);
    } else {
      // Trường hợp đã có 1, 2 hoặc 3 sao: trước khi bắt đầu hiện thông báo
      setPreGamePrompt({
        unit,
        gameType,
        gameName: GAME_NAMES[gameType] || 'nội dung này',
        currentStars
      });
    }
  };


  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className={`relative overflow-hidden rounded-3xl p-5 sm:p-8 text-white shadow-xl ${
        isSecondaryOrHigher
          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-300/40'
          : 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 shadow-amber-200/50'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left max-w-xl">


            <div className="space-y-1.5 text-center sm:text-left">
              <h1 className="font-display font-bold text-2xl sm:text-4xl leading-tight">
                EasyEng xin chào {user.name}!
              </h1>
              <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed font-medium">
                Khám phá nội dung sách giáo khoa Tiếng Anh Global Success bằng cách vượt qua các mini-game sinh động, thu thập nhiều sao và điểm kinh nghiệm, nâng cấp bậc và đạt được các huy hiệu vinh quang!
              </p>
            </div>
          </div>

          {/* Quick Stats Widget: Hiển thị căn giữa trên điện thoại */}
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3.5 sm:p-5 flex items-center justify-center gap-5 sm:gap-6 border border-white/30 mx-auto md:mx-0 shrink-0 shadow-xs">
            <div className="text-center min-w-[75px] sm:min-w-[85px]">
              <span className="block text-2xl sm:text-3xl font-display font-bold text-white drop-shadow-xs">
                {user.totalStars}
              </span>
              <span className="text-[11px] sm:text-xs text-white/90 font-semibold uppercase tracking-wider">
                Sao Đạt Được
              </span>
            </div>
            <div className="w-px h-10 bg-white/30" />
            <div className="text-center min-w-[75px] sm:min-w-[85px]">
              <span className="block text-2xl sm:text-3xl font-display font-bold text-white drop-shadow-xs">
                {Object.keys(user.completedUnits).length} / {units.length}
              </span>
              <span className="text-[11px] sm:text-xs text-white/90 font-semibold uppercase tracking-wider">
                Unit đã học
              </span>
            </div>
          </div>
        </div>

        {/* Decorative Floating Circles */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Mega Challenge Banner: Thử Thách Toàn Diện */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-4 sm:p-5 text-white shadow-lg shadow-orange-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0 shadow-inner">
            🏆
          </div>
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg">
              Đấu trường thử thách
            </h3>
            <p className="text-xs text-white/90 mt-0.5 font-medium">
              Chinh phục 4 chặng: Từ vựng siêu tốc, Ghép chữ, Xếp câu & Trắc nghiệm tổng hợp toàn bộ bài học!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            onStartChallenge?.();
          }}
          className="px-5 py-2.5 rounded-2xl bg-white text-orange-600 hover:bg-amber-50 font-display font-bold text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Trophy className="w-4 h-4 text-amber-500" /> Bắt đầu thử thách 🚀
        </button>
      </div>

      {/* Book Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Book Tabs for Primary (Cấp 1 có 20 Unit), Cấp 2 & 3 hiển thị trọn bộ 12 Unit */}
        {!isSecondaryOrHigher ? (
          <div className="flex bg-amber-100/70 p-1.5 rounded-2xl border border-amber-200">
            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveBookTab('Phần 1');
              }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-display font-bold text-sm sm:text-base transition cursor-pointer flex items-center justify-center gap-2 ${
                activeBookTab === 'Phần 1'
                  ? 'bg-white text-slate-800 shadow-md shadow-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📘 Phần 1</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Unit 1 - 10
              </span>
            </button>

            <button
              onClick={() => {
                soundEffects.playClick();
                setActiveBookTab('Phần 2');
              }}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-display font-bold text-sm sm:text-base transition cursor-pointer flex items-center justify-center gap-2 ${
                activeBookTab === 'Phần 2'
                  ? 'bg-white text-slate-800 shadow-md shadow-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📗 Phần 2</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Unit 11 - 20
              </span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/80 border border-amber-300 text-amber-900 rounded-2xl text-xs sm:text-sm font-bold shadow-2xs">
            <BookOpen className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Trọn bộ {units.length} Unit (Chương trình Tiếng Anh Lớp {user.grade})</span>
          </div>
        )}

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên bài, từ vựng..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
          />
        </div>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
        {filteredUnits.map((unit) => {
          const stars = getUnitStars(unit.unit);
          const maxStars = getUnitMaxStars();
          const isSelected = selectedUnitId === unit.unit;
          const unitStats = user.completedUnits[unit.unit];
          const hasLearnedVocab = unitStats?.flashcardsDone;

          return (
            <div
              key={unit.unit}
              className={`group bg-white rounded-3xl border-2 transition-all duration-300 p-5 sm:p-6 shadow-sm hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 ring-4 ring-amber-100'
                  : 'border-slate-100 hover:border-amber-200'
              }`}
            >
              {/* Unit Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-amber-600 text-xs uppercase tracking-wider">
                          Unit {unit.unit}
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-lg sm:text-xl text-slate-800 leading-snug">
                        {unit.title}
                      </h2>
                    </div>
                  </div>

                  {/* Stars Badge */}
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span className="font-display font-bold text-amber-900 text-xs">
                      {stars}/{maxStars}
                    </span>
                  </div>
                </div>

                {/* Vocabulary Preview pills (Hiện đầy đủ toàn bộ từ vựng tiêu biểu) */}
                <div className="my-3 space-y-1.5">
                  <p className="text-xs text-slate-500 font-semibold">
                    Từ vựng tiêu biểu ({unit.vocabulary.length} từ):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {unit.vocabulary.map((voc, i) => (
                      <span
                        key={i}
                        className="text-xs bg-slate-100 hover:bg-amber-100 text-slate-700 px-2.5 py-1 rounded-lg transition border border-slate-200/60"
                      >
                        {voc.imageEmoji && <span className="mr-1">{voc.imageEmoji}</span>}
                        <strong className="font-semibold text-slate-800">{voc.word}</strong>: {voc.meaning}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sentence Pattern snippet */}
                {unit.sentencePatterns.length > 0 && (
                  <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-2.5 mb-4 text-xs text-sky-900">
                    <span className="font-bold text-sky-700">Mẫu câu: </span>
                    <span className="font-medium">{unit.sentencePatterns[0].pattern}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons for Games */}
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500">Chọn nội dung:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Flashcards */}
                    <button
                      onClick={() => handleGameSelect(unit, 'flashcards')}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"               
                    >
                      📖 Học từ{getGameStars(unit.unit, 'flashcards') > 0 && <span className="text-amber-700 font-extrabold ml-0.5">({getGameStars(unit.unit, 'flashcards')}⭐)</span>}
                    </button>

                    {/* Memory Match */}
                    <button
                      onClick={() => handleGameSelect(unit, 'memory')}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                    >
                      🃏 Lật thẻ{getGameStars(unit.unit, 'memory') > 0 && <span className="text-rose-700 font-extrabold ml-0.5">({getGameStars(unit.unit, 'memory')}⭐)</span>}
                    </button>

                    {/* Word Scramble */}
                    <button
                      onClick={() => handleGameSelect(unit, 'wordScramble')}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                    >
                      🧩 Ghép chữ{getGameStars(unit.unit, 'wordScramble') > 0 && <span className="text-purple-700 font-extrabold ml-0.5">({getGameStars(unit.unit, 'wordScramble')}⭐)</span>}
                    </button>

                    {/* Sentence Builder */}
                    <button
                      onClick={() => handleGameSelect(unit, 'sentence')}
                      className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                    >
                      🏰 Xếp câu{getGameStars(unit.unit, 'sentence') > 0 && <span className="text-teal-700 font-extrabold ml-0.5">({getGameStars(unit.unit, 'sentence')}⭐)</span>}
                    </button>

                    {/* Quiz */}
                    <button
                      onClick={() => handleGameSelect(unit, 'quiz')}
                      className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
                    >
                      ⚡ Trắc nghiệm{getGameStars(unit.unit, 'quiz') > 0 && <span className="text-orange-700 font-extrabold ml-0.5">({getGameStars(unit.unit, 'quiz')}⭐)</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal xác nhận trước khi vào học các nội dung đã có sao */}
      {preGamePrompt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full text-center space-y-4 shadow-2xl animate-float border border-slate-100 relative">
            {/* Close Button X */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setPreGamePrompt(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Icon & Stars */}
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs ${
                preGamePrompt.currentStars === 3
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-sky-100 text-sky-600'
              }`}>
                {preGamePrompt.currentStars === 3 ? '🎉' : '⭐'}
              </div>

              {/* Stars Representation */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {[1, 2, 3].map((starIdx) => (
                  <span
                    key={starIdx}
                    className={`text-2xl transition-all duration-300 ${
                      starIdx <= preGamePrompt.currentStars
                        ? 'scale-110 drop-shadow-xs'
                        : 'opacity-25 grayscale'
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 className="font-display font-bold text-xl text-slate-800">
                {preGamePrompt.currentStars === 3
                  ? 'Hoàn thành xuất sắc!'
                  : 'Tiếp tục luyện tập'}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed px-2">
                {preGamePrompt.currentStars === 3 ? (
                  <>
                    Bạn đã hoàn thành xuất sắc nội dung này với <strong>3/3 sao</strong>, bạn muốn học lại mà không tính sao hoặc chuyển sang nội dung khác.
                  </>
                ) : (
                  <>
                    Bạn đã hoàn thành nội dung này với <strong>{preGamePrompt.currentStars} sao / 3 sao</strong>, bạn có muốn tiếp tục để đạt <strong>3 / 3 sao</strong> không?
                  </>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {preGamePrompt.currentStars === 3 ? (
                <>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      const { unit, gameType } = preGamePrompt;
                      setPreGamePrompt(null);
                      onSelectGame(unit, gameType);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                  >
                    Học lại
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setPreGamePrompt(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95"
                  >
                    Chuyển sang nội dung khác
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setPreGamePrompt(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm transition cursor-pointer active:scale-95 order-2 sm:order-1"
                  >
                    Để sau
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      const { unit, gameType } = preGamePrompt;
                      setPreGamePrompt(null);
                      onSelectGame(unit, gameType);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95 order-1 sm:order-2"
                  >
                    Tiếp tục
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
