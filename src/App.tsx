/**
 * EasyEng - Webgame học tiếng Anh
 * @license Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UnitData, UserProfile } from './types';
import { DEFAULT_UNITS_DATA } from './data/unitsData';
import { GRADE_7_UNITS_DATA } from './data/unitsGrade7Data';
import { Header } from './components/Header';
import { UnitSelector } from './components/UnitSelector';
import { LearnerSelectScreen } from './components/LearnerSelectScreen';
import { FlashcardGame } from './components/games/FlashcardGame';
import { MemoryGame } from './components/games/MemoryGame';
import { WordScrambleGame } from './components/games/WordScrambleGame';
import { SentenceBuilderGame } from './components/games/SentenceBuilderGame';
import { QuizArenaGame } from './components/games/QuizArenaGame';
import { ComprehensiveChallengeGame } from './components/games/ComprehensiveChallengeGame';
import { BadgesModal } from './components/BadgesModal';
import { AvatarModal } from './components/AvatarModal';
import { AdminManagerModal } from './components/AdminManagerModal';
import { ExitConfirmationModal } from './components/ExitConfirmationModal';
import { soundEffects } from './services/soundEffects';
import { speechService, VoiceGender } from './services/speechService';
import { CustomAvatarItem } from './utils/avatarUtils';
import { getDefaultGradeEmoji, getDefaultGradeDescription, ALL_12_GRADES, getGradeLevelName } from './utils/gradeUtils';
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
  subscribeToBranding
} from './services/firebase';
import { fireGrandFireworks } from './utils/confettiFireworks';

const STORAGE_KEY_ACTIVE_LEARNER = 'easyeng_active_learner_id_v3';
const STORAGE_KEY_LEARNERS = 'easyeng_learners_list_v3';
const STORAGE_KEY_CLASSES = 'easyeng_classes_list_v3';
const STORAGE_KEY_CURRICULUM = 'easyeng_curriculum_map_v3';
const STORAGE_KEY_CUSTOM_AVATARS = 'easyeng_custom_avatars_v3';

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

  // 6. "Chinh Phục Phần 1" (volume1_grad): Vượt qua Unit 1-10
  const unit1to10Units = targetUnits.filter(u => u.unit >= 1 && u.unit <= 10);
  const volume1Done =
    unit1to10Units.length > 0 &&
    unit1to10Units.every(u => {
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
  if (volume1Done) {
    badges.push('volume1_grad');
  }

  // 7. "Đại Sứ Toàn Năng" (volume2_grad): Hoàn tất cả 20 Unit
  const volume2Done =
    targetUnits.length >= 20 &&
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
  if (volume2Done) {
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
        if (Array.isArray(parsed)) return parsed;
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

  // Custom App Logo (PNG/JPG/SVG/URL or null for default)
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    return localStorage.getItem('easyeng_custom_logo') || null;
  });

  const handleUpdateLogo = (newLogo: string | null) => {
    if (newLogo) {
      localStorage.setItem('easyeng_custom_logo', newLogo);
      setCustomLogo(newLogo);
    } else {
      localStorage.removeItem('easyeng_custom_logo');
      setCustomLogo(null);
    }
  };

  // Logo sizes (Header navigation bar: 200px and Welcome / Learner selection screen: 300px)
  const DEFAULT_HEADER_LOGO_SIZE = 200; // px
  const DEFAULT_WELCOME_LOGO_SIZE = 300; // px

  const [headerLogoSize, setHeaderLogoSize] = useState<number>(() => {
    const saved = localStorage.getItem('easyeng_header_logo_size');
    if (saved) {
      const num = Number(saved);
      if (!isNaN(num) && num >= 20 && num <= 300) {
        if (num === 44) return DEFAULT_HEADER_LOGO_SIZE; // Upgrade legacy 44px
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
        if (num === 48) return DEFAULT_WELCOME_LOGO_SIZE; // Upgrade legacy 48px
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
        if (parsed && typeof parsed === 'object') return parsed;
      } catch {
        // fallback
      }
    }
    return {
      4: DEFAULT_UNITS_DATA,
      7: GRADE_7_UNITS_DATA
    };
  });

  // Active learner profile
  const currentUser = learners.find(l => l.learnerId === activeLearnerId) || learners[0];

  // Active curriculum units for current learner's grade
  const currentUnits = (currentUser && gradeUnitsMap[currentUser.grade]) || (
    currentUser ? getDefaultUnitsForGrade(currentUser.grade) : DEFAULT_UNITS_DATA
  );

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

  // Keep selectedUnit in sync when switching learner / grade
  useEffect(() => {
    if (currentUnits.length > 0) {
      setSelectedUnit(currentUnits[0]);
    }
    setActiveGame('none');
  }, [activeLearnerId, currentUser?.grade]);

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
        setGradeUnitsMap(prev => ({
          ...prev,
          ...cloudCurriculum
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
                  syncCurriculumToCloud(g, units as UnitData[]).catch(err => {
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
        setGradeUnitsMap(prev => ({
          ...prev,
          ...cloudCurriculum
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

  // Save active learner ID
  useEffect(() => {
    if (activeLearnerId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_LEARNER, activeLearnerId);
    }
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
    setActiveLearnerId(learnerId);
    setActiveGame('none');
  };

  const handleSwitchLearner = () => {
    soundEffects.playClick();
    setActiveLearnerId(null);
    setActiveGame('none');
  };

  const handleSaveAndExit = () => {
    soundEffects.playSuccess();
    setShowExitModal(false);
    setActiveLearnerId(null);
    setActiveGame('none');
  };

  const handleLaunchGame = (unit: UnitData, gameType: 'flashcards' | 'memory' | 'wordScramble' | 'sentence' | 'quiz') => {
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
    const addedXp = starDelta > 0 ? (50 + starDelta * 30) : (starsEarned > 0 ? 20 : 0);
    const newXp = currentUser.xp + addedXp;
    const newLevel = Math.floor(newXp / 200) + 1;

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
      completedUnits: newCompletedUnits,
      unlockedBadges: newBadges
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
          const fallbackUser = { ...l, avatar: 'fox' };
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

  const handleSaveAvatar = (newName: string, newAvatar: string, newPin?: string) => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      name: newName,
      avatar: newAvatar,
      ...(newPin ? { pin: newPin } : {})
    };
    setLearners(prev => prev.map(l => l.learnerId === currentUser.learnerId ? updated : l));
    syncLearnerToCloud(updated).catch(err => {
      console.warn('Sync avatar update warning:', err);
    });
  };

  // If learner is not chosen yet or no active learner found, show LearnerSelectScreen
  if (!activeLearnerId || !currentUser) {
    return (
      <>
        <LearnerSelectScreen
          learners={learners}
          isLoading={isLoadingLearners}
          onSelectLearner={handleSelectLearner}
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
          if (activeGame !== 'none') {
            setShowGameExitModal(true);
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onSwitchLearner={handleSwitchLearner}
        onExitLearner={() => {
          soundEffects.playClick();
          if (activeGame !== 'none') {
            setShowGameExitModal(true);
          } else {
            setShowExitModal(true);
          }
        }}
        currentUnitTitle={
          activeGame === 'challenge'
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
        {activeGame === 'none' && (
          <UnitSelector
            units={currentUnits}
            user={currentUser}
            selectedUnitId={selectedUnit.unit}
            onSelectUnit={(unit) => setSelectedUnit(unit)}
            onSelectGame={handleLaunchGame}
            onStartChallenge={() => {
              setActiveGame('challenge');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAvatarModal={() => setShowAvatarModal(true)}
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

      {/* Footer: Click chữ BaTyNa để vào trang Quản lý - giữ nguyên hiển thị và con trỏ chuột khi hover */}
      <footer className="mt-auto border-t border-amber-200/60 bg-white/70 backdrop-blur-xs py-4 text-center text-xs font-semibold text-slate-500 select-none">
        © 2026{' '}
        <span
          onClick={() => setShowAdminModal(true)}
          className="cursor-default"
        >
          BaTyNa
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
    </div>
  );
}
