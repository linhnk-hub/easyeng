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
  fullName?: string;
  nickname?: string;
  username?: string;
  phone?: string;
  email?: string;
  customAvatarUrl?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  reqSummary: string;
}

export interface ExerciseQuestion {
  id?: string | number;
  question: string;
  options?: string[];
  answerIndex?: number;
  answer?: string | number;
  correctAnswer?: string | number;
  explanation?: string;
  type?: 'quiz' | 'fill' | 'matching' | 'word' | 'sentence' | 'true_false' | 'sentence_reorder' | 'listen' | string;
  category?: string;
  unitNumber?: number;
  unitTitle?: string;
  sectionId?: string;
  sectionTitle?: string;
  instructionEn?: string;
  instructionVi?: string;
  vietnameseMeaning?: string;
  hint?: string;
  word?: string;
  phonetic?: string;
  meaning?: string;
  example?: string;
  correctSentence?: string;
  scrambledWords?: string[];
  imageDescription?: string;
  imageUrl?: string;
  audioTranscript?: string;
  readingPassage?: string;
  fullCompletedText?: string;
  shuffledParts?: string[];
  pairs?: Array<{ left: string; right: string }>;
}

export interface ExerciseCluster {
  id: string;
  clusterNumber: number;
  title: string;
  description?: string;
  grade: number;
  questions: ExerciseQuestion[];
  rawJson?: string;
  itemsCount: number;
  unitsCount?: number;
  totalRawQuestions?: number;
  skippedImageQuestions?: number;
  skippedAudioQuestions?: number;
  updatedAt?: string;
}

export interface PasswordResetRequest {
  id: string;
  fullName?: string;
  username?: string;
  nickname?: string;
  phone: string;
  email: string;
  createdAt: string;
  status?: 'pending' | 'resolved';
}

export interface AccountVerificationRequest {
  id: string;
  learnerId?: string;
  fullName?: string;
  username?: string;
  nickname?: string;
  phone: string;
  email: string;
  createdAt: string;
  status?: 'pending' | 'resolved';
  deviceInfo?: string;
}

export interface UserActiveSession {
  learnerId: string;
  username?: string;
  nickname?: string;
  sessionId: string;
  deviceId: string;
  deviceDescription: string;
  isLoggedIn: boolean;
  loginAt: string;
  lastHeartbeat: string;
  terminatedAt?: string;
  terminationReason?: string;
  terminatedMessage?: string;
  loggedOutAt?: string;
}

