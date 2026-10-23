import React, { useState, useEffect } from 'react';
import { Volume2, RotateCw, ArrowLeft, ArrowRight, Check, Sparkles, Snail, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UnitData, VocabularyItem } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/soundEffects';

interface FlashcardGameProps {
  unit: UnitData;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

const DEFAULT_FLASHCARD_VOCAB: VocabularyItem[] = [
  { word: 'Hello', meaning: 'Xin chào', phonetic: '/həˈloʊ/', example: 'Hello, nice to meet you!', exampleMeaning: 'Xin chào, rất vui được gặp bạn!', imageEmoji: '👋' },
  { word: 'Friend', meaning: 'Bạn bè', phonetic: '/frend/', example: 'She is my best friend.', exampleMeaning: 'Cô ấy là bạn thân nhất của tôi.', imageEmoji: '👫' },
  { word: 'School', meaning: 'Trường học', phonetic: '/skuːl/', example: 'I go to school every day.', exampleMeaning: 'Tôi đi học mỗi ngày.', imageEmoji: '🏫' },
  { word: 'Teacher', meaning: 'Giáo viên', phonetic: '/ˈtiːtʃər/', example: 'Our teacher is very kind.', exampleMeaning: 'Thầy cô giáo của chúng tôi rất tốt bụng.', imageEmoji: '👩‍🏫' },
  { word: 'Book', meaning: 'Quyển sách', phonetic: '/bʊk/', example: 'I love reading books.', exampleMeaning: 'Tôi thích đọc sách.', imageEmoji: '📚' },
  { word: 'Happy', meaning: 'Vui vẻ', phonetic: '/ˈhæpi/', example: 'We are very happy today.', exampleMeaning: 'Hôm nay chúng tôi rất vui vẻ.', imageEmoji: '😊' },
  { word: 'Family', meaning: 'Gia đình', phonetic: '/ˈfæməli/', example: 'I love my sweet family.', exampleMeaning: 'Tôi yêu gia đình thân thương của tôi.', imageEmoji: '👨‍👩‍👧‍👦' },
  { word: 'Learn', meaning: 'Học tập', phonetic: '/lɜːrn/', example: 'We learn English together.', exampleMeaning: 'Chúng tôi cùng nhau học tiếng Anh.', imageEmoji: '💡' },
  { word: 'Smile', meaning: 'Nụ cười', phonetic: '/smaɪl/', example: 'Always smile every day!', exampleMeaning: 'Hãy luôn mỉm cười mỗi ngày nhé!', imageEmoji: '✨' },
  { word: 'Star', meaning: 'Ngôi sao', phonetic: '/stɑːr/', example: 'You are a shining star!', exampleMeaning: 'Bạn là một ngôi sao tỏa sáng!', imageEmoji: '⭐' }
];

export const FlashcardGame: React.FC<FlashcardGameProps> = ({
  unit,
  onComplete,
  onBack
}) => {
  // Ensure exactly 10 cards for all units of all classes
  const cards: VocabularyItem[] = React.useMemo(() => {
    const base = unit.vocabulary && unit.vocabulary.length > 0 ? [...unit.vocabulary] : [...DEFAULT_FLASHCARD_VOCAB];
    let result = [...base];
    while (result.length < 10) {
      result = result.concat(base);
    }
    return result.slice(0, 10);
  }, [unit]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredWords, setMasteredWords] = useState<Set<number>>(new Set());
  const [autoPronounce, setAutoPronounce] = useState(false);
  const [showFinishedModal, setShowFinishedModal] = useState(false);
  const [completionStars, setCompletionStars] = useState(0);
  const [masteredCountAtFinish, setMasteredCountAtFinish] = useState(0);

  // Stop any previous speech when entering the minigame
  useEffect(() => {
    speechService.cancel();
    return () => {
      speechService.cancel();
    };
  }, []);

  // Reset when unit changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredWords(new Set());
    setShowFinishedModal(false);
    setCompletionStars(0);
  }, [unit]);

  const currentVocab: VocabularyItem = cards[currentIndex] || cards[0];

  // Auto pronounce word on card change only if user explicitly turned autoPronounce ON
  useEffect(() => {
    setIsFlipped(false);
    if (autoPronounce && currentVocab) {
      const timer = setTimeout(() => {
        speechService.speakNormal(currentVocab.word);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoPronounce, currentVocab]);

  const handleFlip = () => {
    soundEffects.playFlip();
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    soundEffects.playClick();
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    soundEffects.playClick();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const calculateStars = (masteredCount: number, totalCount: number = 10): number => {
    if (masteredCount <= 0) return 0;
    if (masteredCount >= 10 || masteredCount >= totalCount) return 3;
    if (masteredCount >= 6 && masteredCount <= 9) return 2;
    if (masteredCount >= 1 && masteredCount <= 5) return 1;
    return 0;
  };

  const handleFinish = (explicitCount?: number) => {
    const count = explicitCount !== undefined ? explicitCount : masteredWords.size;
    const stars = calculateStars(count, cards.length);
    setMasteredCountAtFinish(count);
    setCompletionStars(stars);

    if (stars > 0) {
      soundEffects.playVictory();
      confetti({
        particleCount: stars === 3 ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      soundEffects.playClick();
    }
    setShowFinishedModal(true);
  };

  const markMastered = () => {
    const updated = new Set(masteredWords);
    const wasAlreadyMastered = updated.has(currentIndex);

    if (wasAlreadyMastered) {
      // Toggle off if learner wants to review again
      updated.delete(currentIndex);
      soundEffects.playClick();
      setMasteredWords(updated);
    } else {
      updated.add(currentIndex);
      soundEffects.playSuccess();
      setMasteredWords(updated);

      if (updated.size === cards.length) {
        // Mastered all cards! Auto-complete with 3 stars
        handleFinish(updated.size);
      } else if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition shrink-0"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="text-center truncate px-1">
          <span className="text-[11px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider block truncate">
            Unit {unit.unit} • {unit.title}
          </span>
          <span className="font-display font-bold text-slate-800 text-sm sm:text-base">
           📖 Học từ
          </span>
        </div>

        {/* Right Action: Finish learning session */}
        <button
          onClick={() => {
            soundEffects.playClick();
            handleFinish();
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition shrink-0 active:scale-95"
          title="Kết thúc bài học để nhận sao"
        >
          <span>Hoàn thành</span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold text-slate-600 gap-2 flex-wrap">
          <span>Tiến độ: {currentIndex + 1} / {cards.length}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAutoPronounce(!autoPronounce)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                autoPronounce
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="Bật/Tắt tự động đọc từ khi chuyển thẻ (mặc định đã tắt)"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Tự đọc: {autoPronounce ? 'Bật' : 'Tắt'}</span>
            </button>
            <span className="text-emerald-600 font-bold">
              Đã thuộc: {masteredWords.size} / {cards.length} từ
            </span>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 3D Flashcard Container */}
      <div
        className="w-full h-80 sm:h-96 perspective-1000 cursor-pointer select-none"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Front (English word + IPA + Audio) */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-xl shadow-amber-900/5 flex flex-col justify-between items-center text-center">
            <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400">
              <span>Unit {unit.unit}</span>
              <span className="text-amber-500 font-semibold flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Chạm để lật xem nghĩa
              </span>
            </div>

            <div className="space-y-3 my-auto">
              {currentVocab.imageEmoji && (
                <div className="text-5xl sm:text-6xl animate-bounce">
                  {currentVocab.imageEmoji}
                </div>
              )}
              
              <h2 className="font-display font-bold text-3xl sm:text-5xl text-slate-800 tracking-tight">
                {currentVocab.word}
              </h2>

              <p className="font-mono text-slate-500 text-sm sm:text-base">
                {currentVocab.phonetic}
              </p>

              {/* Pronunciation Buttons */}
              <div className="flex items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    speechService.speakNormal(currentVocab.word);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                  title="Nghe phát âm chuẩn tốc độ bình thường"
                >
                  <Volume2 className="w-4 h-4" /> Nghe chuẩn
                </button>

                <button
                  onClick={() => {
                    soundEffects.playClick();
                    speechService.speakSlowly(currentVocab.word);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-2xl text-xs sm:text-sm font-bold transition active:scale-95 cursor-pointer"
                  title="Nghe chậm (0.75x) để phát âm chính xác"
                >
                  <Snail className="w-4 h-4 text-teal-600" /> Nghe chậm
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              Bấm vào thẻ bài để lật sang nghĩa tiếng Việt & câu ví dụ
            </div>
          </div>

          {/* Card Back (Vietnamese Meaning + Example Sentence) */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-6 sm:p-8 border-2 border-orange-200 shadow-xl shadow-orange-900/5 flex flex-col justify-between items-center text-center">
            <div className="w-full flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="text-emerald-600 font-bold">Nghĩa tiếng Việt</span>
              <span className="text-amber-500 font-semibold flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5" /> Chạm để quay lại
              </span>
            </div>

            <div className="space-y-4 my-auto max-w-md">
              <div className="text-3xl sm:text-4xl font-display font-bold text-orange-600">
                {currentVocab.meaning}
              </div>

              {/* Example sentence box */}
              {currentVocab.example && (
                <div className="bg-white/80 border border-amber-200 rounded-2xl p-4 text-left space-y-1 shadow-xs" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                      Câu ví dụ
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speechService.speakNormal(currentVocab.example)}
                        className="text-amber-600 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 transition cursor-pointer"
                        title="Nghe câu ví dụ chuẩn"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => speechService.speakSlowly(currentVocab.example)}
                        className="text-teal-600 hover:text-teal-800 px-1.5 py-0.5 rounded-lg hover:bg-teal-100 transition cursor-pointer flex items-center gap-0.5 text-xs font-bold"
                        title="Nghe câu ví dụ phát âm chậm"
                      >
                        <Snail className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-800 font-semibold text-sm sm:text-base">
                    "{currentVocab.example}"
                  </p>
                  <p className="text-slate-500 text-xs italic">
                    "{currentVocab.exampleMeaning}"
                  </p>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400">
              Thực hành lặp lại câu ví dụ để ghi nhớ sâu hơn nhé!
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer: Navigation & Mastered check */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition cursor-pointer ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
              : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs active:scale-95'
          }`}
        >
          <ArrowLeft className="w-4 h-4" /> Từ trước
        </button>

        <button
          onClick={markMastered}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-display font-bold text-sm sm:text-base transition cursor-pointer shadow-md active:scale-95 ${
            masteredWords.has(currentIndex)
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          {masteredWords.has(currentIndex) ? 'Đã thuộc từ này!' : 'Đánh dấu đã thuộc'}
        </button>

        {currentIndex === cards.length - 1 ? (
          <button
            onClick={() => {
              soundEffects.playClick();
              handleFinish();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
          >
            Hoàn thành <Sparkles className="w-4 h-4 text-yellow-200" />
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm transition cursor-pointer bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-xs active:scale-95"
          >
            Từ tiếp theo <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Completion Modal */}
      {showFinishedModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-float">
            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl ${
              completionStars === 0
                ? 'bg-rose-100 text-rose-600'
                : completionStars === 3
                ? 'bg-amber-100 text-amber-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {completionStars === 0 ? '⚠️' : completionStars === 3 ? '🎉' : '⭐'}
            </div>

            <h3 className="font-display font-bold text-2xl text-slate-800">
              {completionStars === 0
                ? 'Bạn chưa thuộc từ nào'
                : completionStars === 1
                ? 'Cố gắng lên!'
                : completionStars === 2
                ? 'Làm tốt lắm!'
                : 'Xuất sắc! Bạn đã học hết từ vựng!'}
            </h3>

            <p className="text-slate-600 text-sm">
              {completionStars === 0 ? (
                <>Bạn chưa thuộc 0/{cards.length} từ, bạn sẽ không được cộng sao.</>
              ) : completionStars === 3 ? (
                <>Bạn đã ghi nhớ toàn bộ <strong>{masteredCountAtFinish}/{cards.length}</strong> từ vựng của <strong>Unit {unit.unit}: {unit.title}</strong>, bạn được cộng 3 sao!</>
              ) : (
                <>Bạn đã thuộc <strong>{masteredCountAtFinish}/{cards.length}</strong> từ, bạn được cộng <strong>{completionStars} sao</strong>.</>
              )}
            </p>

            {/* Stars Display */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3].map((starIdx) => (
                <span
                  key={starIdx}
                  className={`text-3xl transition-all duration-300 ${
                    starIdx <= completionStars
                      ? 'scale-110 drop-shadow-sm'
                      : 'opacity-25 grayscale'
                  }`}
                >
                  ⭐
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {completionStars === 0 ? (
                <>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setShowFinishedModal(false);
                      setCurrentIndex(0);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    Quay lại học tiếp
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      onComplete(0);
                    }}
                    className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    Kết thúc bài học
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setShowFinishedModal(false);
                      setCurrentIndex(0);
                    }}
                    className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
                  >
                    {completionStars === 3 ? 'Ôn lại một lần nữa' : 'Học lại để đạt 3 sao'}
                  </button>
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      onComplete(completionStars);
                    }}
                    className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {completionStars === 3 ? 'Chơi mini-game tiếp! 🎮' : `Nhận ${completionStars} sao & tiếp tục`}
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
