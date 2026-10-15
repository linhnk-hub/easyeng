import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Volume2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
  RotateCcw,
  HelpCircle,
  Headphones,
  BookOpen,
  Filter
} from 'lucide-react';
import { ExerciseCluster, ExerciseQuestion } from '../../types';
import { soundEffects } from '../../services/soundEffects';
import { speechService } from '../../services/speechService';

interface ExerciseClusterRunnerProps {
  cluster: ExerciseCluster;
  grade: number;
  onComplete: (score: number, maxScore: number, stars: number) => void;
  onBack: () => void;
}

export const ExerciseClusterRunner: React.FC<ExerciseClusterRunnerProps> = ({
  cluster,
  grade,
  onComplete,
  onBack
}) => {
  const allQuestions: ExerciseQuestion[] = cluster.questions || [];

  // Extract unique units for filtering
  const availableUnits = useMemo(() => {
    const map = new Map<number, string>();
    allQuestions.forEach(q => {
      if (q.unitNumber !== undefined) {
        const title = q.unitTitle || (q.unitNumber === 0 ? 'Self-check 1' : `Unit ${q.unitNumber}`);
        map.set(q.unitNumber, title);
      }
    });
    return Array.from(map.entries()).map(([num, title]) => ({ num, title }));
  }, [allQuestions]);

  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');

  // Filtered questions based on selected unit
  const questions = useMemo(() => {
    if (selectedUnitFilter === 'all') return allQuestions;
    return allQuestions.filter(q => q.unitNumber === selectedUnitFilter);
  }, [allQuestions, selectedUnitFilter]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Reset question state when index changes
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowExplanation(false);
    setIsPlayingAudio(false);
  }, [currentIndex, selectedUnitFilter]);

  // Handle changing unit filter
  const handleFilterChange = (unitNum: number | 'all') => {
    soundEffects.playClick();
    setSelectedUnitFilter(unitNum);
    setCurrentIndex(0);
    setScore(0);
    setIsFinished(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQuestion.answerIndex;
    if (isCorrect) {
      soundEffects.playSuccess();
      setScore(prev => prev + 1);
    } else {
      soundEffects.playError();
    }
    setShowExplanation(true);
  };

  const handlePlayAudioTrack = () => {
    if (!currentQuestion?.audioTranscript) return;
    soundEffects.playClick();
    setIsPlayingAudio(true);
    speechService.speak(currentQuestion.audioTranscript);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 4000);
  };

  const handleNext = () => {
    soundEffects.playClick();
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finished
      const finalScore = score + (selectedOption === currentQuestion?.answerIndex ? 0 : 0);
      const total = Math.max(1, questions.length);
      const pct = (finalScore / total) * 100;
      let stars = 1;
      if (pct >= 85) stars = 3;
      else if (pct >= 60) stars = 2;

      setIsFinished(true);
      soundEffects.playVictory();
      onComplete(finalScore, total, stars);
    }
  };

  const handleRestart = () => {
    soundEffects.playClick();
    setCurrentIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setIsFinished(false);
    setShowExplanation(false);
  };

  if (!currentQuestion && !isFinished) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-3xl mx-auto">
          📝
        </div>
        <h3 className="font-display font-bold text-xl text-slate-800">
          Chưa tìm thấy câu hỏi bài tập
        </h3>
        <p className="text-sm text-slate-500">
          Quản trị viên có thể tải lên tệp JSON câu hỏi bài tập từ tài liệu PDF trong mục Quản lý hệ thống ➔ Quản lý JSON.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // FINISHED SCREEN
  if (isFinished) {
    const total = Math.max(1, questions.length);
    const pct = Math.round((score / total) * 100);
    let stars = 1;
    if (pct >= 85) stars = 3;
    else if (pct >= 60) stars = 2;

    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-300 shadow-xl text-center space-y-6 animate-scale-up">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-4xl mx-auto shadow-md text-white">
          🏆
        </div>

        <div>
          <span className="text-xs font-bold text-purple-700 uppercase tracking-widest bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Hoàn thành xuất sắc
          </span>
          <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-800 mt-2">
            {cluster.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chương trình Bài tập Tiếng Anh Lớp {grade}
            {selectedUnitFilter !== 'all' && ` • Lọc theo Unit ${selectedUnitFilter}`}
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 text-3xl sm:text-4xl">
          <span className={stars >= 1 ? 'text-amber-400' : 'text-slate-200'}>⭐</span>
          <span className={stars >= 2 ? 'text-amber-400' : 'text-slate-200'}>⭐</span>
          <span className={stars >= 3 ? 'text-amber-400' : 'text-slate-200'}>⭐</span>
        </div>

        {/* Score Box */}
        <div className="bg-purple-50/80 rounded-2xl p-4 border border-purple-200 flex items-center justify-around">
          <div>
            <span className="text-xs text-purple-800 font-medium block">Số câu đúng</span>
            <span className="font-display font-extrabold text-2xl text-purple-900">
              {score} / {total}
            </span>
          </div>
          <div className="w-px h-10 bg-purple-200" />
          <div>
            <span className="text-xs text-purple-800 font-medium block">Tỷ lệ chính xác</span>
            <span className="font-display font-extrabold text-2xl text-purple-900">
              {pct}%
            </span>
          </div>
          <div className="w-px h-10 bg-purple-200" />
          <div>
            <span className="text-xs text-purple-800 font-medium block">Điểm XP</span>
            <span className="font-display font-extrabold text-2xl text-purple-700">
              +{score * 15} XP
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRestart}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Làm lại học phần này
          </button>
          <button
            onClick={onBack}
            className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-display font-bold text-sm rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2"
          >
            Về danh sách bài tập ➔
          </button>
        </div>
      </div>
    );
  }

  // QUESTION SCREEN
  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-2xs">
        <button
          onClick={onBack}
          className="self-start sm:self-auto p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <div className="text-center min-w-0 flex-1">
          <span className="text-xs font-bold text-purple-700 block truncate">
            {cluster.title} • Lớp {grade}
          </span>
          <span className="font-display font-extrabold text-sm text-slate-800">
            Câu {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>{score} điểm</span>
        </div>
      </div>

      {/* Unit Selector Pills (if cluster contains multiple units) */}
      {availableUnits.length > 1 && (
        <div className="bg-white/80 backdrop-blur-xs p-2 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 px-2 shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            Lọc bài:
          </span>
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedUnitFilter === 'all'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({allQuestions.length})
          </button>
          {availableUnits.map(u => {
            const count = allQuestions.filter(q => q.unitNumber === u.num).length;
            return (
              <button
                key={u.num}
                onClick={() => handleFilterChange(u.num)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  selectedUnitFilter === u.num
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u.num === 0 ? 'Self-check 1' : `Unit ${u.num}`} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-slate-200/80 shadow-sm space-y-5">
        {/* Category & Section Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {currentQuestion.unitTitle && (
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                {currentQuestion.unitTitle}
              </span>
            )}
            {currentQuestion.sectionTitle && (
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Phần {currentQuestion.sectionId}: {currentQuestion.sectionTitle}
              </span>
            )}
          </div>

          {currentQuestion.instructionVi && (
            <span className="text-[11px] font-semibold text-slate-500 italic">
              📌 {currentQuestion.instructionVi}
            </span>
          )}
        </div>

        {/* Reading Passage if available */}
        {currentQuestion.readingPassage && (
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1.5 shadow-2xs">
            <div className="font-bold flex items-center gap-1.5 text-amber-800 uppercase tracking-wider text-[11px]">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Đoạn văn / Hội thoại bài đọc:</span>
            </div>
            <p className="whitespace-pre-line leading-relaxed italic bg-white/70 p-3 rounded-xl border border-amber-100 font-serif">
              "{currentQuestion.readingPassage}"
            </p>
          </div>
        )}

        {/* Image Description Clue if available */}
        {currentQuestion.imageDescription && (
          <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
            <span className="text-base shrink-0">🖼️</span>
            <div>
              <span className="font-bold block text-sky-800">Gợi ý hình ảnh trong sách:</span>
              <span className="leading-relaxed">{currentQuestion.imageDescription}</span>
            </div>
          </div>
        )}

        {/* Simulated Audio Track Button if available */}
        {currentQuestion.audioTranscript && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block">
                  Nghe và trả lời
                </span>
                <span className="text-[11px] text-purple-700 block">
                  {isAnswered
                    ? `Nội dung đoạn nghe: "${currentQuestion.audioTranscript}"`
                    : 'Bấm nút "Nghe audio" bên cạnh để lắng nghe và chọn câu trả lời đúng'}
                </span>
              </div>
            </div>

            <button
              onClick={handlePlayAudioTrack}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95 ${
                isPlayingAudio ? 'bg-indigo-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? 'Đang phát...' : 'Nghe audio'}</span>
            </button>
          </div>
        )}

        {/* Question Prompt */}
        <div className="space-y-2">
          <h3 className="font-display font-bold text-lg sm:text-xl text-slate-800 leading-snug whitespace-pre-line">
            {currentQuestion.question}
          </h3>

          {currentQuestion.hint && (
            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Gợi ý: {currentQuestion.hint}</span>
            </p>
          )}
        </div>

        {/* Options Grid */}
        <div className={`grid gap-3 ${
          (currentQuestion.options || []).length <= 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
        }`}>
          {(currentQuestion.options || []).map((opt, optIdx) => {
            const isSelected = selectedOption === optIdx;
            const isCorrect = optIdx === currentQuestion.answerIndex;
            const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
            const letter = optionLetters[optIdx] || `${optIdx + 1}`;

            let btnStyle = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';

            if (isAnswered) {
              if (isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 text-emerald-900 font-bold';
              } else if (isSelected && !isCorrect) {
                btnStyle = 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/40 text-rose-900 line-through';
              } else {
                btnStyle = 'bg-white border-slate-200 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                disabled={isAnswered}
                className={`p-4 rounded-2xl border-2 text-left font-medium text-sm sm:text-base transition-all flex items-center justify-between gap-3 cursor-pointer ${btnStyle} ${
                  !isAnswered ? 'active:scale-98' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-8 h-8 rounded-xl font-display font-extrabold text-xs flex items-center justify-center shrink-0 ${
                    isAnswered && isCorrect
                      ? 'bg-emerald-500 text-white'
                      : isAnswered && isSelected && !isCorrect
                      ? 'bg-rose-500 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
                  }`}>
                    {letter}
                  </span>
                  <span className="break-words leading-relaxed">{opt}</span>
                </div>

                {isAnswered && isCorrect && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Banner */}
        {showExplanation && (
          <div className={`p-4 rounded-2xl border text-xs sm:text-sm animate-fade-in ${
            selectedOption === currentQuestion.answerIndex
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
              : 'bg-amber-50/90 border-amber-300 text-amber-900'
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                {selectedOption === currentQuestion.answerIndex ? 'Chính xác! 🎉' : 'Chưa đúng rồi! Hãy xem lời giải:'}
              </span>
            </div>
            <p className="leading-relaxed">
              {currentQuestion.explanation || `Đáp án đúng là lựa chọn: ${currentQuestion.options?.[currentQuestion.answerIndex || 0] || 'Đáp án đúng'}`}
            </p>
          </div>
        )}

        {/* Action Next Button */}
        {isAnswered && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-display font-bold text-base rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 animate-bounce-subtle"
            >
              <span>{currentIndex + 1 < questions.length ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
              <span>➔</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
