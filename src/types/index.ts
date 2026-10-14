export interface VocabularyItem {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  category?: string;
  imageEmoji?: string;
}

export interface SentencePattern {
  pattern: string;
  usage: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface SentenceChallenge {
  scrambledWords: string[];
  correctSentence: string;
  vietnameseMeaning: string;
}

export interface UnitData {
  unit: number;
  book: "Phần 1" | "Phần 2" | "Tập 1" | "Tập 2";
  title: string;
  emoji: string;
  color: string;
  vocabulary: VocabularyItem[];
  sentencePatterns: SentencePattern[];
  quizzes: QuizQuestion[];
  sentenceChallenges?: SentenceChallenge[];
}

export interface UserProfile {
  learnerId: 'ty' | 'na' | string;
  grade: number;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  totalStars: number;
  unlockedBadges: string[];
  completedUnits: { [unitNumber: number]: {
    flashcardsDone: boolean;
    flashcardStars?: number;
    memoryStars: number;
    wordScrambleStars: number;
    sentenceStars: number;
    quizStars: number;
  } };
  currentStreak: number;
  highestStreak?: number;
  lastActiveDate: string;
  pin?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  reqSummary: string;
}
