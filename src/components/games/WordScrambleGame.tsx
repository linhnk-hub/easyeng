import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Volume2, Snail, HelpCircle, Star, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UnitData, VocabularyItem } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/soundEffects';

interface WordScrambleGameProps {
  unit: UnitData;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

interface LetterSlot {
  index: number;
  expectedChar: string;
  isSpace: boolean;
  placed: {
    id: string;
    char: string;
    isHint: boolean;
  } | null;
}

export const WordScrambleGame: React.FC<WordScrambleGameProps> = ({
  unit,
  onComplete,
  onBack
}) => {
  const [wordList, setWordList] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState<{ id: string; char: string; isUsed: boolean }[]>([]);
  const [slots, setSlots] = useState<LetterSlot[]>([]);
  const [streak, setStreak] = useState(0);
  const [errorsThisWord, setErrorsThisWord] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [isWordCorrect, setIsWordCorrect] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Gợi ý: Mỗi từ chỉ tối đa 2 lần ở vị trí random trong chữ (không tính khoảng trống)
  // Nếu đã dùng gợi ý trong ván chơi, tối đa đạt 2 sao (không đạt tối đa 3 sao)
  const [hintsUsedThisWord, setHintsUsedThisWord] = useState(0);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showMaxHintAlert, setShowMaxHintAlert] = useState(false);

  // Khởi tạo danh sách 10 từ khi vào Unit
  useEffect(() => {
    const baseVocab = [...unit.vocabulary];
    let selected: VocabularyItem[] = [];
    if (baseVocab.length > 0) {
      const shuffled = [...baseVocab].sort(() => Math.random() - 0.5);
      selected = [...shuffled];
      while (selected.length < 10) {
        const extra = [...baseVocab].sort(() => Math.random() - 0.5);
        selected = selected.concat(extra);
      }
      selected = selected.slice(0, 10);
    }
    setWordList(selected);
    setCurrentIndex(0);
    setStreak(0);
    setTotalErrors(0);
    setHasUsedHint(false);
    setGameWon(false);
  }, [unit]);

  const currentWordObj = wordList[currentIndex];

  // Chuẩn bị ô chữ và khay chữ cái khi chuyển từ
  useEffect(() => {
    if (!currentWordObj) return;

    const rawWord = currentWordObj.word.toUpperCase();

    // 1. Khởi tạo danh sách ô chữ (xử lý riêng khoảng trống và ký tự)
    const newSlots: LetterSlot[] = rawWord.split('').map((char, index) => ({
      index,
      expectedChar: char,
      isSpace: char === ' ',
      placed: null
    }));
    setSlots(newSlots);

    // 2. Khay xáo trộn chỉ chứa các chữ cái thực sự (không bao gồm khoảng trống)
    const nonSpaceLetters = rawWord
      .split('')
      .map((char, index) => ({ char, index }))
      .filter(item => item.char !== ' ')
      .map(item => ({
        id: `${item.char}-${item.index}-${Math.random()}`,
        char: item.char,
        isUsed: false
      }));

    let shuffled = [...nonSpaceLetters].sort(() => Math.random() - 0.5);
    const nonSpaceOriginal = nonSpaceLetters.map(l => l.char).join('');
    if (nonSpaceLetters.length > 2 && shuffled.map(l => l.char).join('') === nonSpaceOriginal) {
      shuffled = shuffled.reverse();
    }

    setScrambledLetters(shuffled);
    setErrorsThisWord(0);
    setIsWordCorrect(false);
    setHintsUsedThisWord(0);

    // Đọc phát âm chuẩn từ khóa
    speechService.speakNormal(currentWordObj.word);
  }, [currentIndex, currentWordObj]);

  // Kiểm tra hoàn thành từ
  const checkWordCompletion = (currentSlots: LetterSlot[]) => {
    if (!currentWordObj) return;
    const rawWord = currentWordObj.word.toUpperCase();
    const isAllCorrect = currentSlots.every(
      (s, idx) => s.isSpace || s.placed?.char === rawWord[idx]
    );

    if (isAllCorrect) {
      soundEffects.playSuccess();
      setIsWordCorrect(true);
      const newStreak = streak + 1;
      setStreak(newStreak);
      soundEffects.playStreak(newStreak);
      speechService.speakNormal(currentWordObj.word);

      setTimeout(() => {
        if (currentIndex < wordList.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          handleVictory();
        }
      }, 1200);
    } else {
      soundEffects.playError();
      setStreak(0);
      setErrorsThisWord(e => e + 1);
      setTotalErrors(e => e + 1);
    }
  };

  // Chọn chữ cái từ khay ghép vào ô trống đầu tiên (bỏ qua khoảng trống)
  const handlePickLetter = (tile: { id: string; char: string; isUsed: boolean }) => {
    if (isWordCorrect || tile.isUsed) return;
    soundEffects.playClick();

    // Tìm ô đầu tiên chưa điền (và không phải khoảng trống)
    const targetSlotIndex = slots.findIndex(s => !s.isSpace && s.placed === null);
    if (targetSlotIndex === -1) return;

    const updatedSlots = slots.map((s, idx) => {
      if (idx === targetSlotIndex) {
        return {
          ...s,
          placed: {
            id: tile.id,
            char: tile.char,
            isHint: false
          }
        };
      }
      return s;
    });

    setSlots(updatedSlots);
    setScrambledLetters(prev =>
      prev.map(t => (t.id === tile.id ? { ...t, isUsed: true } : t))
    );

    // Nếu đã điền đủ tất cả các ô chữ
    const allFilled = updatedSlots.every(s => s.isSpace || s.placed !== null);
    if (allFilled) {
      checkWordCompletion(updatedSlots);
    }
  };

  // Gỡ chữ cái đã đặt (không cho gỡ chữ đã được gợi ý)
  const handleRemoveLetter = (index: number) => {
    if (isWordCorrect) return;
    const slot = slots[index];
    if (!slot || slot.isSpace || !slot.placed) return;

    if (slot.placed.isHint) {
      soundEffects.playClick();
      return;
    }

    soundEffects.playClick();
    const removedId = slot.placed.id;
    setSlots(prev => prev.map((s, idx) => (idx === index ? { ...s, placed: null } : s)));
    setScrambledLetters(prev =>
      prev.map(t => (t.id === removedId ? { ...t, isUsed: false } : t))
    );
  };

  // Xếp lại từ đầu: chỉ gỡ các chữ do người học tự đặt, giữ nguyên chữ đã gợi ý
  const handleResetLetters = () => {
    if (isWordCorrect) return;
    soundEffects.playClick();
    const removedIds: string[] = [];
    const updatedSlots = slots.map(s => {
      if (!s.isSpace && s.placed && !s.placed.isHint) {
        removedIds.push(s.placed.id);
        return { ...s, placed: null };
      }
      return s;
    });
    setSlots(updatedSlots);
    setScrambledLetters(prev =>
      prev.map(t => (removedIds.includes(t.id) ? { ...t, isUsed: false } : t))
    );
  };

  // Bấm nút gợi ý -> Kiểm tra giới hạn 2 lần và bật thông báo
  const handleHintButtonClick = () => {
    if (isWordCorrect || !currentWordObj) return;
    soundEffects.playClick();

    if (hintsUsedThisWord >= 2) {
      setShowMaxHintAlert(true);
      return;
    }

    setShowHintModal(true);
  };

  // Thực hiện gợi ý sau khi người dùng xác nhận thông báo
  const confirmApplyHint = () => {
    setShowHintModal(false);
    if (isWordCorrect || !currentWordObj || hintsUsedThisWord >= 2) return;

    // 1. Tìm các vị trí ngẫu nhiên hợp lệ trong chữ:
    // - Không bao gồm khoảng trống
    // - Chưa được gợi ý trước đó
    // - Ô đang trống hoặc người học đặt sai chữ
    let candidateIndices = slots
      .map((s, idx) => idx)
      .filter(idx => {
        const s = slots[idx];
        if (s.isSpace) return false;
        if (s.placed?.isHint) return false;
        return s.placed === null || s.placed.char !== s.expectedChar;
      });

    // Nếu mọi ô còn lại người học đã vô tình đặt đúng ký tự, lấy bất kỳ ô chưa ghim gợi ý
    if (candidateIndices.length === 0) {
      candidateIndices = slots
        .map((s, idx) => idx)
        .filter(idx => !slots[idx].isSpace && !slots[idx].placed?.isHint);
    }

    if (candidateIndices.length === 0) return;

    // 2. Chọn ngẫu nhiên 1 vị trí trong danh sách hợp lệ
    const randomIdx = candidateIndices[Math.floor(Math.random() * candidateIndices.length)];
    const chosenSlot = slots[randomIdx];
    const targetChar = chosenSlot.expectedChar;

    const previousPlacedId = chosenSlot.placed && !chosenSlot.placed.isHint ? chosenSlot.placed.id : null;

    // 3. Tìm thẻ chữ tương ứng trong khay xáo trộn
    let tileToUse = scrambledLetters.find(t => !t.isUsed && t.char === targetChar);
    let pulledFromSlotIdx: number | null = null;

    if (!tileToUse) {
      // Nếu chữ đó đang nằm ở ô khác do người học tự xếp sai, lấy lại từ ô đó
      const otherSlot = slots.find(
        (s, sIdx) =>
          sIdx !== randomIdx &&
          s.placed &&
          !s.placed.isHint &&
          s.placed.char === targetChar
      );
      if (otherSlot && otherSlot.placed) {
        tileToUse = { id: otherSlot.placed.id, char: otherSlot.placed.char, isUsed: true };
        pulledFromSlotIdx = otherSlot.index;
      }
    }

    const tileId = tileToUse ? tileToUse.id : `hint-${targetChar}-${randomIdx}-${Math.random()}`;

    // 4. Cập nhật ô được gợi ý
    const updatedSlots = slots.map((s, idx) => {
      if (idx === randomIdx) {
        return {
          ...s,
          placed: {
            id: tileId,
            char: targetChar,
            isHint: true
          }
        };
      }
      if (pulledFromSlotIdx !== null && idx === pulledFromSlotIdx) {
        return { ...s, placed: null };
      }
      return s;
    });

    setSlots(updatedSlots);
    setScrambledLetters(prev =>
      prev.map(t => {
        if (t.id === tileId) return { ...t, isUsed: true };
        if (previousPlacedId && t.id === previousPlacedId) return { ...t, isUsed: false };
        return t;
      })
    );

    // Ghi nhận gợi ý: tăng số lần dùng cho từ này và đánh dấu toàn ván
    setHintsUsedThisWord(prev => prev + 1);
    setHasUsedHint(true);
    soundEffects.playSuccess();

    // 5. Kiểm tra nếu điền xong cả từ
    const allFilled = updatedSlots.every(s => s.isSpace || s.placed !== null);
    if (allFilled) {
      checkWordCompletion(updatedSlots);
    }
  };

  const handleVictory = () => {
    soundEffects.playVictory();
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 }
    });
    setGameWon(true);
  };

  // Tính số sao: Nếu sử dụng gợi ý sẽ không đạt tối đa 3 sao (tối đa 2 sao)
  const calculateStars = () => {
    if (hasUsedHint) {
      if (totalErrors <= 6) return 2;
      return 1;
    }
    if (totalErrors <= 2) return 3;
    if (totalErrors <= 6) return 2;
    return 1;
  };

  if (!currentWordObj) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">
            Unit {unit.unit} • {unit.title}
          </span>
          <span className="font-display font-bold text-slate-800 text-base sm:text-lg">
            🧩 Ghép từ
          </span>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">
            Từ số {currentIndex + 1} / {wordList.length}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl">
          <Zap className="w-4 h-4 fill-orange-400 text-orange-500" />
          <span className="font-display font-bold text-orange-900 text-xs">
            x{streak}
          </span>
        </div>
      </div>

      {/* Word Clue Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-200 shadow-lg shadow-purple-900/5 text-center space-y-4">
        {currentWordObj.imageEmoji && (
          <div className="text-5xl sm:text-6xl animate-bounce">
            {currentWordObj.imageEmoji}
          </div>
        )}

        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Nghĩa tiếng Việt
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-purple-700">
            {currentWordObj.meaning}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {currentWordObj.phonetic}
          </p>
        </div>

        {/* Audio Clue buttons: Nghe chuẩn + Nghe chậm */}
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              soundEffects.playClick();
              speechService.speakNormal(currentWordObj.word);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-2xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Nghe phát âm chuẩn tốc độ bình thường"
          >
            <Volume2 className="w-4 h-4" /> Nghe chuẩn
          </button>
          <button
            onClick={() => {
              soundEffects.playClick();
              speechService.speakSlowly(currentWordObj.word);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-2xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer shadow-xs"
            title="Nghe phát âm chậm để nhận diện từng âm tiết"
          >
            <Snail className="w-4 h-4 text-teal-600" /> Nghe chậm
          </button>
        </div>

        {/* Target Letter Slots */}
        <div className="pt-4">
          <div className="flex flex-wrap items-center justify-center gap-2 min-h-[56px]">
            {slots.map((slot, index) => {
              if (slot.isSpace) {
                return (
                  <div
                    key={`space-${index}`}
                    className="w-4 sm:w-6 h-12 sm:h-14 flex items-center justify-center"
                    title="Khoảng trống cách từ"
                  >
                    <span className="w-2.5 h-1 bg-slate-300 rounded-full" />
                  </div>
                );
              }

              const placed = slot.placed;
              const isCorrectTarget = isWordCorrect;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => placed && handleRemoveLetter(index)}
                  disabled={placed?.isHint || isWordCorrect}
                  className={`relative w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-display font-bold text-xl sm:text-2xl flex items-center justify-center transition-all ${
                    isCorrectTarget
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105'
                      : placed?.isHint
                      ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-white border-2 border-amber-300 shadow-md shadow-amber-500/20 cursor-default'
                      : placed
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 cursor-pointer hover:bg-purple-700 active:scale-95'
                      : 'bg-slate-100 border-2 border-dashed border-slate-300 text-transparent'
                  }`}
                  title={placed?.isHint ? 'Chữ gợi ý (cố định)' : placed ? 'Bấm để gỡ chữ này' : ''}
                >
                  {placed ? placed.char : ''}
                  {placed?.isHint && (
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-white text-amber-600 text-[11px] font-black flex items-center justify-center shadow-xs border border-amber-300">
                      💡
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Bấm vào chữ đã đặt để gỡ (chữ có biểu tượng 💡 là chữ được gợi ý cố định)
          </p>
        </div>

        {/* Scrambled Letter Tray */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {scrambledLetters.map(item => (
              <button
                key={item.id}
                onClick={() => !item.isUsed && handlePickLetter(item)}
                disabled={item.isUsed || isWordCorrect}
                className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-display font-bold text-xl sm:text-2xl transition-all ${
                  item.isUsed
                    ? 'opacity-20 cursor-not-allowed bg-slate-200 text-slate-400'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer'
                }`}
              >
                {item.char}
              </button>
            ))}
          </div>
        </div>

        {/* Helpers: Hint & Reset */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleHintButtonClick}
            disabled={isWordCorrect}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-40 ${
              hintsUsedThisWord >= 2
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
            }`}
            title={
              hintsUsedThisWord >= 2
                ? 'Đã dùng hết 2 lượt gợi ý cho từ này'
                : 'Gợi ý chữ cái ngẫu nhiên (tối đa 2 lần/từ)'
            }
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Gợi ý ({2 - hintsUsedThisWord}/2 lượt)</span>
          </button>

          <button
            onClick={handleResetLetters}
            disabled={isWordCorrect || slots.every(s => s.placed === null || s.placed?.isHint)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Xếp lại từ đầu
          </button>
        </div>
      </div>

      {/* Modal Thông Báo Khi Bấm Nút Gợi Ý */}
      {showHintModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border-2 border-amber-300 space-y-4 animate-float text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-inner">
              💡
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-xl text-slate-800">
                Sử dụng gợi ý chữ cái?
              </h3>
              <p className="text-xs text-slate-500">
                Quy định sử dụng trợ giúp ghép từ:
              </p>
            </div>

            <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200 text-left space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-900">
                <span className="font-bold text-amber-600 shrink-0">1.</span>
                <span>
                  Mỗi từ chỉ cho phép gợi ý tối đa <strong>2 lần</strong> ở <strong>2 vị trí ngẫu nhiên</strong> trong chữ (không bao gồm khoảng trống).
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-900">
                <span className="font-bold text-amber-600 shrink-0">2.</span>
                <span>
                  Từ hiện tại: đã dùng <strong>{hintsUsedThisWord}/2</strong> lần gợi ý.
                </span>
              </div>
              <div className="flex items-start gap-2 text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-semibold leading-relaxed">
                <span className="shrink-0 text-base">⚠️</span>
                <span>
                  <strong>Chú ý:</strong> Nếu sử dụng gợi ý, bạn sẽ <strong>không thể đạt tối đa 3 sao</strong> cho bài học này (chỉ đạt tối đa 2 sao) và sẽ chưa đạt chuẩn huy hiệu <strong>Dũng Sĩ Ghép Từ</strong>!
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setShowHintModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer transition active:scale-95"
              >
                Tự suy nghĩ tiếp
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  confirmApplyHint();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Đồng ý nhận gợi ý</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cảnh Báo Khi Đã Hết Lượt Gợi Ý (2 lần) */}
      {showMaxHintAlert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-slate-200 space-y-4 text-center animate-float">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 mx-auto flex items-center justify-center text-2xl">
              🛑
            </div>
            <h3 className="font-display font-bold text-lg text-slate-800">
              Đã hết lượt gợi ý!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mỗi từ chỉ cho phép gợi ý tối đa <strong>2 lần</strong> ở 2 vị trí ngẫu nhiên trong chữ. Bạn đã dùng đủ 2 lượt cho từ này rồi, hãy thử tự mình hoàn thành các chữ còn lại nhé!
            </p>
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                setShowMaxHintAlert(false);
              }}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer transition active:scale-95"
            >
              Đã hiểu, tôi sẽ tự ghép
            </button>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {gameWon && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-float">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 mx-auto flex items-center justify-center text-3xl">
              🏹
            </div>
            <h3 className="font-display font-bold text-2xl text-slate-800">
              Chiến binh ghép từ hoàn hảo!
            </h3>
            <p className="text-slate-600 text-sm">
              Bạn đã đánh vần và ghép chính xác tất cả các từ trong <strong>Unit {unit.unit}</strong>!
            </p>

            {hasUsedHint && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl p-2.5 font-medium leading-relaxed">
                💡 Bạn đã sử dụng gợi ý trong quá trình chơi nên đạt tối đa <strong>{calculateStars()} sao</strong>. Để giành huy hiệu <strong>Dũng Sĩ Ghép Từ</strong> (yêu cầu 3 sao tất cả các Unit), hãy thử chơi lại mà không dùng gợi ý nhé!
              </div>
            )}

            <div className="flex items-center justify-center gap-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < calculateStars()
                      ? 'fill-amber-400 text-amber-500 animate-bounce'
                      : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setCurrentIndex(0);
                  setGameWon(false);
                }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Chơi lại
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onComplete(calculateStars());
                }}
                className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 cursor-pointer"
              >
                Nhận thưởng & tiếp tục 🌟
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
