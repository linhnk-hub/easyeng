import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trophy, Star, Zap, Timer, CheckCircle2, XCircle, RotateCcw, Volume2, Snail, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UnitData, VocabularyItem, QuizQuestion, SentenceChallenge } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/soundEffects';

interface ComprehensiveChallengeGameProps {
  units: UnitData[];
  grade: number;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

type ChallengeStage = 'intro' | 'vocab' | 'scramble' | 'sentence' | 'quiz' | 'finished';

interface VocabQuestion {
  word: string;
  phonetic: string;
  meaning: string;
  options: string[];
  answerIndex: number;
  unitNum: number;
}

export const ComprehensiveChallengeGame: React.FC<ComprehensiveChallengeGameProps> = ({
  units,
  grade,
  onComplete,
  onBack
}) => {
  const [stage, setStage] = useState<ChallengeStage>('intro');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  // === POOL OF AGGREGATED CONTENT FROM ALL UNITS ===
  const allVocab = useMemo(() => {
    const list: { item: VocabularyItem; unitNum: number }[] = [];
    units.forEach(u => {
      u.vocabulary.forEach(v => list.push({ item: v, unitNum: u.unit }));
    });
    return list;
  }, [units]);

  const allQuizzes = useMemo(() => {
    const list: { quiz: QuizQuestion; unitNum: number }[] = [];
    units.forEach(u => {
      u.quizzes.forEach(q => list.push({ quiz: q, unitNum: u.unit }));
    });
    return list;
  }, [units]);

  const allSentences = useMemo(() => {
    const list: { challenge: SentenceChallenge; unitNum: number }[] = [];
    units.forEach(u => {
      if (u.sentenceChallenges && u.sentenceChallenges.length > 0) {
        u.sentenceChallenges.forEach(s => list.push({ challenge: s, unitNum: u.unit }));
      } else if (u.sentencePatterns && u.sentencePatterns.length > 0) {
        u.sentencePatterns.forEach(sp => {
          const words = sp.pattern.split(/\s+/).filter(Boolean);
          if (words.length >= 3) {
            list.push({
              challenge: {
                scrambledWords: [...words].sort(() => Math.random() - 0.5),
                correctSentence: sp.pattern,
                vietnameseMeaning: sp.usage
              },
              unitNum: u.unit
            });
          }
        });
      }
    });
    return list;
  }, [units]);

  // === STAGE 1: VOCABULARY QUESTIONS (5 items) ===
  const [vocabQuestions, setVocabQuestions] = useState<VocabQuestion[]>([]);
  const [currentVocabIdx, setCurrentVocabIdx] = useState(0);
  const [selectedVocabOpt, setSelectedVocabOpt] = useState<number | null>(null);
  const [isVocabAnswered, setIsVocabAnswered] = useState(false);

  // === STAGE 2: WORD SCRAMBLE (3 items) ===
  const [scrambleItems, setScrambleItems] = useState<{ word: string; meaning: string; phonetic: string; unitNum: number }[]>([]);
  const [currentScrambleIdx, setCurrentScrambleIdx] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState<{ id: string; char: string; used: boolean }[]>([]);
  const [pickedSlots, setPickedSlots] = useState<{ id: string; char: string }[]>([]);
  const [scrambleStatus, setScrambleStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

  // === STAGE 3: SENTENCE CONSTRUCTOR (2 items) ===
  const [sentenceItems, setSentenceItems] = useState<{ challenge: SentenceChallenge; unitNum: number }[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [availableWords, setAvailableWords] = useState<{ id: string; word: string; used: boolean }[]>([]);
  const [userWords, setUserWords] = useState<{ id: string; word: string }[]>([]);
  const [sentenceStatus, setSentenceStatus] = useState<'playing' | 'correct' | 'wrong'>('playing');

  // === STAGE 4: GRAND QUIZ (5 items) ===
  const [quizQuestions, setQuizQuestions] = useState<{ quiz: QuizQuestion; unitNum: number }[]>([]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(null);
  const [isQuizAnswered, setIsQuizAnswered] = useState(false);

  // State tracking history of used items to prevent repeat questions across challenge sessions
  const [usedVocabWords, setUsedVocabWords] = useState<string[]>([]);
  const [usedQuizzes, setUsedQuizzes] = useState<string[]>([]);
  const [usedSentences, setUsedSentences] = useState<string[]>([]);

  // Setup round content when starting game
  const initChallenge = () => {
    soundEffects.playClick();
    setScore(0);
    setStreak(0);
    setMaxStreak(0);

    // 1. Pick 5 random vocabulary items from different units without immediate repetition
    let availableVocab = allVocab.filter(v => !usedVocabWords.includes(v.item.word));
    if (availableVocab.length < 5) {
      availableVocab = [...allVocab];
      setUsedVocabWords([]);
    }
    const shuffledVocab = [...availableVocab].sort(() => Math.random() - 0.5).slice(0, 5);
    setUsedVocabWords(prev => [...prev, ...shuffledVocab.map(v => v.item.word)]);

    const builtVocabQuestions: VocabQuestion[] = shuffledVocab.map(({ item, unitNum }) => {
      const distractors = allVocab
        .filter(v => v.item.word !== item.word)
        .map(v => v.item.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const options = [item.meaning, ...distractors].sort(() => Math.random() - 0.5);
      return {
        word: item.word,
        phonetic: item.phonetic,
        meaning: item.meaning,
        options,
        answerIndex: options.indexOf(item.meaning),
        unitNum
      };
    });
    setVocabQuestions(builtVocabQuestions);
    setCurrentVocabIdx(0);
    setSelectedVocabOpt(null);
    setIsVocabAnswered(false);

    // 2. Pick 3 random words for Scramble
    const scrambleCandidates = allVocab
      .filter(v => v.item.word.length >= 3 && v.item.word.length <= 8 && !v.item.word.includes(' '))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => ({
        word: v.item.word.toLowerCase(),
        meaning: v.item.meaning,
        phonetic: v.item.phonetic,
        unitNum: v.unitNum
      }));
    setScrambleItems(scrambleCandidates);
    setCurrentScrambleIdx(0);

    // 3. Pick 2 sentence challenges avoiding repeats
    let availableSentences = allSentences.filter(s => !usedSentences.includes(s.challenge.correctSentence));
    if (availableSentences.length < 2) {
      availableSentences = [...allSentences];
      setUsedSentences([]);
    }
    const chosenSentences = [...availableSentences].sort(() => Math.random() - 0.5).slice(0, 2);
    setUsedSentences(prev => [...prev, ...chosenSentences.map(s => s.challenge.correctSentence)]);
    setSentenceItems(chosenSentences);
    setCurrentSentenceIdx(0);

    // 4. Pick 5 quizzes from across all units avoiding repeats
    let availableQuizzes = allQuizzes.filter(q => !usedQuizzes.includes(q.quiz.question));
    if (availableQuizzes.length < 5) {
      availableQuizzes = [...allQuizzes];
      setUsedQuizzes([]);
    }
    const chosenQuizzes = [...availableQuizzes].sort(() => Math.random() - 0.5).slice(0, 5);
    setUsedQuizzes(prev => [...prev, ...chosenQuizzes.map(q => q.quiz.question)]);
    setQuizQuestions(chosenQuizzes);
    setCurrentQuizIdx(0);
    setSelectedQuizOpt(null);
    setIsQuizAnswered(false);

    setStage('vocab');
  };

  // Helper: Pronounce English word/sentence only
  const speakEnglish = (text: string) => {
    // Only speak clean English text
    const cleaned = text.replace(/_+/g, '').trim();
    if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(cleaned)) {
      speechService.speakNormal(cleaned);
    }
  };

  const speakEnglishSlow = (text: string) => {
    const cleaned = text.replace(/_+/g, '').trim();
    if (!/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i.test(cleaned)) {
      speechService.speakSlowly(cleaned);
    }
  };

  // -------------------------------------------------------------
  // STAGE 1: VOCABULARY HANDLERS
  // -------------------------------------------------------------
  const currentVocab = vocabQuestions[currentVocabIdx];

  useEffect(() => {
    if (stage === 'vocab' && currentVocab) {
      speakEnglish(currentVocab.word);
    }
  }, [stage, currentVocabIdx]);

  const handleSelectVocab = (idx: number) => {
    if (isVocabAnswered || !currentVocab) return;
    setSelectedVocabOpt(idx);
    setIsVocabAnswered(true);

    const isCorrect = idx === currentVocab.answerIndex;
    if (isCorrect) {
      soundEffects.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      soundEffects.playStreak(newStreak);
      setScore(s => s + 100 + newStreak * 20);
    } else {
      soundEffects.playError();
      setStreak(0);
    }
  };

  const handleNextVocab = () => {
    soundEffects.playClick();
    if (currentVocabIdx < vocabQuestions.length - 1) {
      setCurrentVocabIdx(prev => prev + 1);
      setSelectedVocabOpt(null);
      setIsVocabAnswered(false);
    } else {
      // Transition to Stage 2: Scramble
      initScrambleItem(0);
      setStage('scramble');
    }
  };

  // -------------------------------------------------------------
  // STAGE 2: SCRAMBLE HANDLERS
  // -------------------------------------------------------------
  const initScrambleItem = (idx: number) => {
    const item = scrambleItems[idx];
    if (!item) {
      initSentenceItem(0);
      setStage('sentence');
      return;
    }
    const letters = item.word.split('').map((char, i) => ({
      id: `${char}_${i}_${Math.random()}`,
      char,
      used: false
    }));
    // Shuffle letters ensuring not exact word
    let shuffled = [...letters].sort(() => Math.random() - 0.5);
    if (shuffled.map(l => l.char).join('') === item.word && letters.length > 2) {
      shuffled = shuffled.reverse();
    }
    setScrambledLetters(shuffled);
    setPickedSlots([]);
    setScrambleStatus('playing');
    speakEnglish(item.word);
  };

  const handlePickLetter = (item: { id: string; char: string }) => {
    if (scrambleStatus !== 'playing') return;
    soundEffects.playClick();
    setScrambledLetters(prev => prev.map(l => l.id === item.id ? { ...l, used: true } : l));
    const nextPicked = [...pickedSlots, item];
    setPickedSlots(nextPicked);

    const currentTarget = scrambleItems[currentScrambleIdx];
    if (nextPicked.length === currentTarget.word.length) {
      const spelled = nextPicked.map(p => p.char).join('');
      if (spelled === currentTarget.word) {
        soundEffects.playSuccess();
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (newStreak > maxStreak) setMaxStreak(newStreak);
        setScore(s => s + 120 + newStreak * 25);
        setScrambleStatus('correct');
        speakEnglish(currentTarget.word);
      } else {
        soundEffects.playError();
        setStreak(0);
        setScrambleStatus('wrong');
      }
    }
  };

  const handleRemoveLetter = (index: number) => {
    if (scrambleStatus !== 'playing') return;
    soundEffects.playClick();
    const removed = pickedSlots[index];
    setPickedSlots(prev => prev.filter((_, i) => i !== index));
    setScrambledLetters(prev => prev.map(l => l.id === removed.id ? { ...l, used: false } : l));
  };

  const handleNextScramble = () => {
    soundEffects.playClick();
    if (currentScrambleIdx < scrambleItems.length - 1) {
      const nextIdx = currentScrambleIdx + 1;
      setCurrentScrambleIdx(nextIdx);
      initScrambleItem(nextIdx);
    } else {
      initSentenceItem(0);
      setStage('sentence');
    }
  };

  // -------------------------------------------------------------
  // STAGE 3: SENTENCE BUILDER HANDLERS
  // -------------------------------------------------------------
  const initSentenceItem = (idx: number) => {
    const item = sentenceItems[idx];
    if (!item) {
      setStage('quiz');
      return;
    }
    // Take words and ensure they are scrambled / shuffled, not in original order
    const rawWords = [...item.challenge.scrambledWords];
    let shuffled = [...rawWords].sort(() => Math.random() - 0.5);

    // If shuffled order happens to equal original or if lengths > 1, guarantee permutation
    const originalJoined = rawWords.join(' ');
    let attempts = 0;
    while (shuffled.join(' ') === originalJoined && rawWords.length > 1 && attempts < 5) {
      shuffled = [...rawWords].sort(() => Math.random() - 0.5);
      attempts++;
    }
    // Fallback: reverse if still equal
    if (shuffled.join(' ') === originalJoined && rawWords.length > 1) {
      shuffled = [...rawWords].reverse();
    }

    const words = shuffled.map((w, i) => ({
      id: `${w}_${i}_${Math.random()}`,
      word: w,
      used: false
    }));
    setAvailableWords(words);
    setUserWords([]);
    setSentenceStatus('playing');
  };

  const handlePickWord = (wordItem: { id: string; word: string }) => {
    if (sentenceStatus !== 'playing') return;
    soundEffects.playClick();
    setAvailableWords(prev => prev.map(w => w.id === wordItem.id ? { ...w, used: true } : w));
    setUserWords(prev => [...prev, wordItem]);
  };

  const handleRemoveWord = (index: number) => {
    if (sentenceStatus !== 'playing') return;
    soundEffects.playClick();
    const removed = userWords[index];
    setUserWords(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => prev.map(w => w.id === removed.id ? { ...w, used: false } : w));
  };

  const handleCheckSentence = () => {
    const target = sentenceItems[currentSentenceIdx];
    if (!target) return;
    const constructed = userWords.map(w => w.word).join(' ').trim();
    const isCorrect = constructed.toLowerCase() === target.challenge.correctSentence.trim().toLowerCase();

    if (isCorrect) {
      soundEffects.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setScore(s => s + 150 + newStreak * 30);
      setSentenceStatus('correct');
      speakEnglish(target.challenge.correctSentence);
    } else {
      soundEffects.playError();
      setStreak(0);
      setSentenceStatus('wrong');
    }
  };

  const handleNextSentence = () => {
    soundEffects.playClick();
    if (currentSentenceIdx < sentenceItems.length - 1) {
      const nextIdx = currentSentenceIdx + 1;
      setCurrentSentenceIdx(nextIdx);
      initSentenceItem(nextIdx);
    } else {
      setStage('quiz');
      setCurrentQuizIdx(0);
      setSelectedQuizOpt(null);
      setIsQuizAnswered(false);
    }
  };

  // -------------------------------------------------------------
  // STAGE 4: GRAND QUIZ HANDLERS
  // -------------------------------------------------------------
  const currentQuiz = quizQuestions[currentQuizIdx];

  const handleSelectQuiz = (idx: number) => {
    if (isQuizAnswered || !currentQuiz) return;
    setSelectedQuizOpt(idx);
    setIsQuizAnswered(true);

    const isCorrect = idx === currentQuiz.quiz.answerIndex;
    if (isCorrect) {
      soundEffects.playSuccess();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
      setScore(s => s + 150 + newStreak * 25);

      // If the option is in English, speak it
      const optionText = currentQuiz.quiz.options[idx];
      speakEnglish(optionText);
    } else {
      soundEffects.playError();
      setStreak(0);
    }
  };

  const handleNextQuiz = () => {
    soundEffects.playClick();
    if (currentQuizIdx < quizQuestions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedQuizOpt(null);
      setIsQuizAnswered(false);
    } else {
      handleFinishChallenge();
    }
  };

  // -------------------------------------------------------------
  // FINISH CHALLENGE
  // -------------------------------------------------------------
  const handleFinishChallenge = () => {
    soundEffects.playVictory();
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.55 }
    });
    setStage('finished');
  };

  const calculateStars = () => {
    // Total potential points around 1800 - 2500
    if (score >= 1500) return 3;
    if (score >= 900) return 2;
    return 1;
  };

  // =============================================================
  // RENDER INTRO SCREEN
  // =============================================================
  if (stage === 'intro') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-orange-500/20 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-5xl shadow-md animate-bounce">
            🏆
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-bold text-2xl sm:text-4xl">
              Đấu trường thử thách ⚡
            </h1>
            <p className="text-white/90 text-sm sm:text-base max-w-lg mx-auto font-medium">
              Chinh phục 4 chặng thi tổng hợp kiến thức từ <strong>tất cả {units.length} Unit</strong> trong chương trình giáo khoa Tiếng Anh Global Success Lớp {grade}!
            </p>
          </div>

          {/* 4 Rounds Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-slate-800 text-center">
            <div className="bg-white/90 rounded-2xl p-3 border border-white shadow-xs">
              <span className="text-xl">🔤</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Chặng 1</p>
              <p className="text-[11px] text-slate-500">Từ vựng siêu tốc</p>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 border border-white shadow-xs">
              <span className="text-xl">🧩</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Chặng 2</p>
              <p className="text-[11px] text-slate-500">Ghép từ giải đố</p>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 border border-white shadow-xs">
              <span className="text-xl">✍️</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Chặng 3</p>
              <p className="text-[11px] text-slate-500">Xếp câu giao tiếp</p>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 border border-white shadow-xs">
              <span className="text-xl">⚡</span>
              <p className="text-xs font-bold text-slate-800 mt-1">Chặng 4</p>
              <p className="text-[11px] text-slate-500">Trắc nghiệm đỉnh cao</p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={initChallenge}
              className="px-8 py-3.5 rounded-2xl bg-white text-orange-600 font-display font-bold text-base sm:text-lg shadow-lg shadow-black/10 hover:bg-amber-50 active:scale-95 transition cursor-pointer"
            >
              Bắt đầu thử thách ngay 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =============================================================
  // RENDER FINISHED SCREEN
  // =============================================================
  if (stage === 'finished') {
    const stars = calculateStars();

    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-5xl">
          👑
        </div>

        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">
            Hoàn thành xuất sắc
          </span>
          <h2 className="font-display font-bold text-2xl text-slate-800 mt-1">
            Quán quân lớp {grade}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bạn đã vượt qua toàn bộ các câu hỏi tổng hợp của Lớp {grade}!
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-10 h-10 ${
                starIdx <= stars
                  ? 'fill-amber-400 text-amber-500 animate-bounce'
                  : 'text-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Score & Streak stats */}
        <div className="grid grid-cols-2 gap-3 bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div>
            <span className="text-xs font-bold text-slate-500 block">Tổng điểm:</span>
            <span className="font-display font-bold text-2xl text-amber-600">
              {score}
            </span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 block">Combo kỷ lục:</span>
            <span className="font-display font-bold text-2xl text-orange-600">
              x{maxStreak}
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={initChallenge}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Chơi lại
          </button>
          <button
            onClick={() => {
              onComplete(stars);
              onBack();
            }}
            className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Nhận Thưởng ✨
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  // ACTIVE GAME STAGES
  // =============================================================
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => {
            soundEffects.playClick();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4" /> Rời thử thách
        </button>

        {/* Stage Pill */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            {stage === 'vocab' && `Chặng 1: Học từ (${currentVocabIdx + 1}/5)`}
            {stage === 'scramble' && `Chặng 2: Ghép từ (${currentScrambleIdx + 1}/${scrambleItems.length})`}
            {stage === 'sentence' && `Chặng 3: Xếp câu (${currentSentenceIdx + 1}/${sentenceItems.length})`}
            {stage === 'quiz' && `Chặng 4: Trắc nghiệm (${currentQuizIdx + 1}/5)`}
          </span>
        </div>

        {/* Score & Streak */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="flex items-center gap-1 text-orange-500">
            <Zap className="w-3.5 h-3.5 fill-orange-400" /> x{streak}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            {score} đ
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CHẶNG 1: VOCABULARY */}
      {/* ========================================================= */}
      {stage === 'vocab' && currentVocab && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-lg space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Từ vựng Unit {currentVocab.unitNum}
            </span>
            <div className="flex items-center justify-center gap-2">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-slate-800">
                {currentVocab.word}
              </h2>
              <button
                type="button"
                onClick={() => speakEnglish(currentVocab.word)}
                className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                title="Phát âm tiếng Anh chuẩn"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => speakEnglishSlow(currentVocab.word)}
                className="px-2.5 py-2 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                title="Phát âm tiếng Anh chậm"
              >
                <Snail className="w-4 h-4 text-teal-600" />
                <span className="text-[11px] hidden sm:inline">Chậm</span>
              </button>
            </div>
            <p className="text-xs font-mono text-amber-600">
              {currentVocab.phonetic}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentVocab.options.map((opt, i) => {
              const isSelected = selectedVocabOpt === i;
              const isCorrect = i === currentVocab.answerIndex;
              let style = 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 text-slate-800';

              if (isVocabAnswered) {
                if (isCorrect) style = 'bg-emerald-500 border-emerald-500 text-white';
                else if (isSelected) style = 'bg-rose-500 border-rose-500 text-white';
                else style = 'opacity-40 bg-slate-100 border-slate-200 text-slate-400';
              }

              return (
                <button
                  key={i}
                  disabled={isVocabAnswered}
                  onClick={() => handleSelectVocab(i)}
                  className={`p-4 rounded-2xl border-2 font-display font-bold text-sm sm:text-base text-left transition flex items-center justify-between cursor-pointer ${style}`}
                >
                  <span>{opt}</span>
                  {isVocabAnswered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                  {isVocabAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>

          {isVocabAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextVocab}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Tiếp tục ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CHẶNG 2: SCRAMBLE */}
      {/* ========================================================= */}
      {stage === 'scramble' && scrambleItems[currentScrambleIdx] && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-lg space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Unit {scrambleItems[currentScrambleIdx].unitNum} • Ghép các chữ cái
            </span>
            <h3 className="font-display font-bold text-xl text-slate-800">
              {scrambleItems[currentScrambleIdx].meaning}
            </h3>
            <p className="text-xs font-mono text-amber-600">
              {scrambleItems[currentScrambleIdx].phonetic}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => speakEnglish(scrambleItems[currentScrambleIdx].word)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                title="Nghe phát âm chuẩn"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" /> Nghe chuẩn
              </button>
              <button
                type="button"
                onClick={() => speakEnglishSlow(scrambleItems[currentScrambleIdx].word)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                title="Nghe phát âm chậm"
              >
                <Snail className="w-3.5 h-3.5 text-teal-600" /> Nghe chậm
              </button>
            </div>
          </div>

          {/* Slots */}
          <div className="flex justify-center gap-2 flex-wrap min-h-[52px]">
            {scrambleItems[currentScrambleIdx].word.split('').map((_, i) => {
              const filled = pickedSlots[i];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => filled && handleRemoveLetter(i)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-2 font-display font-bold text-lg flex items-center justify-center transition cursor-pointer ${
                    filled
                      ? scrambleStatus === 'correct'
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : scrambleStatus === 'wrong'
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-amber-400 text-white border-amber-400'
                      : 'border-dashed border-slate-300 bg-slate-50 text-slate-300'
                  }`}
                >
                  {filled ? filled.char.toUpperCase() : ''}
                </button>
              );
            })}
          </div>

          {/* Scrambled Letters Pool */}
          <div className="flex justify-center gap-2 flex-wrap pt-2">
            {scrambledLetters.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.used || scrambleStatus !== 'playing'}
                onClick={() => handlePickLetter(item)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl font-display font-bold text-base transition cursor-pointer ${
                  item.used
                    ? 'opacity-20 bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 hover:border-amber-400 text-slate-700 shadow-xs active:scale-95'
                }`}
              >
                {item.char.toUpperCase()}
              </button>
            ))}
          </div>

          {scrambleStatus !== 'playing' && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextScramble}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Chặng tiếp theo ➔
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* CHẶNG 3: SENTENCE CONSTRUCTOR */}
      {/* ========================================================= */}
      {stage === 'sentence' && sentenceItems[currentSentenceIdx] && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-lg space-y-6">
          <div className="text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Unit {sentenceItems[currentSentenceIdx].unitNum} • Sắp xếp câu đúng ngữ pháp
            </span>
            <h3 className="font-display font-bold text-lg text-slate-800">
              {sentenceItems[currentSentenceIdx].challenge.vietnameseMeaning}
            </h3>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => speakEnglish(sentenceItems[currentSentenceIdx].challenge.correctSentence)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                title="Nghe mẫu câu chuẩn"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" /> Nghe chuẩn
              </button>
              <button
                type="button"
                onClick={() => speakEnglishSlow(sentenceItems[currentSentenceIdx].challenge.correctSentence)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                title="Nghe mẫu câu chậm"
              >
                <Snail className="w-3.5 h-3.5 text-teal-600" /> Nghe chậm
              </button>
            </div>
          </div>

          {/* Constructed Words Area */}
          <div className="min-h-[56px] p-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-wrap gap-2 items-center justify-center">
            {userWords.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Nhấn các từ bên dưới để ghép thành câu...</span>
            ) : (
              userWords.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRemoveWord(i)}
                  className={`px-3 py-1.5 rounded-xl font-display font-bold text-sm cursor-pointer ${
                    sentenceStatus === 'correct'
                      ? 'bg-emerald-500 text-white'
                      : sentenceStatus === 'wrong'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-400 text-white hover:bg-amber-500'
                  }`}
                >
                  {item.word}
                </button>
              ))
            )}
          </div>

          {/* Available Words Pool */}
          <div className="flex flex-wrap gap-2 justify-center">
            {availableWords.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.used || sentenceStatus !== 'playing'}
                onClick={() => handlePickWord(item)}
                className={`px-3.5 py-1.5 rounded-xl font-display font-bold text-sm border-2 transition cursor-pointer ${
                  item.used
                    ? 'opacity-20 bg-slate-200 border-slate-200 text-slate-400'
                    : 'bg-white border-slate-200 hover:border-amber-400 text-slate-800 shadow-xs'
                }`}
              >
                {item.word}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {sentenceStatus === 'playing' ? (
              <button
                disabled={userWords.length === 0}
                onClick={handleCheckSentence}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                Kiểm tra câu ✨
              </button>
            ) : (
              <button
                onClick={handleNextSentence}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Tiếp tục ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CHẶNG 4: GRAND QUIZ */}
      {/* ========================================================= */}
      {stage === 'quiz' && currentQuiz && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-lg space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Unit {currentQuiz.unitNum} • Trắc nghiệm tổng hợp
            </span>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-800 leading-snug">
                {currentQuiz.quiz.question}
              </h2>
              {(() => {
                const enMatch = currentQuiz.quiz.question.match(/"([^"]+)"|'([^']+)'/);
                const textToSpeak = enMatch ? (enMatch[1] || enMatch[2]) : null;
                if (!textToSpeak) return null;
                return (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => speakEnglish(textToSpeak)}
                      className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                      title="Nghe chuẩn"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => speakEnglishSlow(textToSpeak)}
                      className="px-2 py-1.5 rounded-xl bg-teal-50 text-teal-800 hover:bg-teal-100 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                      title="Nghe chậm"
                    >
                      <Snail className="w-3.5 h-3.5 text-teal-600" />
                      <span className="text-[10px] hidden sm:inline">Chậm</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuiz.quiz.options.map((opt, i) => {
              const isSelected = selectedQuizOpt === i;
              const isCorrect = i === currentQuiz.quiz.answerIndex;
              let style = 'bg-slate-50 hover:bg-amber-50/80 border-slate-200 text-slate-800';

              if (isQuizAnswered) {
                if (isCorrect) style = 'bg-emerald-500 border-emerald-500 text-white';
                else if (isSelected) style = 'bg-rose-500 border-rose-500 text-white';
                else style = 'opacity-40 bg-slate-100 border-slate-200 text-slate-400';
              }

              return (
                <button
                  key={i}
                  disabled={isQuizAnswered}
                  onClick={() => handleSelectQuiz(i)}
                  className={`p-4 rounded-2xl border-2 font-display font-bold text-sm sm:text-base text-left transition flex items-center justify-between cursor-pointer ${style}`}
                >
                  <span>{opt}</span>
                  {isQuizAnswered && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                  {isQuizAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                </button>
              );
            })}
          </div>

          {isQuizAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuiz}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-display font-bold text-sm shadow-md shadow-amber-500/20 cursor-pointer"
              >
                {currentQuizIdx < quizQuestions.length - 1 ? 'Câu tiếp theo ➔' : 'Xem Kết Quả 🏆'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
