import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Volume2, Snail, CheckCircle2, Star, Sparkles, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UnitData, SentenceChallenge } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/soundEffects';

interface SentenceBuilderGameProps {
  unit: UnitData;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const SentenceBuilderGame: React.FC<SentenceBuilderGameProps> = ({
  unit,
  onComplete,
  onBack
}) => {
  // Generate exactly 10 sentence challenges from unit's challenges, vocabulary examples, and sentence patterns
  const challenges: SentenceChallenge[] = React.useMemo(() => {
    const list: SentenceChallenge[] = [];

    // 1. Existing sentence challenges
    if (unit.sentenceChallenges && unit.sentenceChallenges.length > 0) {
      list.push(...unit.sentenceChallenges);
    }

    // 2. Vocabulary examples
    if (unit.vocabulary && unit.vocabulary.length > 0) {
      unit.vocabulary.forEach(v => {
        if (v.example && v.example.trim()) {
          const words = v.example.trim().split(/\s+/).filter(Boolean);
          if (words.length >= 2 && !list.some(c => c.correctSentence.toLowerCase() === v.example.trim().toLowerCase())) {
            list.push({
              scrambledWords: [...words].sort(() => Math.random() - 0.5),
              correctSentence: v.example.trim(),
              vietnameseMeaning: v.exampleMeaning || v.meaning
            });
          }
        }
      });
    }

    // 3. Sentence patterns
    if (unit.sentencePatterns && unit.sentencePatterns.length > 0) {
      unit.sentencePatterns.forEach(p => {
        if (p.pattern && p.pattern.trim()) {
          const words = p.pattern.trim().split(/\s+/).filter(Boolean);
          if (words.length >= 2 && !list.some(c => c.correctSentence.toLowerCase() === p.pattern.trim().toLowerCase())) {
            list.push({
              scrambledWords: [...words].sort(() => Math.random() - 0.5),
              correctSentence: p.pattern.trim(),
              vietnameseMeaning: p.usage || ''
            });
          }
        }
      });
    }

    // If list has items, repeat/cycle until 10 items
    if (list.length > 0) {
      const result: SentenceChallenge[] = [...list];
      while (result.length < 10) {
        const extra = list.map(item => ({
          ...item,
          scrambledWords: [...item.correctSentence.split(/\s+/)].sort(() => Math.random() - 0.5)
        }));
        result.push(...extra);
      }
      return result.slice(0, 10);
    }

    // Default fallback list of exactly 10 sentences if no sentences could be formed
    const fallbackSentences: SentenceChallenge[] = [
      {
        scrambledWords: ['I', 'love', 'learning', 'English'],
        correctSentence: 'I love learning English',
        vietnameseMeaning: 'Tôi yêu thích việc học tiếng Anh'
      },
      {
        scrambledWords: ['This', 'is', 'my', 'classroom'],
        correctSentence: 'This is my classroom',
        vietnameseMeaning: 'Đây là lớp học của tôi'
      },
      {
        scrambledWords: ['She', 'is', 'a', 'kind', 'teacher'],
        correctSentence: 'She is a kind teacher',
        vietnameseMeaning: 'Cô ấy là một giáo viên tốt bụng'
      },
      {
        scrambledWords: ['We', 'read', 'books', 'every', 'day'],
        correctSentence: 'We read books every day',
        vietnameseMeaning: 'Chúng tôi đọc sách mỗi ngày'
      },
      {
        scrambledWords: ['What', 'is', 'your', 'favorite', 'subject'],
        correctSentence: 'What is your favorite subject',
        vietnameseMeaning: 'Môn học yêu thích của bạn là gì'
      },
      {
        scrambledWords: ['I', 'have', 'many', 'good', 'friends'],
        correctSentence: 'I have many good friends',
        vietnameseMeaning: 'Tôi có rất nhiều người bạn tốt'
      },
      {
        scrambledWords: ['They', 'are', 'playing', 'in', 'the', 'schoolyard'],
        correctSentence: 'They are playing in the schoolyard',
        vietnameseMeaning: 'Họ đang chơi ở sân trường'
      },
      {
        scrambledWords: ['Can', 'you', 'speak', 'English', 'slowly'],
        correctSentence: 'Can you speak English slowly',
        vietnameseMeaning: 'Bạn có thể nói tiếng Anh chậm lại không'
      },
      {
        scrambledWords: ['Today', 'is', 'a', 'wonderful', 'day'],
        correctSentence: 'Today is a wonderful day',
        vietnameseMeaning: 'Hôm nay là một ngày tuyệt vời'
      },
      {
        scrambledWords: ['Practice', 'makes', 'perfect', 'every', 'day'],
        correctSentence: 'Practice makes perfect every day',
        vietnameseMeaning: 'Luyện tập mỗi ngày sẽ tạo nên sự hoàn hảo'
      }
    ];

    return fallbackSentences;
  }, [unit]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedWords, setPlacedWords] = useState<{ id: string; word: string }[]>([]);
  const [availableWords, setAvailableWords] = useState<{ id: string; word: string; isUsed: boolean }[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  const currentChallenge = challenges[currentIndex] || challenges[0];

  useEffect(() => {
    speechService.cancel();
    return () => {
      speechService.cancel();
    };
  }, []);

  useEffect(() => {
    speechService.cancel();
    if (!currentChallenge) return;

    // Split target sentence or scrambledWords
    const words = [...currentChallenge.scrambledWords].sort(() => Math.random() - 0.5);
    const wordList = words.map((w, i) => ({
      id: `${w}-${i}-${Math.random()}`,
      word: w,
      isUsed: false
    }));

    setAvailableWords(wordList);
    setPlacedWords([]);
    setIsCorrect(false);
  }, [currentIndex, currentChallenge]);

  const handlePickWord = (item: { id: string; word: string }) => {
    if (isCorrect) return;

    soundEffects.playClick();

    setAvailableWords(prev =>
      prev.map(w => w.id === item.id ? { ...w, isUsed: true } : w)
    );

    const newPlaced = [...placedWords, item];
    setPlacedWords(newPlaced);

    // Speak single tapped word for phonics reinforcement
    speechService.speakNormal(item.word);

    // If all words are placed, verify sentence
    if (newPlaced.length === availableWords.length) {
      const builtSentence = newPlaced.map(w => w.word).join(' ');
      // Normalize punctuation/spacing
      const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();

      if (normalize(builtSentence) === normalize(currentChallenge.correctSentence)) {
        // CORRECT!
        soundEffects.playSuccess();
        setIsCorrect(true);
        // Pronounce full sentence
        setTimeout(() => {
          speechService.speakNormal(currentChallenge.correctSentence);
        }, 300);

        setTimeout(() => {
          if (currentIndex < challenges.length - 1) {
            setCurrentIndex(prev => prev + 1);
          } else {
            handleVictory();
          }
        }, 1800);
      } else {
        // WRONG ORDER!
        soundEffects.playError();
        setAttempts(a => a + 1);
      }
    }
  };

  const handleRemoveWord = (index: number) => {
    if (isCorrect) return;

    soundEffects.playClick();
    const removedItem = placedWords[index];

    setPlacedWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev =>
      prev.map(w => w.id === removedItem.id ? { ...w, isUsed: false } : w)
    );
  };

  const handleReset = () => {
    soundEffects.playClick();
    setPlacedWords([]);
    setAvailableWords(prev => prev.map(w => ({ ...w, isUsed: false })));
  };

  const handleVictory = () => {
    soundEffects.playVictory();
    confetti({
      particleCount: 85,
      spread: 70,
      origin: { y: 0.6 }
    });
    setGameWon(true);
  };

  const calculateStars = () => {
    if (attempts <= 2) return 3;
    if (attempts <= 5) return 2;
    return 1;
  };

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
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">
            Unit {unit.unit} • {unit.title}
          </span>
          <span className="font-display font-bold text-slate-800 text-base sm:text-lg">
            🏰 Xếp câu
          </span>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">
          Câu số {currentIndex + 1} / {challenges.length}
          </span>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer shadow-xs transition"
          title="Xếp lại câu này"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Làm lại
        </button>
      </div>

      {/* Grammar Target Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-200 shadow-lg shadow-teal-900/5 text-center space-y-5">
        <div className="space-y-1">
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block">
            Dịch nghĩa tiếng Việt
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-800">
            "{currentChallenge.vietnameseMeaning}"
          </h2>
        </div>

        {/* Pronunciation options: Nghe chuẩn + Nghe chậm */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              speechService.speakNormal(currentChallenge.correctSentence);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Nghe mẫu câu chuẩn tốc độ bình thường"
          >
            <Volume2 className="w-3.5 h-3.5 text-teal-600" /> Nghe chuẩn
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              speechService.speakSlowly(currentChallenge.correctSentence);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
            title="Nghe mẫu câu phát âm chậm từng từ"
          >
            <Snail className="w-3.5 h-3.5 text-amber-600" /> Nghe chậm
          </button>
        </div>

        {/* Sentence Formation Slot */}
        <div className="min-h-[72px] bg-teal-50/50 rounded-2xl border-2 border-dashed border-teal-300 p-4 flex flex-wrap items-center justify-center gap-2 transition-all">
          {placedWords.length === 0 ? (
            <span className="text-sm font-semibold text-teal-600/60 select-none">
              Chạm vào các từ bên dưới theo đúng thứ tự để tạo câu...
            </span>
          ) : (
            placedWords.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleRemoveWord(index)}
                disabled={isCorrect}
                className={`px-3.5 py-2 rounded-xl font-display font-bold text-sm sm:text-base transition-all ${
                  isCorrect
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 active:scale-95 cursor-pointer'
                }`}
                title="Bấm để gỡ từ này"
              >
                {item.word}
              </button>
            ))
          )}
        </div>

        {/* Word Options Tray */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
            Kho từ vựng có sẵn
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {availableWords.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.isUsed && handlePickWord(item)}
                disabled={item.isUsed || isCorrect}
                className={`px-4 py-2.5 rounded-2xl font-display font-bold text-sm sm:text-base transition-all ${
                  item.isUsed
                    ? 'opacity-20 cursor-not-allowed bg-slate-100 text-slate-400'
                    : 'bg-white hover:bg-amber-50 text-slate-800 border-2 border-slate-200 hover:border-amber-400 shadow-sm active:scale-95 cursor-pointer'
                }`}
              >
                {item.word}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Alert if Correct */}
        {isCorrect && (
          <div className="bg-emerald-100/80 border border-emerald-300 text-emerald-900 rounded-2xl p-3 flex items-center justify-center gap-2 font-display font-bold text-sm animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Chính xác! Câu hoàn chỉnh: {currentChallenge.correctSentence}
          </div>
        )}
      </div>

      {/* Victory Modal */}
      {gameWon && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-float">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 mx-auto flex items-center justify-center text-3xl">
              🏰
            </div>
            <h3 className="font-display font-bold text-2xl text-slate-800">
              Bậc thầy cú pháp tiếng Anh!
            </h3>
            <p className="text-slate-600 text-sm">
              Bạn đã xếp đúng tất cả các mẫu câu giao tiếp trọng tâm của <strong>Unit {unit.unit}</strong>!
            </p>
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
                className="flex-1 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 cursor-pointer"
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
