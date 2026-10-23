import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Star, Volume2, Snail, Timer, Zap, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UnitData } from '../../types';
import { speechService } from '../../services/speechService';
import { soundEffects } from '../../services/soundEffects';

interface MemoryCard {
  id: string;
  pairId: string;
  type: 'english' | 'vietnamese';
  text: string;
  subText?: string;
  emoji?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryGameProps {
  unit: UnitData;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({
  unit,
  onComplete,
  onBack
}) => {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [streak, setStreak] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // Initialize deck
  const initializeGame = () => {
    // Pick 6 items from unit vocabulary (or all if < 6)
    const selectedVocab = [...unit.vocabulary]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(6, unit.vocabulary.length));

    setTotalPairs(selectedVocab.length);

    const deck: MemoryCard[] = [];

    selectedVocab.forEach((voc, index) => {
      // English card
      deck.push({
        id: `en-${index}`,
        pairId: `pair-${index}`,
        type: 'english',
        text: voc.word,
        subText: voc.phonetic,
        emoji: voc.imageEmoji,
        isFlipped: false,
        isMatched: false
      });

      // Vietnamese card
      deck.push({
        id: `vi-${index}`,
        pairId: `pair-${index}`,
        type: 'vietnamese',
        text: voc.meaning,
        emoji: voc.imageEmoji,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle
    setCards(deck.sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setStreak(0);
    setSeconds(0);
    setTimerActive(true);
    setGameWon(false);
    speechService.cancel();
  };

  useEffect(() => {
    speechService.cancel();
    return () => {
      speechService.cancel();
    };
  }, []);

  useEffect(() => {
    initializeGame();
  }, [unit]);

  // Timer
  useEffect(() => {
    let interval: number | null = null;
    if (timerActive && !gameWon) {
      interval = window.setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, gameWon]);

  // Card click handler
  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }

    soundEffects.playFlip();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, index];
    setFlippedCards(newFlipped);

    // If card is English, speak it
    if (cards[index].type === 'english') {
      speechService.speakNormal(cards[index].text);
    }

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setMoves(m => m + 1);

      const [firstIdx, secondIdx] = newFlipped;
      const card1 = newCards[firstIdx];
      const card2 = newCards[secondIdx];

      if (card1.pairId === card2.pairId) {
        // MATCH!
        setTimeout(() => {
          soundEffects.playSuccess();
          const newStreak = streak + 1;
          setStreak(newStreak);
          soundEffects.playStreak(newStreak);

          const matchedCards = [...newCards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setFlippedCards([]);
          setIsChecking(false);

          const updatedMatches = matches + 1;
          setMatches(updatedMatches);

          if (updatedMatches === totalPairs) {
            handleVictory();
          }
        }, 500);
      } else {
        // MISMATCH!
        setTimeout(() => {
          soundEffects.playError();
          setStreak(0);
          const resetCards = [...newCards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setFlippedCards([]);
          setIsChecking(false);
        }, 900);
      }
    }
  };

  const calculateStars = () => {
    const perfectMoves = totalPairs * 2 + 2;
    if (moves <= perfectMoves) return 3;
    if (moves <= perfectMoves + 5) return 2;
    return 1;
  };

  const handleVictory = () => {
    setTimerActive(false);
    setGameWon(true);
    soundEffects.playVictory();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const starsEarned = calculateStars();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">
            Unit {unit.displayUnit || unit.unit} • {unit.title}
          </span>
          <span className="font-display font-bold text-slate-800 text-base sm:text-lg">
            🃏 Lật thẻ
          </span>
        </div>

        <button
          onClick={() => {
            soundEffects.playClick();
            initializeGame();
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm cursor-pointer shadow-xs transition"
          title="Chơi lại ván mới"
        >
          <RotateCcw className="w-4 h-4" /> Chơi lại
        </button>
      </div>

      {/* Game Stats Bar */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs text-center">
        <div>
          <span className="block text-xs font-semibold text-slate-400">Thời gian</span>
          <span className="font-display font-bold text-slate-800 text-base sm:text-lg flex items-center justify-center gap-1">
            <Timer className="w-4 h-4 text-amber-500" /> {formatTime(seconds)}
          </span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400">Lượt lật</span>
          <span className="font-display font-bold text-slate-800 text-base sm:text-lg">
            {moves}
          </span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400">Đã ghép</span>
          <span className="font-display font-bold text-emerald-600 text-base sm:text-lg">
            {matches} / {totalPairs}
          </span>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400">Combo</span>
          <span className="font-display font-bold text-orange-500 text-base sm:text-lg flex items-center justify-center gap-0.5">
            <Zap className="w-4 h-4 fill-orange-400" /> x{streak}
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card, index) => {
          const isFlipped = card.isFlipped || card.isMatched;

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className="h-28 sm:h-36 perspective-1000 cursor-pointer select-none"
            >
              <div
                className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Back of Card (Hidden Face) */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 rounded-2xl shadow-md border-2 border-amber-300 flex flex-col items-center justify-center text-white p-2 hover:scale-[1.02] transition-transform">
                  <span className="text-2xl sm:text-3xl drop-shadow-xs">✨</span>
                  <span className="text-[11px] font-display font-bold mt-1 opacity-90">EasyEng</span>
                </div>

                {/* Front of Card (Revealed Face) */}
                <div
                  className={`absolute inset-0 backface-hidden rotate-y-180 rounded-2xl p-2.5 sm:p-3 shadow-md flex flex-col items-center justify-center text-center transition-all ${
                    card.isMatched
                      ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-900 shadow-emerald-500/10'
                      : card.type === 'english'
                      ? 'bg-sky-50 border-2 border-sky-300 text-sky-900'
                      : 'bg-amber-50 border-2 border-amber-300 text-amber-900'
                  }`}
                >
                  {card.emoji && (
                    <span className="text-xl sm:text-2xl mb-1">{card.emoji}</span>
                  )}
                  <p className="font-display font-bold text-xs sm:text-sm leading-tight">
                    {card.text}
                  </p>
                  {card.subText && (
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {card.subText}
                    </p>
                  )}
                  {card.type === 'english' && (
                    <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          speechService.speakNormal(card.text);
                        }}
                        className="p-1 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-700 transition cursor-pointer"
                        title="Nghe chuẩn"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          soundEffects.playClick();
                          speechService.speakSlowly(card.text);
                        }}
                        className="p-1 rounded-md bg-teal-100 hover:bg-teal-200 text-teal-800 transition cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                        title="Nghe chậm"
                      >
                        <Snail className="w-3 h-3 text-teal-700" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Victory Modal */}
      {gameWon && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-float">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-3xl">
              🏆
            </div>
            <h3 className="font-display font-bold text-2xl text-slate-800">
              Tuyệt vời! Bạn có trí nhớ siêu phàm!
            </h3>
            <p className="text-slate-600 text-sm">
              Bạn đã hoàn thành trong <strong>{formatTime(seconds)}</strong> với <strong>{moves}</strong> lượt lật!
            </p>
            <div className="flex items-center justify-center gap-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < starsEarned
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
                  initializeGame();
                }}
                className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 cursor-pointer"
              >
                Chơi lại
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  onComplete(starsEarned);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md shadow-rose-500/20 cursor-pointer"
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
