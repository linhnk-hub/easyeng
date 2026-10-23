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

/**
 * Xác định một unit thuộc Phần 1 hay Phần 2 một cách linh hoạt, thông minh:
 * 1. Nhận diện các chuỗi: "Phần 1", "Tập 1", "Book 1", "Part 1", "HK1", "Học kì 1",...
 * 2. Nhận diện các chuỗi: "Phần 2", "Tập 2", "Book 2", "Part 2", "HK2", "Học kì 2",...
 * 3. Nếu giá trị book chung chung (ví dụ "Sách học sinh", "SGK", undefined...):
 *    - Căn cứ theo số thứ tự unit (unit.unit) hoặc vị trí:
 *    - Với sách có <= 16 unit (Lớp 1, 2): Unit 1-8 thuộc Phần 1, Unit 9-16 thuộc Phần 2.
 *    - Với sách có > 16 unit (Lớp 3, 4, 5 có 20 unit): Unit 1-10 thuộc Phần 1, Unit 11-20 thuộc Phần 2.
 */
export function getUnitBookPart(unit: { unit: number; book?: string }, allUnits?: { unit: number; book?: string }[]): 1 | 2 {
  const b = (unit.book || '').toLowerCase().trim();

  // Kiểm tra chỉ định Phần 1
  if (
    b === 'phần 1' || b === 'tập 1' || b === 'tap 1' || b === 'phan 1' ||
    b.includes('tập 1') || b.includes('phần 1') || b.includes('hk1') ||
    b.includes('học kì 1') || b.includes('học kỳ 1') ||
    b === 'book 1' || b === 'part 1' || b === '1'
  ) {
    return 1;
  }

  // Kiểm tra chỉ định Phần 2
  if (
    b === 'phần 2' || b === 'tập 2' || b === 'tap 2' || b === 'phan 2' ||
    b.includes('tập 2') || b.includes('phần 2') || b.includes('hk2') ||
    b.includes('học kì 2') || b.includes('học kỳ 2') ||
    b === 'book 2' || b === 'part 2' || b === '2'
  ) {
    return 2;
  }

  // Fallback: căn cứ vào số thứ tự unit (unit.unit)
  const maxUnit = allUnits && allUnits.length > 0
    ? allUnits.reduce((max, u) => Math.max(max, u.unit || 0), 0)
    : 16;
  const splitPoint = maxUnit > 16 ? 10 : (maxUnit <= 16 ? 8 : 10);

  return (unit.unit <= splitPoint) ? 1 : 2;
}

/**
 * Chuẩn hóa danh sách các unit của một khối lớp, bảo đảm:
 * - Có số thứ tự unit hợp lệ
 * - Trường `book` được gán chính xác 'Phần 1' hoặc 'Phần 2' thay vì để 'Sách học sinh' hay undefined
 * - Các mảng vocabulary, sentencePatterns, quizzes luôn tồn tại
 */
export function normalizeGradeUnits<T extends { unit: number; displayUnit?: number; book?: string; vocabulary?: any[]; sentencePatterns?: any[]; quizzes?: any[] }>(units: T[], grade?: number): T[] {
  if (!Array.isArray(units) || units.length === 0) return [];
  const maxUnit = units.reduce((max, u) => Math.max(max, u.unit || 0), 0) || units.length;
  const splitPoint = maxUnit > 16 ? 10 : (maxUnit <= 16 ? 8 : Math.ceil(units.length / 2));

  return units.map((u, idx) => {
    const unitNum = Number(u.unit) || (idx + 1);
    const part = getUnitBookPart({ ...u, unit: unitNum }, units);
    const bookVal = part === 1 ? 'Phần 1' : 'Phần 2';
    const displayNum = (grade === 2 || (maxUnit <= 16 && units.length <= 16)) && unitNum > 8 ? unitNum - 8 : unitNum;

    return {
      ...u,
      unit: unitNum,
      displayUnit: displayNum,
      book: bookVal,
      vocabulary: Array.isArray(u.vocabulary) ? u.vocabulary : [],
      sentencePatterns: Array.isArray(u.sentencePatterns) ? u.sentencePatterns : [],
      quizzes: Array.isArray(u.quizzes) ? u.quizzes : []
    };
  });
}

/**
 * Lấy số thứ tự hiển thị của Unit theo chương trình học:
 * - Đối với Lớp 2:
 *   Phần 1 gồm 8 unit (Unit 1 - 8)
 *   Phần 2 gồm 8 unit (hiển thị Unit 1 - 8 thay vì Unit 9 - 16)
 */
export function getDisplayUnitNumber(unit: { unit: number; displayUnit?: number; book?: string }, grade?: number): number {
  if (unit.displayUnit !== undefined) {
    return unit.displayUnit;
  }
  const b = (unit.book || '').toLowerCase();
  const isPart2 = b.includes('2') || b.includes('hai');
  if ((grade === 2 || isPart2) && unit.unit > 8 && unit.unit <= 16) {
    return unit.unit - 8;
  }
  return unit.unit;
}

