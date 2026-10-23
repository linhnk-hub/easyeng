import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Snail, Timer, Zap, CheckCircle2, XCircle, Star, Sparkles, HelpCircle, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UnitData, QuizQuestion } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/soundEffects';
import { getFullEnglishSentenceForQuiz, getBlankParts, hasBlank } from '../../utils/quizSentenceHelper';

interface QuizArenaGameProps {
  unit: UnitData;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const QuizArenaGame: React.FC<QuizArenaGameProps> = ({
  unit,
  onComplete,
  onBack
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [usedFiftyFifty, setUsedFiftyFifty] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  // Build question set from unit.quizzes + generated vocabulary questions (10 questions per round)
  useEffect(() => {
    const list: QuizQuestion[] = [...unit.quizzes];

    // Generate high-quality questions from unit vocabulary & patterns to reach at least 10
    if (unit.vocabulary && unit.vocabulary.length > 0) {
      // Type 1: English word -> Vietnamese meaning
      unit.vocabulary.forEach((voc) => {
        const otherMeanings = unit.vocabulary
          .filter(v => v.word !== voc.word)
          .map(v => v.meaning)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const options = [voc.meaning, ...otherMeanings].sort(() => Math.random() - 0.5);
        const correctIdx = options.indexOf(voc.meaning);

        list.push({
          question: `Từ "${voc.word}" có nghĩa là gì trong tiếng Việt?`,
          options,
          answerIndex: correctIdx,
          explanation: `"${voc.word}" nghĩa là "${voc.meaning}". Phiên âm: ${voc.phonetic}`
        });
      });

      // Type 2: Vietnamese meaning -> English word
      unit.vocabulary.forEach((voc) => {
        const otherWords = unit.vocabulary
          .filter(v => v.word !== voc.word)
          .map(v => v.word)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const options = [voc.word, ...otherWords].sort(() => Math.random() - 0.5);
        const correctIdx = options.indexOf(voc.word);

        list.push({
          question: `Từ nào trong tiếng Anh có nghĩa là "${voc.meaning}"?`,
          options,
          answerIndex: correctIdx,
          explanation: `"${voc.word}" có nghĩa là "${voc.meaning}".`
        });
      });

      // Type 3: Fill in the blank from example sentence
      unit.vocabulary.forEach((voc) => {
        if (voc.example && voc.example.toLowerCase().includes(voc.word.toLowerCase())) {
          const blankSentence = voc.example.replace(new RegExp(`\\b${voc.word}\\b`, 'i'), '_____');
          const otherWords = unit.vocabulary
            .filter(v => v.word.toLowerCase() !== voc.word.toLowerCase())
            .map(v => v.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

          if (otherWords.length >= 2) {
            const options = [voc.word, ...otherWords].sort(() => Math.random() - 0.5);
            list.push({
              question: `Chọn từ thích hợp điền vào chỗ trống: "${blankSentence}"`,
              options,
              answerIndex: options.indexOf(voc.word),
              explanation: `Câu hoàn chỉnh: "${voc.example}" (${voc.exampleMeaning || voc.meaning})`
            });
          }
        }
      });
    }

    const DEFAULT_FALLBACK_QUIZZES: QuizQuestion[] = [
      {
        question: 'Từ "Hello" có nghĩa là gì trong tiếng Việt?',
        options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
        answerIndex: 0,
        explanation: '"Hello" có nghĩa là "Xin chào".'
      },
      {
        question: 'Từ nào có nghĩa là "Giáo viên"?',
        options: ['Doctor', 'Student', 'Teacher', 'Worker'],
        answerIndex: 2,
        explanation: '"Teacher" có nghĩa là "Giáo viên".'
      },
      {
        question: 'Điền từ còn thiếu: "How are _____?"',
        options: ['you', 'your', 'she', 'he'],
        answerIndex: 0,
        explanation: 'Câu chào hỏi thông dụng: "How are you?" (Bạn có khỏe không?)'
      },
      {
        question: 'Từ "Book" nghĩa là gì?',
        options: ['Bút chì', 'Quyển sách', 'Thước kẻ', 'Cái bàn'],
        answerIndex: 1,
        explanation: '"Book" nghĩa là "Quyển sách".'
      },
      {
        question: 'Chọn từ trái nghĩa với "Big" (To lớn):',
        options: ['Small', 'Huge', 'Large', 'Tall'],
        answerIndex: 0,
        explanation: '"Small" (nhỏ) là từ trái nghĩa với "Big".'
      },
      {
        question: 'Từ "Good morning" dùng để chào vào thời gian nào?',
        options: ['Buổi sáng', 'Buổi trưa', 'Buổi tối', 'Trước khi đi ngủ'],
        answerIndex: 0,
        explanation: '"Good morning" nghĩa là "Chào buổi sáng".'
      },
      {
        question: 'Điền vào chỗ trống: "She _____ my best friend."',
        options: ['are', 'is', 'am', 'be'],
        answerIndex: 1,
        explanation: 'Chủ ngữ "She" đi với động từ to be "is".'
      },
      {
        question: 'Số 10 trong tiếng Anh đọc là gì?',
        options: ['One', 'Five', 'Eight', 'Ten'],
        answerIndex: 3,
        explanation: 'Số 10 là "Ten".'
      },
      {
        question: 'Màu đỏ trong tiếng Anh là gì?',
        options: ['Blue', 'Red', 'Green', 'Yellow'],
        answerIndex: 1,
        explanation: '"Red" nghĩa là màu đỏ.'
      },
      {
        question: 'Từ "Thank you" có nghĩa là gì?',
        options: ['Cảm ơn', 'Không có chi', 'Tạm biệt', 'Hẹn gặp lại'],
        answerIndex: 0,
        explanation: '"Thank you" có nghĩa là "Cảm ơn bạn".'
      }
    ];

    // Ensure pool has at least 10 questions
    let finalPool = [...list];
    if (finalPool.length === 0) {
      finalPool = [...DEFAULT_FALLBACK_QUIZZES];
    } else {
      while (finalPool.length < 10) {
        finalPool = finalPool.concat(list);
      }
    }

    const shuffledQuestions = finalPool.sort(() => Math.random() - 0.5).slice(0, 10);
    setQuestions(shuffledQuestions);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setTimeLeft(25);
    setUsedFiftyFifty(false);
    setHiddenOptions([]);
    setGameFinished(false);
  }, [unit]);

  const currentQ = questions[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (isAnswered || gameFinished || !currentQ) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up! Treat as wrong
          handleAnswer(-1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAnswered, gameFinished, currentQ]);

// Helper function: Strictly extract English word or sentence to speak, never pronouncing Vietnamese sentences with English TTS voice
function getEnglishSnippetToSpeak(question: string): string | null {
  if (!question) return null;

  // 1. If English word or phrase is enclosed in quotes: e.g. Từ "swimming" có nghĩa là gì...
  const quoteMatch = question.match(/["'“]([A-Za-z\s\-',.!?]+)["'”]/);
  if (quoteMatch && quoteMatch[1].trim()) {
    return quoteMatch[1].trim();
  }

  // 2. Check if the question contains Vietnamese accent characters
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(question);
  if (!hasVietnamese) {
    // Pure English sentence (e.g. "What time is it?", "I like playing ______.")
    // Remove blank placeholders like "______" or "___"
    const cleaned = question.replace(/_+/g, '').trim();
    return cleaned || null;
  }

  // 3. Check for pattern like: "Từ apple có nghĩa là..."
  const wordMatch = question.match(/(?:từ|tiếng Anh|word)\s+([A-Za-z\-]+)/i);
  if (wordMatch && wordMatch[1]) {
    return wordMatch[1].trim();
  }

  // Pure Vietnamese question with no isolated English target word: do not pronounce
  return null;
}

  // Stop speech when entering or leaving QuizArena
  useEffect(() => {
    speechService.cancel();
    return () => {
      speechService.cancel();
    };
  }, []);

  // Reset state on new question without auto-speaking
  useEffect(() => {
    speechService.cancel();
    setTimeLeft(25);
    setSelectedOption(null);
    setIsAnswered(false);
    setHiddenOptions([]);
  }, [currentIndex, currentQ]);

  const handleAnswer = (optionIdx: number) => {
    if (isAnswered) return;

    setSelectedOption(optionIdx);
    setIsAnswered(true);

    const isCorrect = optionIdx === currentQ.answerIndex;

    if (isCorrect) {
      soundEffects.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      soundEffects.playStreak(newStreak);
      // Combo bonus
      const bonus = newStreak >= 3 ? 150 : 100;
      setScore(s => s + bonus);

      // Play the full English sentence with the correct answer inserted
      const fullSentence = getFullEnglishSentenceForQuiz(
        currentQ.question,
        currentQ.options[currentQ.answerIndex],
        currentQ.explanation
      );
      if (fullSentence) {
        setTimeout(() => {
          speechService.speakNormal(fullSentence);
        }, 220);
      }
    } else {
      soundEffects.playError();
      setStreak(0);
    }
  };

  const handleNext = () => {
    soundEffects.playClick();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFiftyFifty = () => {
    if (usedFiftyFifty || isAnswered || !currentQ) return;
    soundEffects.playClick();
    setUsedFiftyFifty(true);

    const wrongIndices = currentQ.options
      .map((_, i) => i)
      .filter(i => i !== currentQ.answerIndex);

    // Pick 2 wrong indices to hide
    const toHide = wrongIndices.sort(() => Math.random() - 0.5).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const handleFinish = () => {
    soundEffects.playVictory();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
    setGameFinished(true);
  };

  const calculateStars = () => {
    const accuracy = score / (questions.length * 100);
    if (accuracy >= 0.8) return 3;
    if (accuracy >= 0.5) return 2;
    return 1;
  };

  if (!currentQ) return null;

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
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
            Unit {unit.unit} • {unit.title}
          </span>
          <span className="font-display font-bold text-slate-800 text-base sm:text-lg">
            ⚡ Trắc nghiệm
          </span>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
            Câu số {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* 50:50 Lifeline */}
        <button
          onClick={handleFiftyFifty}
          disabled={usedFiftyFifty || isAnswered}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
            usedFiftyFifty
              ? 'opacity-30 bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 active:scale-95'
          }`}
          title="Trợ giúp 50:50 (Loại 2 đáp án sai)"
        >
          50:50
        </button>
      </div>

      {/* Progress & Stats Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-amber-500'}`} />
            <span className={timeLeft <= 5 ? 'text-rose-600 font-bold' : ''}>
              Còn lại: {timeLeft}s
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-orange-500">
              <Zap className="w-4 h-4 fill-orange-400" />
              <span>Combo x{streak}</span>
            </div>
            <div className="text-amber-600 font-bold">
              Điểm: {score}
            </div>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              timeLeft <= 5 ? 'bg-rose-500' : 'bg-amber-400'
            }`}
            style={{ width: `${(timeLeft / 25) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-lg shadow-amber-900/5 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-800 leading-snug">
            {(() => {
              if (isAnswered) {
                const parts = getBlankParts(currentQ.question);
                if (parts) {
                  return (
                    <span>
                      {parts.before}
                      <span className="text-emerald-700 underline decoration-2 decoration-emerald-500 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-lg border border-emerald-300 mx-1">
                        {currentQ.options[currentQ.answerIndex]}
                      </span>
                      {parts.after}
                    </span>
                  );
                }
              }
              return currentQ.question;
            })()}
          </h2>
          {(() => {
            const fullSentence = getFullEnglishSentenceForQuiz(
              currentQ.question,
              currentQ.options[currentQ.answerIndex],
              currentQ.explanation
            );
            const snippet = isAnswered && fullSentence ? fullSentence : (!hasBlank(currentQ.question) ? getEnglishSnippetToSpeak(currentQ.question) : null);
            if (!snippet) return null;
            return (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => speechService.speakNormal(snippet)}
                  className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                  title={`Nghe phát âm chuẩn: "${snippet}"`}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => speechService.speakSlowly(snippet)}
                  className="px-2.5 py-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                  title={`Nghe phát âm chậm: "${snippet}"`}
                >
                  <Snail className="w-4 h-4 text-teal-600" />
                  <span className="text-[11px] hidden sm:inline">Chậm</span>
                </button>
              </div>
            );
          })()}
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((option, index) => {
            const isHidden = hiddenOptions.includes(index);
            const isChosen = selectedOption === index;
            const isCorrect = index === currentQ.answerIndex;

            let btnStyle = 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 text-slate-800';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20';
              } else if (isChosen) {
                btnStyle = 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20';
              } else {
                btnStyle = 'opacity-40 bg-slate-100 border-slate-200 text-slate-400';
              }
            }

            if (isHidden) {
              return (
                <div
                  key={index}
                  className="h-14 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 opacity-30"
                />
              );
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
                className={`p-4 rounded-2xl border-2 font-display font-bold text-sm sm:text-base text-left transition-all flex items-center justify-between gap-2 cursor-pointer active:scale-98 ${btnStyle}`}
              >
                <span>{option}</span>
                {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                {isAnswered && isChosen && !isCorrect && <XCircle className="w-5 h-5 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {isAnswered && (() => {
          const fullSentence = getFullEnglishSentenceForQuiz(
            currentQ.question,
            currentQ.options[currentQ.answerIndex],
            currentQ.explanation
          );
          return (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              {fullSentence && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-1 min-w-0">
                    <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Câu tiếng Anh đầy đủ:
                    </span>
                    <p className="font-display font-bold text-slate-800 text-sm sm:text-base break-words">
                      "{fullSentence}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => speechService.speakNormal(fullSentence)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 font-bold text-xs"
                      title={`Nghe chuẩn: "${fullSentence}"`}
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Nghe câu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => speechService.speakSlowly(fullSentence)}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-xs active:scale-95"
                      title={`Nghe chậm: "${fullSentence}"`}
                    >
                      <Snail className="w-3.5 h-3.5" />
                      <span className="text-[11px] hidden sm:inline">Chậm</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={`p-4 rounded-2xl text-xs sm:text-sm font-medium ${
                selectedOption === currentQ.answerIndex
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}>
                <strong className="block font-bold mb-1">
                  {selectedOption === currentQ.answerIndex ? '🎉 Chính xác!' : '💡 Lời giải thích:'}
                </strong>
                {currentQ.explanation}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-display font-bold text-sm sm:text-base shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
                >
                  {currentIndex < questions.length - 1 ? 'Câu tiếp theo ➔' : 'Xem kết quả 🏆'}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Victory Modal */}
      {gameFinished && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-float">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center text-3xl">
              🏆
            </div>
            <h3 className="font-display font-bold text-2xl text-slate-800">
              Hoàn thành trắc nghiệm!
            </h3>
            <p className="text-slate-600 text-sm">
              Tổng điểm của bạn: <strong className="text-amber-600 text-lg">{score} điểm</strong> (Combo cao nhất: x{maxStreak})
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
                  setScore(0);
                  setGameFinished(false);
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
                className="flex-1 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
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
