/**
 * EasyEng - Tiếng Anh dễ mà!
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UnitData, UserProfile, ExerciseCluster } from './types';
import { DEFAULT_UNITS_DATA } from './data/unitsData';
import { GRADE_7_UNITS_DATA } from './data/unitsGrade7Data';
import { Header } from './components/Header';
import { UnitSelector } from './components/UnitSelector';
import { LoginScreen } from './components/LoginScreen';
import { LearnerSelectScreen } from './components/LearnerSelectScreen';
import { FlashcardGame } from './components/games/FlashcardGame';
import { MemoryGame } from './components/games/MemoryGame';
import { WordScrambleGame } from './components/games/WordScrambleGame';
import { SentenceBuilderGame } from './components/games/SentenceBuilderGame';
import { QuizArenaGame } from './components/games/QuizArenaGame';
import { ComprehensiveChallengeGame } from './components/games/ComprehensiveChallengeGame';
import { ExerciseClusterRunner } from './components/games/ExerciseClusterRunner';
import { BadgesModal } from './components/BadgesModal';
import { AvatarModal } from './components/AvatarModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { soundEffects } from './services/soundEffects';
import { speechService, VoiceGender } from './services/speechService';
import { CustomAvatarItem } from './utils/avatarUtils';
import { resolveValidUsername } from './utils/userUtils';
import { getDefaultGradeEmoji, getDefaultGradeDescription, ALL_12_GRADES, getGradeLevelName, normalizeGradeUnits } from './utils/gradeUtils';
import { createDefaultClusters } from './utils/exerciseUtils';
import { calculateUpdatedStreak } from './utils/streakUtils';
import { calculateLevelFromXp } from './data/ranksData';
import { ShieldAlert } from 'lucide-react';
import {
  testConnection,
  syncLearnerToCloud,
  subscribeToLearners,
  fetchLearnersFromCloud,
  deleteLearnerFromCloud,
  syncCustomAvatarToCloud,
  deleteCustomAvatarFromCloud,
  fetchCustomAvatarsFromCloud,
  syncCurriculumToCloud,
  fetchCurriculumFromCloud,
  subscribeToCurriculum,
  syncClassToCloud,
  syncAllClassesToCloud,
  deleteClassFromCloud,
  fetchClassesFromCloud,
  subscribeToClasses,
  syncBrandingToCloud,
  fetchBrandingFromCloud,
  subscribeToBranding,
  syncExercisesToCloud,
  fetchExercisesFromCloud,
  subscribeToExercises,
  clearAccountActiveSession,
  updateSessionHeartbeat,
  checkLearnerActiveSession,
  subscribeToLearnerActiveSession
} from './services/firebase';
import { getOrCreateDeviceId } from './utils/sessionUtils';
import { fireGrandFireworks } from './utils/confettiFireworks';

const STORAGE_KEY_ACTIVE_LEARNER = 'easyeng_active_learner_id_v3';
const STORAGE_KEY_LEARNERS = 'easyeng_learners_list_v3';
const STORAGE_KEY_CLASSES = 'easyeng_classes_list_v3';
const STORAGE_KEY_CURRICULUM = 'easyeng_curriculum_map_v3';
const STORAGE_KEY_CUSTOM_AVATARS = 'easyeng_custom_avatars_v3';
const STORAGE_KEY_EXERCISES = 'easyeng_grade_exercises_v3';

interface ClassItem {
  grade: number;
  name: string;
  description: string;
  emoji: string;
}

const DEFAULT_CLASSES: ClassItem[] = ALL_12_GRADES.map(g => ({
  grade: g,
  name: `Lớp ${g}`,
  description: getDefaultGradeDescription(g),
  emoji: getDefaultGradeEmoji(g)
}));

function getDefaultUnitsForGrade(grade: number): UnitData[] {
  if (grade === 4) return DEFAULT_UNITS_DATA;
  if (grade === 7) return GRADE_7_UNITS_DATA;

  return [
    {
      unit: 1,
      book: "Phần 1",
      title: `Tiếng Anh Lớp ${grade} - Unit 1: Welcome`,
      emoji: getDefaultGradeEmoji(grade),
      color: "from-amber-500 to-orange-600",
      vocabulary: [
        {
          word: "welcome",
          phonetic: "/ˈwelkəm/",
          meaning: "chào mừng",
          example: `Welcome to Grade ${grade}!`,
          exampleMeaning: `Chào mừng đến với Lớp ${grade}!`
        },
        {
          word: "student",
          phonetic: "/ˈstjuːdnt/",
          meaning: "học sinh",
          example: "I am an active student.",
          exampleMeaning: "Tôi là một học sinh năng động."
        },
        {
          word: "teacher",
          phonetic: "/ˈtiːtʃə(r)/",
          meaning: "thầy cô giáo",
          example: "She is our English teacher.",
          exampleMeaning: "Cô ấy là giáo viên tiếng Anh của chúng tôi."
        },
        {
          word: "practice",
          phonetic: "/ˈpræktɪs/",
          meaning: "luyện tập",
          example: "Practice English every day.",
          exampleMeaning: "Hãy luyện tập tiếng Anh mỗi ngày."
        },
        {
          word: "lesson",
          phonetic: "/ˈlesn/",
          meaning: "bài học",
          example: "This is our first lesson.",
          exampleMeaning: "Đây là bài học đầu tiên của chúng ta."
        }
      ],
      sentencePatterns: [
        {
          pattern: `Welcome to Grade ${grade}!`,
          usage: "Lời chào đầu năm học"
        },
        {
          pattern: "Nice to see you again!",
          usage: "Rất vui được gặp lại bạn"
        }
      ],
      quizzes: [
        {
          question: `Welcome to Grade ${grade} nghĩa là gì?`,
          options: [`Chào mừng đến với Lớp ${grade}!`, "Tạm biệt bạn nhé!", "Cảm ơn bạn rất nhiều!", "Chúc ngủ ngon!"],
          answerIndex: 0,
          explanation: `Welcome nghĩa là chào mừng, Grade ${grade} là Lớp ${grade}.`
        },
        {
          question: "'Practice' có nghĩa là gì?",
          options: ["Luyện tập", "Nghỉ ngơi", "Đi ngủ", "Ăn cơm"],
          answerIndex: 0,
          explanation: "Practice nghĩa là luyện tập, thực hành."
        }
      ]
    }
  ];
}

function computeLearnerBadges(
  completedUnits: { [unitId: number]: any },
  currentBadges: string[],
  units: UnitData[]
): string[] {
  const badges: string[] = [];
  const targetUnits = units && units.length > 0 ? units : DEFAULT_UNITS_DATA;

  // 1. "Bước Chân Đầu Tiên" (first_word)
  const hasStartedAnyUnit = Object.values(completedUnits || {}).some(
    (u: any) =>
      (Number(u.flashcardStars) || 0) > 0 ||
      (Number(u.memoryStars) || 0) > 0 ||
      (Number(u.wordScrambleStars) || 0) > 0 ||
      (Number(u.sentenceStars) || 0) > 0 ||
      (Number(u.quizStars) || 0) > 0 ||
      u.flashcardsDone
  );
  if (hasStartedAnyUnit || currentBadges.includes('first_word')) {
    badges.push('first_word');
  }

  // 2. "Trí nhớ siêu phàm" (memory_champion): yêu cầu đạt thắng Lật thẻ 3 sao với tất cả các Unit
  const allMemory3Stars =
    targetUnits.length > 0 &&
    targetUnits.every(u => (Number(completedUnits?.[u.unit]?.memoryStars) || 0) === 3);
  if (allMemory3Stars) {
    badges.push('memory_champion');
  }

  // 3. "Dũng sĩ ghép từ" (spelling_hero): yêu cầu ghép đúng 3 sao với tất cả các Unit
  const allScramble3Stars =
    targetUnits.length > 0 &&
    targetUnits.every(u => (Number(completedUnits?.[u.unit]?.wordScrambleStars) || 0) === 3);
  if (allScramble3Stars) {
    badges.push('spelling_hero');
  }

  // 4. "Bậc thầy cú pháp" (sentence_master): ghép đúng 3 sao tất cả các Unit
  const allSentence3Stars =
    targetUnits.length > 0 &&
    targetUnits.every(u => (Number(completedUnits?.[u.unit]?.sentenceStars) || 0) === 3);
  if (allSentence3Stars) {
    badges.push('sentence_master');
  }

  // 5. "Trạng nguyên tiếng Anh" (quiz_scholar): đạt 3 sao điểm trắc nghiệm tất cả các Unit
  const allQuiz3Stars =
    targetUnits.length > 0 &&
    targetUnits.every(u => (Number(completedUnits?.[u.unit]?.quizStars) || 0) === 3);
  if (allQuiz3Stars) {
    badges.push('quiz_scholar');
  }

  // 6. "Đại Sứ Toàn Năng" (volume2_grad): Hoàn thành toàn bộ Unit của chương trình học
  const allUnitsCompleted =
    targetUnits.length > 0 &&
    targetUnits.every(u => {
      const cu = completedUnits?.[u.unit];
      return (
        cu &&
        ((Number(cu.flashcardStars) || 0) > 0 ||
          (Number(cu.memoryStars) || 0) > 0 ||
          (Number(cu.wordScrambleStars) || 0) > 0 ||
          (Number(cu.sentenceStars) || 0) > 0 ||
          (Number(cu.quizStars) || 0) > 0 ||
          cu.flashcardsDone)
      );
    });
  if (allUnitsCompleted) {
    badges.push('volume2_grad');
  }

  return badges;
}

export default function App() {
  // Learners list: Start empty if nothing in localStorage, to wait for Cloud Firestore data
  const [learners, setLearners] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEARNERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((l: UserProfile) => ({
            ...l,
            username: resolveValidUsername(l.username, l.name)
          }));
        }
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [isLoadingLearners, setIsLoadingLearners] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LEARNERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      } catch {}
    }
    return true;
  });

  // Custom Uploaded Avatars
  const [customAvatars, setCustomAvatars] = useState<CustomAvatarItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_AVATARS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Active Learner ID
  const [activeLearnerId, setActiveLearnerId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_LEARNER);
    if (saved) return saved;
    return null;
  });

  // Hộp thoại thông báo khi phiên đăng nhập bị ngắt do xác minh trên thiết bị lạ
  const [sessionTerminatedNotice, setSessionTerminatedNotice] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('easyeng_session_terminated_notice') || null;
    } catch {
      return null;
    }
  });

  const handleSetSessionNotice = (msg: string | null) => {
    setSessionTerminatedNotice(msg);
    try {
      if (msg) {
        sessionStorage.setItem('easyeng_session_terminated_notice', msg);
      } else {
        sessionStorage.removeItem('easyeng_session_terminated_notice');
      }
    } catch {}
  };

  // Classes list
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CLASSES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return DEFAULT_CLASSES;
  });

  // Built-in static app logo (loads instantly at 0ms from public/app-logo.png)
  const DEFAULT_APP_LOGO = '/app-logo.png';

  // Custom App Logo (PNG/JPG/SVG/URL or fallback to built-in logo)
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('easyeng_custom_logo') || DEFAULT_APP_LOGO;
  });

  const handleUpdateLogo = (newLogo: string | null) => {
    if (newLogo) {
      localStorage.setItem('easyeng_custom_logo', newLogo);
      setCustomLogo(newLogo);
    } else {
      localStorage.setItem('easyeng_custom_logo', DEFAULT_APP_LOGO);
      setCustomLogo(DEFAULT_APP_LOGO);
    }
  };

  // Logo sizes (Header navigation bar: 174px and Welcome / Learner selection screen: 270px)
  const DEFAULT_HEADER_LOGO_SIZE = 174; // px
  const DEFAULT_WELCOME_LOGO_SIZE = 270; // px

  const [headerLogoSize, setHeaderLogoSize] = useState<number>(() => {
    const saved = localStorage.getItem('easyeng_header_logo_size');
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 20 && num <= 300) {
        if (num === 44 || num === 200) return DEFAULT_HEADER_LOGO_SIZE; // Upgrade legacy defaults
        return num;
      }
    }
    return DEFAULT_HEADER_LOGO_SIZE;
  });

  const [welcomeLogoSize, setWelcomeLogoSize] = useState<number>(() => {
    const saved = localStorage.getItem('easyeng_welcome_logo_size');
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 24 && num <= 400) {
        if (num === 48 || num === 300) return DEFAULT_WELCOME_LOGO_SIZE; // Upgrade legacy defaults
        return num;
      }
    }
    return DEFAULT_WELCOME_LOGO_SIZE;
  });

  const handleSaveLogoSizes = (headerSize: number, welcomeSize: number) => {
    setHeaderLogoSize(headerSize);
    setWelcomeLogoSize(welcomeSize);
    localStorage.setItem('easyeng_header_logo_size', headerSize.toString());
    localStorage.setItem('easyeng_welcome_logo_size', welcomeSize.toString());
  };

  const handleSaveBranding = async (newLogo: string | null, headerSize: number, welcomeSize: number): Promise<boolean> => {
    setHeaderLogoSize(headerSize);
    setWelcomeLogoSize(welcomeSize);
    setCustomLogo(newLogo);

    if (newLogo) {
      localStorage.setItem('easyeng_custom_logo', newLogo);
    } else {
      localStorage.removeItem('easyeng_custom_logo');
    }
    localStorage.setItem('easyeng_header_logo_size', headerSize.toString());
    localStorage.setItem('easyeng_welcome_logo_size', welcomeSize.toString());

    try {
      const ok = await syncBrandingToCloud({
        customLogo: newLogo,
        headerLogoSize: headerSize,
        welcomeLogoSize: welcomeSize
      });
      return ok;
    } catch (err) {
      console.warn('Sync branding to cloud notice:', err);
      return false;
    }
  };

  // Curriculum map { [grade: number]: UnitData[] }
  const [gradeUnitsMap, setGradeUnitsMap] = useState<Record<number, UnitData[]>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CURRICULUM);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const normalizedMap: Record<number, UnitData[]> = {};
          Object.entries(parsed).forEach(([gStr, uList]) => {
            const g = Number(gStr);
            if (Array.isArray(uList)) {
              normalizedMap[g] = normalizeGradeUnits(uList as UnitData[]);
            }
          });
          return normalizedMap;
        }
      } catch {
        // fallback
      }
    }
    return {
      4: DEFAULT_UNITS_DATA,
      7: GRADE_7_UNITS_DATA
    };
  });

  // Exercise clusters (học phần) map { [grade: number]: ExerciseCluster[] }
  const [gradeExercisesMap, setGradeExercisesMap] = useState<Record<number, ExerciseCluster[]>>(() => {
    const defaultOfficial = {
      4: createDefaultClusters(4, 4),
      7: createDefaultClusters(7, 4)
    };

    const saved = localStorage.getItem(STORAGE_KEY_EXERCISES);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Chỉ khởi tạo mặc định nếu key 4 hoặc 7 hoàn toàn undefined (chưa từng được cấu hình hay lưu)
          if (parsed[4] === undefined) {
            parsed[4] = defaultOfficial[4];
          }
          if (parsed[7] === undefined) {
            parsed[7] = defaultOfficial[7];
          }
          return parsed;
        }
      } catch {
        // fallback
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(defaultOfficial));
    } catch {}
    return defaultOfficial;
  });

  // Active exercise cluster when learner is practicing
  const [activeExerciseCluster, setActiveExerciseCluster] = useState<ExerciseCluster | null>(null);
  // Current main learning tab: 'textbook' (SGK) or 'exercises' (Bài tập)
  const [learningMode, setLearningMode] = useState<'textbook' | 'exercises'>('textbook');

  // Active learner profile
  const currentUser = activeLearnerId ? (learners.find(l => l.learnerId === activeLearnerId) || null) : null;

  // Active curriculum units for current learner's grade
  const currentUnits = (currentUser && gradeUnitsMap[currentUser.grade]) || (
    currentUser ? getDefaultUnitsForGrade(currentUser.grade) : DEFAULT_UNITS_DATA
  );

  // Active exercise clusters for current learner's grade
  const currentExercises = (currentUser && gradeExercisesMap[currentUser.grade] !== undefined)
    ? gradeExercisesMap[currentUser.grade]
    : (currentUser ? createDefaultClusters(currentUser.grade, 4) : []);

  // Selected Unit
  const [selectedUnit, setSelectedUnit] = useState<UnitData>(() => currentUnits[0] || DEFAULT_UNITS_DATA[0]);

  // Audio & Voice States
  const [soundOn, setSoundOn] = useState(() => soundEffects.isSoundEnabled());
  const [bgmOn, setBgmOn] = useState(false);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => speechService.getVoiceGender());

  // Modals
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showGameExitModal, setShowGameExitModal] = useState(false);

  // Active Game Mode
  const [activeGame, setActiveGame] = useState<'none' | 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz' | 'challenge'>('none');

  // Keep selectedUnit in sync when switching learner / grade or when currentUnits update
  useEffect(() => {
    if (currentUnits.length > 0) {
      const stillExists = currentUnits.some(u => u.unit === selectedUnit?.unit);
      if (!stillExists || !selectedUnit) {
        setSelectedUnit(currentUnits[0]);
      }
    }
    setActiveGame('none');
  }, [activeLearnerId, currentUser?.grade, currentUnits]);

  // Save learners to localStorage only (never auto-create on cloud!)
  useEffect(() => {
    if (learners.length > 0) {
      localStorage.setItem(STORAGE_KEY_LEARNERS, JSON.stringify(learners));
    }
  }, [learners]);

  // Real-time synchronization from Cloud Firestore across all devices
  useEffect(() => {
    testConnection();

    // Fetch custom avatars from cloud
    fetchCustomAvatarsFromCloud().then(cloudAvatars => {
      if (cloudAvatars && cloudAvatars.length > 0) {
        setCustomAvatars(prev => {
          const merged = [...cloudAvatars];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) merged.push(p);
          });
          return merged;
        });
      }
    }).catch(err => {
      console.warn('Fetch custom avatars notice:', err);
    });

    // 1. Fetch & sync custom classes from Cloud Firestore
    fetchClassesFromCloud().then(cloudClasses => {
      if (cloudClasses && cloudClasses.length > 0) {
        setClasses(cloudClasses.sort((a, b) => a.grade - b.grade));
      } else {
        // If Cloud Firestore is empty, seed Cloud Firestore with current local classes!
        const saved = localStorage.getItem(STORAGE_KEY_CLASSES);
        let localClassesToSeed = DEFAULT_CLASSES;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) localClassesToSeed = parsed;
          } catch {}
        }
        syncAllClassesToCloud(localClassesToSeed).catch(err => {
          console.warn('Seed classes to cloud notice:', err);
        });
      }
    }).catch(err => {
      console.warn('Fetch classes notice:', err);
    });

    // Real-time subscription to classes across all devices
    const unsubscribeClasses = subscribeToClasses((cloudClasses) => {
      if (cloudClasses && cloudClasses.length > 0) {
        setClasses(cloudClasses.sort((a, b) => a.grade - b.grade));
      }
    });

    // 2. Fetch & sync custom curriculum from Cloud Firestore
    fetchCurriculumFromCloud().then(cloudCurriculum => {
      if (cloudCurriculum && Object.keys(cloudCurriculum).length > 0) {
        const normalizedMap: Record<number, UnitData[]> = {};
        Object.entries(cloudCurriculum).forEach(([gradeStr, units]) => {
          const g = Number(gradeStr);
          if (Array.isArray(units)) {
            const normalized = normalizeGradeUnits(units);
            normalizedMap[g] = normalized;

            // Nếu dữ liệu trên mây có unit chưa chuẩn (ví dụ book: 'Sách học sinh' hay trống), đồng bộ ngược bản chuẩn lên Firestore
            const hasLegacyBook = units.some(u => !u.book || (u.book as string) === 'Sách học sinh' || (u.book as string) === 'SGK');
            if (hasLegacyBook) {
              console.log(`Auto-repairing grade ${g} curriculum book fields to Cloud Firestore...`);
              syncCurriculumToCloud(g, normalized).catch(() => {});
            }
          }
        });

        setGradeUnitsMap(prev => ({
          ...prev,
          ...normalizedMap
        }));
      }

      // Auto-sync any imported curriculum from local storage (e.g. Grade 9 with 12 units) up to Cloud Firestore
      const savedCurr = localStorage.getItem(STORAGE_KEY_CURRICULUM);
      if (savedCurr) {
        try {
          const parsed = JSON.parse(savedCurr);
          if (parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([gradeStr, units]) => {
              const g = Number(gradeStr);
              if (Array.isArray(units) && units.length > 0) {
                const cloudUnits = cloudCurriculum ? cloudCurriculum[g] : undefined;
                if (!cloudUnits || cloudUnits.length < units.length) {
                  console.log(`Auto-syncing grade ${g} curriculum (${units.length} units) to Cloud Firestore...`);
                  const normalized = normalizeGradeUnits(units as UnitData[]);
                  syncCurriculumToCloud(g, normalized).catch(err => {
                    console.warn(`Auto-sync grade ${g} notice:`, err);
                  });
                }
              }
            });
          }
        } catch {}
      }
    }).catch(err => {
      console.warn('Fetch curriculum notice:', err);
    });

    // Real-time subscription to curriculum across all devices
    const unsubscribeCurriculum = subscribeToCurriculum((cloudCurriculum) => {
      if (cloudCurriculum && Object.keys(cloudCurriculum).length > 0) {
        const normalizedMap: Record<number, UnitData[]> = {};
        Object.entries(cloudCurriculum).forEach(([gradeStr, units]) => {
          const g = Number(gradeStr);
          if (Array.isArray(units)) {
            normalizedMap[g] = normalizeGradeUnits(units);
          }
        });
        setGradeUnitsMap(prev => ({
          ...prev,
          ...normalizedMap
        }));
      }
    });

    // 3. Fetch learners from Cloud Firestore
    fetchLearnersFromCloud().then(cloudList => {
      setIsLoadingLearners(false);
      if (cloudList && cloudList.length > 0) {
        const normalized = cloudList.map(l => {
          const lUnits = gradeUnitsMap[l.grade] || getDefaultUnitsForGrade(l.grade);
          return {
            ...l,
            username: resolveValidUsername(l.username, l.name),
            level: calculateLevelFromXp(l.xp || 0),
            unlockedBadges: computeLearnerBadges(l.completedUnits, l.unlockedBadges || [], lUnits)
          };
        });
        setLearners(normalized);
      }
    }).catch(err => {
      setIsLoadingLearners(false);
      console.warn('Initial fetch from cloud notice:', err);
    });

    // Real-time subscription to cloud learners
    const unsubscribeLearners = subscribeToLearners((cloudLearners) => {
      setIsLoadingLearners(false);
      if (cloudLearners && cloudLearners.length > 0) {
        const normalized = cloudLearners.map(l => {
          const lUnits = gradeUnitsMap[l.grade] || getDefaultUnitsForGrade(l.grade);
          return {
            ...l,
            username: resolveValidUsername(l.username, l.name),
            level: calculateLevelFromXp(l.xp || 0),
            unlockedBadges: computeLearnerBadges(l.completedUnits, l.unlockedBadges || [], lUnits)
          };
        });
        setLearners(normalized);
      }
    });

    // 4. Fetch & subscribe to branding (logo & sizes) from Cloud Firestore
    fetchBrandingFromCloud().then(cloudBranding => {
      if (cloudBranding) {
        if (cloudBranding.customLogo !== undefined) {
          setCustomLogo(cloudBranding.customLogo);
          if (cloudBranding.customLogo) {
            localStorage.setItem('easyeng_custom_logo', cloudBranding.customLogo);
          } else {
            localStorage.removeItem('easyeng_custom_logo');
          }
        }
        if (cloudBranding.headerLogoSize) {
          const hSize = cloudBranding.headerLogoSize === 44 ? DEFAULT_HEADER_LOGO_SIZE : cloudBranding.headerLogoSize;
          setHeaderLogoSize(hSize);
          localStorage.setItem('easyeng_header_logo_size', String(hSize));
        }
        if (cloudBranding.welcomeLogoSize) {
          const wSize = cloudBranding.welcomeLogoSize === 48 ? DEFAULT_WELCOME_LOGO_SIZE : cloudBranding.welcomeLogoSize;
          setWelcomeLogoSize(wSize);
          localStorage.setItem('easyeng_welcome_logo_size', String(wSize));
        }
      } else {
        // If not in cloud yet, auto-sync any existing local branding to Cloud Firestore
        const savedLogo = localStorage.getItem('easyeng_custom_logo');
        const savedHeaderSize = localStorage.getItem('easyeng_header_logo_size');
        const savedWelcomeSize = localStorage.getItem('easyeng_welcome_logo_size');
        if (savedLogo || savedHeaderSize || savedWelcomeSize) {
          syncBrandingToCloud({
            customLogo: savedLogo || null,
            headerLogoSize: savedHeaderSize ? Number(savedHeaderSize) : DEFAULT_HEADER_LOGO_SIZE,
            welcomeLogoSize: savedWelcomeSize ? Number(savedWelcomeSize) : DEFAULT_WELCOME_LOGO_SIZE
          }).catch(() => {});
        }
      }
    }).catch(err => {
      console.warn('Fetch branding notice:', err);
    });

    const unsubscribeBranding = subscribeToBranding((cloudBranding) => {
      if (cloudBranding) {
        if (cloudBranding.customLogo !== undefined) {
          setCustomLogo(cloudBranding.customLogo);
          if (cloudBranding.customLogo) {
            localStorage.setItem('easyeng_custom_logo', cloudBranding.customLogo);
          } else {
            localStorage.removeItem('easyeng_custom_logo');
          }
        }
        if (cloudBranding.headerLogoSize) {
          const hSize = cloudBranding.headerLogoSize === 44 ? DEFAULT_HEADER_LOGO_SIZE : cloudBranding.headerLogoSize;
          setHeaderLogoSize(hSize);
          localStorage.setItem('easyeng_header_logo_size', String(hSize));
        }
        if (cloudBranding.welcomeLogoSize) {
          const wSize = cloudBranding.welcomeLogoSize === 48 ? DEFAULT_WELCOME_LOGO_SIZE : cloudBranding.welcomeLogoSize;
          setWelcomeLogoSize(wSize);
          localStorage.setItem('easyeng_welcome_logo_size', String(wSize));
        }
      }
    });

    const mergeSafeExercises = (
      cloudData: Record<number, ExerciseCluster[]>,
      prevMap: Record<number, ExerciseCluster[]>
    ): Record<number, ExerciseCluster[]> => {
      const result = { ...prevMap };
      Object.keys(cloudData).forEach(gk => {
        const g = Number(gk);
        const cloudClusters = cloudData[g];
        if (Array.isArray(cloudClusters)) {
          result[g] = cloudClusters;
        }
      });

      // Chỉ khởi tạo mặc định nếu khối lớp 4 hoặc 7 chưa từng được định nghĩa (undefined)
      if (result[4] === undefined) {
        result[4] = createDefaultClusters(4, 4);
        syncExercisesToCloud(4, result[4]).catch(() => {});
      }
      if (result[7] === undefined) {
        result[7] = createDefaultClusters(7, 4);
        syncExercisesToCloud(7, result[7]).catch(() => {});
      }

      try {
        localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(result));
      } catch {}

      return result;
    };

    // 5. Fetch & subscribe to custom exercise clusters from Cloud Firestore
    fetchExercisesFromCloud().then(cloudExercises => {
      setGradeExercisesMap(prev => mergeSafeExercises(cloudExercises || {}, prev));
    }).catch(err => {
      console.warn('Fetch exercises notice:', err);
    });

    const unsubscribeExercises = subscribeToExercises((cloudExercises) => {
      if (cloudExercises && Object.keys(cloudExercises).length > 0) {
        setGradeExercisesMap(prev => mergeSafeExercises(cloudExercises, prev));
      }
    });

    const handleSyncCheck = () => {
      fetchLearnersFromCloud().then(cloudList => {
        if (cloudList && cloudList.length > 0) setLearners(cloudList);
      }).catch(() => {});
      fetchClassesFromCloud().then(cloudClasses => {
        if (cloudClasses && cloudClasses.length > 0) setClasses(cloudClasses.sort((a, b) => a.grade - b.grade));
      }).catch(() => {});
      fetchCurriculumFromCloud().then(cloudCurriculum => {
        if (cloudCurriculum && Object.keys(cloudCurriculum).length > 0) {
          setGradeUnitsMap(prev => ({ ...prev, ...cloudCurriculum }));
        }
      }).catch(() => {});
      fetchExercisesFromCloud().then(cloudExercises => {
        if (cloudExercises && Object.keys(cloudExercises).length > 0) {
          setGradeExercisesMap(prev => mergeSafeExercises(cloudExercises, prev));
        }
      }).catch(() => {});
      fetchBrandingFromCloud().then(cloudBranding => {
        if (cloudBranding) {
          if (cloudBranding.customLogo !== undefined) setCustomLogo(cloudBranding.customLogo);
          if (cloudBranding.headerLogoSize) {
            const hSize = cloudBranding.headerLogoSize === 44 ? DEFAULT_HEADER_LOGO_SIZE : cloudBranding.headerLogoSize;
            setHeaderLogoSize(hSize);
          }
          if (cloudBranding.welcomeLogoSize) {
            const wSize = cloudBranding.welcomeLogoSize === 48 ? DEFAULT_WELCOME_LOGO_SIZE : cloudBranding.welcomeLogoSize;
            setWelcomeLogoSize(wSize);
          }
        }
      }).catch(() => {});
    };

    window.addEventListener('focus', handleSyncCheck);
    document.addEventListener('visibilitychange', handleSyncCheck);

    return () => {
      unsubscribeLearners();
      unsubscribeClasses();
      unsubscribeCurriculum();
      unsubscribeBranding();
      unsubscribeExercises();
      window.removeEventListener('focus', handleSyncCheck);
      document.removeEventListener('visibilitychange', handleSyncCheck);
    };
  }, []);

  // Save custom avatars to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOM_AVATARS, JSON.stringify(customAvatars));
  }, [customAvatars]);

  // Save classes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
  }, [classes]);

  // Save curriculum to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CURRICULUM, JSON.stringify(gradeUnitsMap));
  }, [gradeUnitsMap]);

  // Save exercises to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(gradeExercisesMap));
  }, [gradeExercisesMap]);

  const handleSaveExercises = async (grade: number, clusters: ExerciseCluster[]): Promise<boolean> => {
    setGradeExercisesMap(prev => {
      const updated = { ...prev, [grade]: clusters };
      localStorage.setItem(STORAGE_KEY_EXERCISES, JSON.stringify(updated));
      return updated;
    });
    return await syncExercisesToCloud(grade, clusters);
  };

  const handleExerciseClusterComplete = (score: number, maxScore: number, starsEarned: number) => {
    if (!currentUser) return;
    const addedXp = score * 15;
    const newXp = currentUser.xp + addedXp;
    const newLevel = calculateLevelFromXp(newXp);
    const newTotalStars = currentUser.totalStars + starsEarned;

    const streakResult = calculateUpdatedStreak(
      currentUser.currentStreak,
      currentUser.lastActiveDate,
      currentUser.highestStreak
    );

    const updatedUser: UserProfile = {
      ...currentUser,
      xp: newXp,
      level: newLevel,
      totalStars: newTotalStars,
      currentStreak: streakResult.currentStreak,
      highestStreak: streakResult.highestStreak,
      lastActiveDate: new Date().toISOString()
    };

    setLearners(prev => prev.map(l => l.learnerId === updatedUser.learnerId ? updatedUser : l));
    syncLearnerToCloud(updatedUser).catch(() => {});
  };

  // Save active learner ID
  useEffect(() => {
    if (activeLearnerId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_LEARNER, activeLearnerId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_LEARNER);
    }
  }, [activeLearnerId]);

  // Session heartbeat & Single-device enforcement:
  // Lắng nghe realtime onSnapshot (< 1s), kiểm tra khi F5, window focus/visibility và định kỳ gửi nhịp tim an toàn
  useEffect(() => {
    if (!activeLearnerId) return;

    const deviceId = getOrCreateDeviceId();

    const triggerTermination = (message?: string) => {
      console.warn('Active session revoked: ', message);
      soundEffects.playError();
      setActiveLearnerId(null);
      setActiveGame('none');
      try {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_LEARNER);
        localStorage.removeItem('easyeng_current_session_id');
      } catch {}
      handleSetSessionNotice(
        message ||
        'Phiên đăng nhập này sẽ bị ngắt do có yêu cầu xác minh tình trạng đăng nhập trên thiết bị lạ'
      );
    };

    // Hàm kiểm tra tính hợp lệ của phiên làm việc hiện tại
    const validateSessionNow = async () => {
      if (!activeLearnerId) return;
      try {
        const curSessId = localStorage.getItem('easyeng_current_session_id');
        const res = await checkLearnerActiveSession(activeLearnerId, deviceId, curSessId);
        if (res.isTerminated || res.isConflict) {
          triggerTermination(res.terminationMessage);
          return;
        }
        updateSessionHeartbeat(activeLearnerId, deviceId, curSessId);
      } catch (err) {
        console.warn('validateSessionNow error:', err);
      }
    };

    // 1. Kiểm tra phiên ban đầu (đặc biệt khi F5 tải lại trang)
    validateSessionNow();

    // 2. Lắng nghe thay đổi phiên thời gian thực (onSnapshot < 1 giây)
    const unsubscribeSession = subscribeToLearnerActiveSession(activeLearnerId, (session) => {
      if (!session) return;
      const curSessId = localStorage.getItem('easyeng_current_session_id');

      // Nếu phiên bị Admin mở khóa hoặc thiết bị khác đã đăng nhập
      const isTerminated =
        !session.isLoggedIn ||
        session.terminationReason === 'admin_unlocked' ||
        session.terminationReason === 'device_conflict' ||
        (curSessId && session.sessionId && session.sessionId !== curSessId);

      if (isTerminated) {
        triggerTermination(
          session.terminatedMessage ||
          'Phiên đăng nhập này sẽ bị ngắt do có yêu cầu xác minh tình trạng đăng nhập trên thiết bị lạ'
        );
      }
    });

    // 3. Kiểm tra ngay lập tức khi người dùng quay lại tab trình duyệt hoặc focus
    const handleFocus = () => {
      validateSessionNow();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        validateSessionNow();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // 4. Polling nhanh định kỳ mỗi 5 giây để đảm bảo phát hiện ngay cả khi mạng lag hoặc WebSocket gián đoạn
    const pollTimer = setInterval(() => {
      validateSessionNow();
    }, 5000);

    // 5. Gửi nhịp tim (heartbeat) định kỳ mỗi 30 giây
    const heartbeatTimer = setInterval(() => {
      const curSessId = localStorage.getItem('easyeng_current_session_id');
      updateSessionHeartbeat(activeLearnerId, deviceId, curSessId);
    }, 30 * 1000);

    return () => {
      unsubscribeSession();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollTimer);
      clearInterval(heartbeatTimer);
    };
  }, [activeLearnerId]);

  // Audio Toggles
  const handleToggleSound = () => {
    const next = !soundOn;
    soundEffects.setSoundEnabled(next);
    setSoundOn(next);
  };

  const handleToggleBgm = () => {
    if (bgmOn) {
      soundEffects.stopBgm();
      setBgmOn(false);
    } else {
      soundEffects.startBgm();
      setBgmOn(true);
    }
  };

  const handleToggleVoiceGender = () => {
    const next: VoiceGender = voiceGender === 'female' ? 'male' : 'female';
    speechService.setVoiceGender(next);
    setVoiceGender(next);
  };

  const handleSelectLearner = (learnerId: string) => {
    handleSetSessionNotice(null);
    setActiveLearnerId(learnerId);
    setActiveGame('none');

    // Automatically check and increment daily consecutive streak when entering learner profile
    setLearners(prev => {
      const target = prev.find(l => l.learnerId === learnerId);
      if (!target) return prev;

      const streakRes = calculateUpdatedStreak(
        target.currentStreak,
        target.lastActiveDate,
        target.highestStreak
      );
      const correctLevel = calculateLevelFromXp(target.xp);

      if (streakRes.streakUpdated || !target.lastActiveDate || target.level !== correctLevel) {
        const updated: UserProfile = {
          ...target,
          level: correctLevel,
          currentStreak: streakRes.currentStreak,
          highestStreak: streakRes.highestStreak,
          lastActiveDate: new Date().toISOString()
        };
        syncLearnerToCloud(updated).catch(() => {});
        return prev.map(l => l.learnerId === learnerId ? updated : l);
      }
      return prev;
    });
  };

  const handleSwitchLearner = () => {
    soundEffects.playClick();
    if (activeLearnerId) {
      clearAccountActiveSession(activeLearnerId, 'logged_out').catch(() => {});
    }
    try {
      localStorage.removeItem('easyeng_current_session_id');
    } catch {}
    setActiveLearnerId(null);
    setActiveGame('none');
  };

  const handleSaveAndExit = () => {
    soundEffects.playSuccess();
    setShowExitModal(false);
    if (activeLearnerId) {
      clearAccountActiveSession(activeLearnerId, 'logged_out').catch(() => {});
    }
    try {
      localStorage.removeItem('easyeng_current_session_id');
    } catch {}
    setActiveLearnerId(null);
    setActiveGame('none');
  };

  const handleLaunchGame = (unit: UnitData, gameType: 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz') => {
    speechService.cancel();
    setSelectedUnit(unit);
    setActiveGame(gameType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGameComplete = (starsEarned: number) => {
    if (!currentUser) return;
    const unitNum = selectedUnit.unit;
    const existingUnitStats = currentUser.completedUnits[unitNum] || 
      (currentUser.completedUnits as any)?.[String(unitNum)] || {
        flashcardsDone: false,
        flashcardStars: 0,
        memoryStars: 0,
        wordScrambleStars: 0,
        sentenceStars: 0,
        quizStars: 0,
      };

    const updatedStats = { ...existingUnitStats };
    let prevStarsForThisGame = 0;

    if (activeGame === 'flashcards') {
      prevStarsForThisGame = existingUnitStats.flashcardStars !== undefined
        ? Number(existingUnitStats.flashcardStars)
        : (existingUnitStats.flashcardsDone ? 1 : 0);
      if (starsEarned > prevStarsForThisGame) {
        updatedStats.flashcardStars = starsEarned;
      } else {
        updatedStats.flashcardStars = Math.max(prevStarsForThisGame, starsEarned);
      }
      updatedStats.flashcardsDone = (updatedStats.flashcardStars > 0);
    } else if (activeGame === 'memory') {
      prevStarsForThisGame = Number(existingUnitStats.memoryStars || 0);
      if (starsEarned > prevStarsForThisGame) {
        updatedStats.memoryStars = starsEarned;
      }
    } else if (activeGame === 'wordScramble') {
      prevStarsForThisGame = Number(existingUnitStats.wordScrambleStars || 0);
      if (starsEarned > prevStarsForThisGame) {
        updatedStats.wordScrambleStars = starsEarned;
      }
    } else if (activeGame === 'sentence') {
      prevStarsForThisGame = Number(existingUnitStats.sentenceStars || 0);
      if (starsEarned > prevStarsForThisGame) {
        updatedStats.sentenceStars = starsEarned;
      }
    } else if (activeGame === 'quiz') {
      prevStarsForThisGame = Number(existingUnitStats.quizStars || 0);
      if (starsEarned > prevStarsForThisGame) {
        updatedStats.quizStars = starsEarned;
      }
    }

    const starDelta = Math.max(0, starsEarned - prevStarsForThisGame);
    // User requirement:
    // "luyện tập bài cũ đạt đủ 3 sao cộng 5 XP, quy định lên cấp: 500 XP, bỏ cấp 11, chỉ lấy tối đa 10 cấp và đặc biệt từ cấp 9 lên 10 cách nhau 1000 XP"
    let addedXp = 0;
    if (starDelta > 0) {
      addedXp = 50 + starDelta * 30;
    } else if (starsEarned === 3) {
      // Luyện tập bài cũ đạt đủ 3 sao: cộng 10 XP
      addedXp = 10;
    }

    const newXp = currentUser.xp + addedXp;
    const newLevel = calculateLevelFromXp(newXp);

    const streakResult = calculateUpdatedStreak(
      currentUser.currentStreak,
      currentUser.lastActiveDate,
      currentUser.highestStreak
    );

    const newCompletedUnits = {
      ...currentUser.completedUnits
    };
    delete (newCompletedUnits as any)[String(unitNum)];
    newCompletedUnits[Number(unitNum)] = updatedStats;

    // Calculate total stars exactly as the sum of all game stars across all completed units
    const calculatedSumOfStars = Object.values(newCompletedUnits).reduce((sum, u: any) => {
      const vocab = u.flashcardStars !== undefined ? Number(u.flashcardStars) : (u.flashcardsDone ? 1 : 0);
      return sum + vocab + (Number(u.memoryStars) || 0) + (Number(u.wordScrambleStars) || 0) + (Number(u.sentenceStars) || 0) + (Number(u.quizStars) || 0);
    }, 0);
    const newTotalStars = calculatedSumOfStars;

    // Badges Check according to new rules:
    // - "Trí nhớ siêu phàm": Lật thẻ 3 sao tất cả các Unit
    // - "Dũng sĩ ghép từ": Ghép đúng 3 sao tất cả các Unit
    // - "Bậc thầy cú pháp": Ghép đúng 3 sao tất cả các Unit
    // - "Trạng nguyên tiếng Anh": Đạt 3 sao trắc nghiệm tất cả các Unit
    const newBadges = computeLearnerBadges(newCompletedUnits, currentUser.unlockedBadges, currentUnits);

    const updatedProfile: UserProfile = {
      ...currentUser,
      xp: newXp,
      level: newLevel,
      totalStars: newTotalStars,
      currentStreak: streakResult.currentStreak,
      highestStreak: streakResult.highestStreak,
      completedUnits: newCompletedUnits,
      unlockedBadges: newBadges,
      lastActiveDate: new Date().toISOString()
    };

    setLearners(prev => prev.map(l => l.learnerId === currentUser.learnerId ? updatedProfile : l));
    syncLearnerToCloud(updatedProfile).catch(err => {
      console.warn('Sync game progress warning:', err);
    });

    if (starsEarned === 3 || activeGame === 'flashcards' || activeGame === 'challenge') {
      fireGrandFireworks();
    }

    setActiveGame('none');
  };

  // Admin Callbacks
  const handleUpdateLearner = (updated: UserProfile) => {
    setLearners(prev => prev.map(l => l.learnerId === updated.learnerId ? updated : l));
    syncLearnerToCloud(updated).catch(err => {
      console.warn('Sync updated learner to cloud warning:', err);
    });
  };

  const handleAddLearner = (newLearner: UserProfile) => {
    setLearners(prev => [...prev, newLearner]);
    syncLearnerToCloud(newLearner).catch(err => {
      console.warn('Sync new learner to cloud warning:', err);
    });
  };

  const handleDeleteLearner = (learnerId: string) => {
    setLearners(prev => prev.filter(l => l.learnerId !== learnerId));
    deleteLearnerFromCloud(learnerId).catch(err => {
      console.warn('Delete learner from cloud warning:', err);
    });
    if (activeLearnerId === learnerId) {
      const remaining = learners.filter(l => l.learnerId !== learnerId);
      if (remaining.length > 0) setActiveLearnerId(remaining[0].learnerId);
      else setActiveLearnerId(null);
    }
  };

  const handleAddCustomAvatar = (newAvatar: CustomAvatarItem) => {
    setCustomAvatars(prev => [...prev, newAvatar]);
    syncCustomAvatarToCloud(newAvatar).catch(err => {
      console.warn('Sync custom avatar warning:', err);
    });
  };

  const handleDeleteCustomAvatar = (avatarId: string) => {
    const avatarToDelete = customAvatars.find(a => a.id === avatarId);
    setCustomAvatars(prev => prev.filter(a => a.id !== avatarId));
    deleteCustomAvatarFromCloud(avatarId).catch(err => {
      console.warn('Delete custom avatar warning:', err);
    });
    if (avatarToDelete) {
      setLearners(prev => prev.map(l => {
        if (l.avatar === avatarToDelete.icon) {
          const fallbackUser = { ...l, avatar: '🎓' };
          syncLearnerToCloud(fallbackUser).catch(() => {});
          return fallbackUser;
        }
        return l;
      }));
    }
  };

  const handleAddClass = (newClass: ClassItem, initialUnits: UnitData[]) => {
    setClasses(prev => [...prev, newClass]);
    syncClassToCloud(newClass).catch(err => console.warn('Sync class notice:', err));
    const units = initialUnits.length > 0 ? initialUnits : getDefaultUnitsForGrade(newClass.grade);
    setGradeUnitsMap(prev => ({
      ...prev,
      [newClass.grade]: units
    }));
    syncCurriculumToCloud(newClass.grade, units).catch(err => console.warn('Sync curriculum notice:', err));
  };

  const handleDeleteClass = (grade: number) => {
    soundEffects.playSuccess();
    deleteClassFromCloud(grade).catch(err => console.warn('Delete class notice:', err));
    setClasses(prev => {
      const remaining = prev.filter(c => c.grade !== grade);
      const fallbackGrade = remaining[0]?.grade || 4;
      setLearners(prevLearners => prevLearners.map(l => {
        if (l.grade === grade) {
          const updated = { ...l, grade: fallbackGrade };
          syncLearnerToCloud(updated).catch(() => {});
          return updated;
        }
        return l;
      }));
      return remaining;
    });
  };

  const handleSaveCurriculum = (grade: number, units: UnitData[]) => {
    setGradeUnitsMap(prev => ({
      ...prev,
      [grade]: units
    }));
    syncCurriculumToCloud(grade, units).catch(err => {
      console.warn('Sync curriculum to cloud notice:', err);
    });
    if (currentUser?.grade === grade) {
      setSelectedUnit(units[0]);
    }
  };

  const handleResetCurriculum = (grade: number) => {
    if (grade === 4) {
      setGradeUnitsMap(prev => ({ ...prev, 4: DEFAULT_UNITS_DATA }));
    } else if (grade === 7) {
      setGradeUnitsMap(prev => ({ ...prev, 7: GRADE_7_UNITS_DATA }));
    } else {
      setGradeUnitsMap(prev => ({ ...prev, [grade]: getDefaultUnitsForGrade(grade) }));
    }
  };

  const handleSaveAvatar = (
    newName: string,
    newAvatar: string,
    newPin?: string,
    newPhone?: string,
    newEmail?: string,
    uploadedCustomAvatar?: string,
    newFullName?: string,
    newNickname?: string
  ) => {
    if (!currentUser) return;
    const finalUsername = resolveValidUsername(currentUser.username, newNickname || newName);
    const updated: UserProfile = {
      ...currentUser,
      name: finalUsername,
      nickname: finalUsername,
      fullName: newFullName !== undefined ? newFullName : (currentUser.fullName || ''),
      username: finalUsername,
      avatar: newAvatar,
      ...(newPin ? { pin: newPin } : {}),
      phone: newPhone !== undefined ? newPhone : (currentUser.phone || ''),
      email: newEmail !== undefined ? newEmail : (currentUser.email || ''),
      ...(uploadedCustomAvatar ? { customAvatarUrl: uploadedCustomAvatar } : {})
    };
    setLearners(prev => prev.map(l => l.learnerId === currentUser.learnerId ? updated : l));
    syncLearnerToCloud(updated).catch(err => {
      console.warn('Sync avatar update warning:', err);
    });

    if (uploadedCustomAvatar) {
      const userCustomAvatarItem: CustomAvatarItem = {
        id: `custom_av_${currentUser.learnerId}`,
        name: `Avatar ${finalUsername}`,
        icon: uploadedCustomAvatar,
        isCustom: true,
        ownerLearnerId: currentUser.learnerId
      };
      setCustomAvatars(prev => {
        const filtered = prev.filter(
          a => a.id !== userCustomAvatarItem.id && a.ownerLearnerId !== currentUser.learnerId
        );
        return [...filtered, userCustomAvatarItem];
      });
      syncCustomAvatarToCloud(userCustomAvatarItem).catch(err => {
        console.warn('Sync user custom avatar warning:', err);
      });
    }
  };

  // Render hộp thoại thông báo ngắt phiên (hiển thị trên cả màn hình đăng nhập và màn hình chính)
  const renderSessionTerminatedModal = () => {
    if (!sessionTerminatedNotice) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
        <div
          className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-rose-300 overflow-hidden transform animate-scaleUp text-slate-800 text-center p-6 sm:p-7 space-y-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Warning Icon */}
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>

          {/* Header & Message */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-xl text-slate-900">
              Thông báo dừng truy cập
            </h3>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm font-semibold leading-relaxed">
              {sessionTerminatedNotice}
            </div>
          </div>

          {/* Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                soundEffects.playClick();
                handleSetSessionNotice(null);
                setActiveLearnerId(null);
                setActiveGame('none');
                try {
                  localStorage.removeItem(STORAGE_KEY_ACTIVE_LEARNER);
                  localStorage.removeItem('easyeng_current_session_id');
                  sessionStorage.removeItem('easyeng_session_terminated_notice');
                } catch {}
              }}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-display font-bold text-sm shadow-md shadow-rose-600/25 transition cursor-pointer active:scale-95"
            >
              Đã hiểu & Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  };

  // If user is not logged in or no active learner, show LoginScreen
  if (!activeLearnerId || !currentUser) {
    return (
      <>
        <LoginScreen
          learners={learners}
          classes={classes}
          isLoading={isLoadingLearners}
          onSelectLearner={handleSelectLearner}
          onAddLearner={handleAddLearner}
          onOpenAdminManager={() => setShowAdminModal(true)}
          customLogo={customLogo}
          welcomeLogoSize={welcomeLogoSize}
        />

        {showAdminModal && (
          <AdminManagerModal
            learners={learners}
            classes={classes}
            customAvatars={customAvatars}
            gradeUnitsMap={gradeUnitsMap}
            gradeExercisesMap={gradeExercisesMap}
            onSaveExercises={handleSaveExercises}
            onUpdateLearner={handleUpdateLearner}
            onAddLearner={handleAddLearner}
            onDeleteLearner={handleDeleteLearner}
            onAddCustomAvatar={handleAddCustomAvatar}
            onDeleteCustomAvatar={handleDeleteCustomAvatar}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
            onSaveCurriculum={handleSaveCurriculum}
            onResetCurriculum={handleResetCurriculum}
            onClose={() => setShowAdminModal(false)}
            customLogo={customLogo}
            onUpdateLogo={handleUpdateLogo}
            headerLogoSize={headerLogoSize}
            welcomeLogoSize={welcomeLogoSize}
            onSaveLogoSizes={handleSaveLogoSizes}
            onSaveBranding={handleSaveBranding}
          />
        )}

        {renderSessionTerminatedModal()}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-amber-100/40">
      {/* Top Navigation */}
      <Header
        user={currentUser}
        onOpenBadges={() => setShowBadgesModal(true)}
        onOpenAdminManager={() => setShowAdminModal(true)}
        onOpenAvatarModal={() => setShowAvatarModal(true)}
        onGoHome={() => {
          if (activeExerciseCluster) {
            setActiveExerciseCluster(null);
            setLearningMode('textbook');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (activeGame !== 'none') {
            setShowGameExitModal(true);
          } else {
            setLearningMode('textbook');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onSwitchLearner={() => {
          if (activeExerciseCluster) setActiveExerciseCluster(null);
          setLearningMode('textbook');
          handleSwitchLearner();
        }}
        onExitLearner={() => {
          soundEffects.playClick();
          if (activeExerciseCluster) {
            setActiveExerciseCluster(null);
            setLearningMode('exercises');
          } else if (activeGame !== 'none') {
            setShowGameExitModal(true);
          } else {
            setShowExitModal(true);
          }
        }}
        currentUnitTitle={
          activeExerciseCluster
            ? `Bài tập Lớp ${currentUser.grade} • ${activeExerciseCluster.title}`
            : activeGame === 'challenge'
            ? `Thử thách toàn diện Lớp ${currentUser.grade}`
            : activeGame !== 'none'
            ? `Unit ${selectedUnit.unit}: ${selectedUnit.title}`
            : undefined
        }
        customLogo={customLogo}
        headerLogoSize={headerLogoSize}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8">
        {activeGame === 'none' && !activeExerciseCluster && (
          <UnitSelector
            units={currentUnits}
            user={currentUser}
            selectedUnitId={selectedUnit.unit}
            onSelectUnit={(unit) => setSelectedUnit(unit)}
            onSelectGame={handleLaunchGame}
            exerciseClusters={currentExercises}
            learningMode={learningMode}
            onLearningModeChange={setLearningMode}
            onSelectExerciseCluster={(cluster) => {
              setActiveExerciseCluster(cluster);
              setLearningMode('exercises');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartChallenge={() => {
              speechService.cancel();
              setActiveGame('challenge');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAvatarModal={() => setShowAvatarModal(true)}
          />
        )}

        {activeExerciseCluster && (
          <ExerciseClusterRunner
            cluster={activeExerciseCluster}
            grade={currentUser.grade}
            onComplete={handleExerciseClusterComplete}
            onBack={() => {
              setActiveExerciseCluster(null);
              setLearningMode('exercises');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeGame === 'challenge' && (
          <ComprehensiveChallengeGame
            units={currentUnits}
            grade={currentUser.grade}
            onComplete={handleGameComplete}
            onBack={() => setShowGameExitModal(true)}
          />
        )}

        {activeGame === 'flashcards' && (
          <FlashcardGame
            unit={selectedUnit}
            onComplete={handleGameComplete}
            onBack={() => setShowGameExitModal(true)}
          />
        )}

        {activeGame === 'memory' && (
          <MemoryGame
            unit={selectedUnit}
            onComplete={handleGameComplete}
            onBack={() => setShowGameExitModal(true)}
          />
        )}

        {activeGame === 'wordScramble' && (
          <WordScrambleGame
            unit={selectedUnit}
            onComplete={handleGameComplete}
            onBack={() => setShowGameExitModal(true)}
          />
        )}

        {activeGame === 'sentence' && (
          <SentenceBuilderGame
            unit={selectedUnit}
            onComplete={handleGameComplete}
            onBack={() => setShowGameExitModal(true)}
          />
        )}

        {activeGame === 'quiz' && (
          <QuizArenaGame
            unit={selectedUnit}
            onComplete={handleGameComplete}
            onBack={() => setShowGameExitModal(true)}
          />
        )}
      </main>

      {/* Footer: Click chữ EasyEng để vào trang Quản lý - giữ nguyên hiển thị và con trỏ chuột khi hover */}
      <footer className="mt-auto border-t border-amber-200/60 bg-white/70 backdrop-blur-xs py-4 text-center text-xs font-semibold text-slate-500 select-none">
        © 2026{' '}
        <span
          onClick={() => setShowAdminModal(true)}
          className="cursor-default"
        >
          EasyEng
        </span>
      </footer>

      {/* Modals */}
      {showBadgesModal && (
        <BadgesModal
          user={currentUser}
          units={currentUnits}
          onClose={() => setShowBadgesModal(false)}
        />
      )}

      {showAvatarModal && (
        <AvatarModal
          user={currentUser}
          customAvatars={customAvatars}
          allLearners={learners}
          onSave={handleSaveAvatar}
          onClose={() => setShowAvatarModal(false)}
        />
      )}

      {showAdminModal && (
        <AdminManagerModal
          learners={learners}
          classes={classes}
          customAvatars={customAvatars}
          gradeUnitsMap={gradeUnitsMap}
          gradeExercisesMap={gradeExercisesMap}
          onSaveExercises={handleSaveExercises}
          onUpdateLearner={handleUpdateLearner}
          onAddLearner={handleAddLearner}
          onDeleteLearner={handleDeleteLearner}
          onAddCustomAvatar={handleAddCustomAvatar}
          onDeleteCustomAvatar={handleDeleteCustomAvatar}
          onAddClass={handleAddClass}
          onDeleteClass={handleDeleteClass}
          onSaveCurriculum={handleSaveCurriculum}
          onResetCurriculum={handleResetCurriculum}
          onClose={() => setShowAdminModal(false)}
          customLogo={customLogo}
          onUpdateLogo={handleUpdateLogo}
          headerLogoSize={headerLogoSize}
          welcomeLogoSize={welcomeLogoSize}
          onSaveLogoSizes={handleSaveLogoSizes}
          onSaveBranding={handleSaveBranding}
        />
      )}

      {showExitModal && (
        <ExitConfirmationModal
          isOpen={showExitModal}
          user={currentUser}
          onSaveAndExit={handleSaveAndExit}
          onCancel={() => setShowExitModal(false)}
        />
      )}

      {/* Cảnh báo khi người học bấm nút quay lại trong các trang minigame */}
      {showGameExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-amber-200 overflow-hidden transform animate-scaleUp text-slate-800 text-center p-6 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Warning Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl shadow-inner">
              ⚠️
            </div>

            {/* Header & Message */}
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-xl text-slate-800">
                Cảnh báo
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Kết quả làm bài sẽ bị hủy nếu bạn quay lại lúc này. Bạn có muốn tiếp tục làm bài không?
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowGameExitModal(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95 order-1 sm:order-2"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setShowGameExitModal(false);
                  setActiveGame('none');
                }}
                className="flex-1 py-2.5 px-3 rounded-2xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 font-bold text-sm transition cursor-pointer active:scale-95 order-2 sm:order-1"
              >
                Rời khỏi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hộp thoại thông báo khi phiên đăng nhập bị ngắt do có báo cáo xác minh trên thiết bị lạ */}
      {renderSessionTerminatedModal()}
    </div>
  );
}
