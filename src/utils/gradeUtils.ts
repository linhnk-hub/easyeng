export interface ClassItem {
  grade: number;
  name: string;
  description: string;
  emoji: string;
}

export type GradeLevelType = 'Tiểu học' | 'Trung học cơ sở' | 'Trung học phổ thông';

export interface GradeMetadata {
  grade: number;
  level: GradeLevelType;
  emoji: string;
  badgeTitle: string;
  description: string;
  accentColor: string;
}

/**
 * Phân cấp học theo quy định giáo dục:
 * - Lớp 1 -> 5: Tiểu học
 * - Lớp 6 -> 9: Trung học cơ sở
 * - Lớp 10 -> 12: Trung học phổ thông
 */
export function getGradeLevelName(grade: number): GradeLevelType {
  if (grade >= 1 && grade <= 5) return 'Tiểu học';
  if (grade >= 6 && grade <= 9) return 'Trung học cơ sở';
  if (grade >= 10 && grade <= 12) return 'Trung học phổ thông';
  return 'Tiểu học';
}

/**
 * Biểu tượng chuẩn và đồng bộ cho 12 khối lớp:
 * - Tiểu học (1 -> 5): Vui tươi, dễ thương, mầm non, khám phá, tích cực
 * - Trung học cơ sở (6 -> 9): Năng động, định hướng, khoa học, bứt phá
 * - Trung học phổ thông (10 -> 12): Học thuật, vươn tầm, học vị, tốt nghiệp
 */
export const GRADE_12_METADATA: Record<number, GradeMetadata> = {
  // === TIỂU HỌC (1 - 5) ===
  1: {
    grade: 1,
    level: 'Tiểu học',
    emoji: '🌱',
    badgeTitle: 'Mầm Xanh Bỡ Ngỡ',
    description: 'Chương trình Tiếng Anh Lớp 1 (Tiểu học)',
    accentColor: 'emerald'
  },
  2: {
    grade: 2,
    level: 'Tiểu học',
    emoji: '🎈',
    badgeTitle: 'Bong Bóng Vui Học',
    description: 'Chương trình Tiếng Anh Lớp 2 (Tiểu học)',
    accentColor: 'sky'
  },
  3: {
    grade: 3,
    level: 'Tiểu học',
    emoji: '🧩',
    badgeTitle: 'Mảnh Ghép Sáng Tạo',
    description: 'Chương trình Tiếng Anh Lớp 3 (Tiểu học)',
    accentColor: 'amber'
  },
  4: {
    grade: 4,
    level: 'Tiểu học',
    emoji: '🎒',
    badgeTitle: 'Hành Trang Thông Thái',
    description: 'Chương trình Tiếng Anh Lớp 4 (Tiểu học)',
    accentColor: 'indigo'
  },
  5: {
    grade: 5,
    level: 'Tiểu học',
    emoji: '⭐',
    badgeTitle: 'Ngôi Sao Hoàn Thành',
    description: 'Chương trình Tiếng Anh Lớp 5 (Tiểu học)',
    accentColor: 'yellow'
  },

  // === TRUNG HỌC CƠ SỞ (6 - 9) ===
  6: {
    grade: 6,
    level: 'Trung học cơ sở',
    emoji: '🧭',
    badgeTitle: 'La Bàn Định Hướng',
    description: 'Chương trình Tiếng Anh Lớp 6 (Trung học cơ sở)',
    accentColor: 'teal'
  },
  7: {
    grade: 7,
    level: 'Trung học cơ sở',
    emoji: '🚀',
    badgeTitle: 'Tên Lửa Bứt Phá',
    description: 'Chương trình Tiếng Anh Lớp 7 (Trung học cơ sở)',
    accentColor: 'blue'
  },
  8: {
    grade: 8,
    level: 'Trung học cơ sở',
    emoji: '🔬',
    badgeTitle: 'Kính Hiển Vi Khám Phá',
    description: 'Chương trình Tiếng Anh Lớp 8 (Trung học cơ sở)',
    accentColor: 'violet'
  },
  9: {
    grade: 9,
    level: 'Trung học cơ sở',
    emoji: '🏆',
    badgeTitle: 'Cúp Vàng Vượt Cấp',
    description: 'Chương trình Tiếng Anh Lớp 9 (Trung học cơ sở)',
    accentColor: 'orange'
  },

  // === TRUNG HỌC PHỔ THÔNG (10 - 12) ===
  10: {
    grade: 10,
    level: 'Trung học phổ thông',
    emoji: '🏛️',
    badgeTitle: 'Cánh Cổng Học Thuật',
    description: 'Chương trình Tiếng Anh Lớp 10 (Trung học phổ thông)',
    accentColor: 'purple'
  },
  11: {
    grade: 11,
    level: 'Trung học phổ thông',
    emoji: '🔭',
    badgeTitle: 'Kính Thiên Văn Tầm Nhìn',
    description: 'Chương trình Tiếng Anh Lớp 11 (Trung học phổ thông)',
    accentColor: 'cyan'
  },
  12: {
    grade: 12,
    level: 'Trung học phổ thông',
    emoji: '🎓',
    badgeTitle: 'Mũ Cử Nhân Tốt Nghiệp',
    description: 'Chương trình Tiếng Anh Lớp 12 (Trung học phổ thông)',
    accentColor: 'rose'
  }
};

export function getDefaultGradeEmoji(grade: number): string {
  return GRADE_12_METADATA[grade]?.emoji || '📚';
}

export function getDefaultGradeDescription(grade: number): string {
  return GRADE_12_METADATA[grade]?.description || `Chương trình Tiếng Anh Lớp ${grade} (${getGradeLevelName(grade)})`;
}

export const ALL_12_GRADES = Array.from({ length: 12 }, (_, i) => i + 1);
