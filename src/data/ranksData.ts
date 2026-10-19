export interface RankTier {
  level: number;
  minXp: number;
  maxXp: number | null; // null for max tier (unlimited)
  title: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  description: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    level: 1,
    minXp: 0,
    maxXp: 499,
    title: 'Nhà Thám Hiểm Tập Sự',
    icon: '🌟',
    color: 'text-amber-500',
    bgGradient: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-300',
    description: 'Bước khởi đầu hành trình khám phá thế giới tiếng Anh (0 - 499 XP).'
  },
  {
    level: 2,
    minXp: 500,
    maxXp: 999,
    title: 'Thợ Săn Từ Vựng',
    icon: '🧭',
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-400 to-teal-500',
    borderColor: 'border-emerald-300',
    description: 'Làm quen và tích lũy vốn từ vựng cơ bản qua các bài học (500 - 999 XP).'
  },
  {
    level: 3,
    minXp: 1000,
    maxXp: 1499,
    title: 'Dũng Sĩ Tiếng Anh',
    icon: '🏹',
    color: 'text-blue-500',
    bgGradient: 'from-blue-400 to-indigo-500',
    borderColor: 'border-blue-300',
    description: 'Vượt qua nhiều thử thách lật thẻ và ghép từ một cách tự tin (1000 - 1499 XP).'
  },
  {
    level: 4,
    minXp: 1500,
    maxXp: 1999,
    title: 'Chiến Binh Cú Pháp',
    icon: '🛡️',
    color: 'text-indigo-500',
    bgGradient: 'from-indigo-400 to-purple-500',
    borderColor: 'border-indigo-300',
    description: 'Thành thạo cấu trúc câu, ghép câu chuẩn xác và tốc độ (1500 - 1999 XP).'
  },
  {
    level: 5,
    minXp: 2000,
    maxXp: 2499,
    title: 'Hiệp Sĩ Tri Thức',
    icon: '⚔️',
    color: 'text-purple-500',
    bgGradient: 'from-purple-500 to-fuchsia-500',
    borderColor: 'border-purple-300',
    description: 'Đạt cột mốc 2000 XP với phong độ học tập bền bỉ và xuất sắc (2000 - 2499 XP).'
  },
  {
    level: 6,
    minXp: 2500,
    maxXp: 2999,
    title: 'Phù Thủy Ngôn Ngữ',
    icon: '🧙‍♂️',
    color: 'text-pink-500',
    bgGradient: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-300',
    description: 'Làm chủ từ vựng ngữ pháp, phản xạ nhạy bén trong mọi thử thách (2500 - 2999 XP).'
  },
  {
    level: 7,
    minXp: 3000,
    maxXp: 3499,
    title: 'Bậc Thầy Toàn Năng',
    icon: '👑',
    color: 'text-amber-600',
    bgGradient: 'from-amber-500 to-yellow-400',
    borderColor: 'border-amber-400',
    description: 'Đạt điểm số cao và sưu tầm nhiều huy hiệu danh giá (3000 - 3499 XP).'
  },
  {
    level: 8,
    minXp: 3500,
    maxXp: 3999,
    title: 'Đại Sứ Anh Ngữ',
    icon: '🔮',
    color: 'text-cyan-600',
    bgGradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-300',
    description: 'Bản lĩnh tự tin, chinh phục các bài tập khó với độ chính xác cao (3500 - 3999 XP).'
  },
  {
    level: 9,
    minXp: 4000,
    maxXp: 4999,
    title: 'Huyền Thoại Học Đường',
    icon: '🦅',
    color: 'text-red-500',
    bgGradient: 'from-red-500 to-orange-600',
    borderColor: 'border-red-300',
    description: 'Thành tích vượt trội, chặng bứt phá 1000 XP để vươn tới Trạng Nguyên (4000 - 4999 XP).'
  },
  {
    level: 10,
    minXp: 5000,
    maxXp: null,
    title: 'Trạng Nguyên Xuất Chúng',
    icon: '🏆',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-400 to-amber-600',
    borderColor: 'border-yellow-400',
    description: 'Đỉnh cao tri thức cao nhất (Cấp 10), làm chủ toàn bộ chương trình học (5000+ XP).'
  }
];

/**
 * Calculates user level from current XP based on:
 * - 500 XP per level (Levels 1 - 8)
 * - Level 9 requires 1000 XP to reach Level 10 (4000 XP to 5000 XP)
 * - Level 10 is the maximum level (cap at 10)
 */
export function calculateLevelFromXp(xp: number): number {
  if (xp < 500) return 1;
  if (xp < 1000) return 2;
  if (xp < 1500) return 3;
  if (xp < 2000) return 4;
  if (xp < 2500) return 5;
  if (xp < 3000) return 6;
  if (xp < 3500) return 7;
  if (xp < 4000) return 8;
  if (xp < 5000) return 9; // 1000 XP gap from level 9 to 10
  return 10; // Max level 10
}

export function getRankTier(level: number, xp?: number): RankTier {
  if (level >= 10) {
    return RANK_TIERS[RANK_TIERS.length - 1];
  }
  const tier = RANK_TIERS.find(t => t.level === level);
  if (tier) return tier;

  if (xp !== undefined) {
    const calcLevel = calculateLevelFromXp(xp);
    return RANK_TIERS.find(t => t.level === calcLevel) || RANK_TIERS[0];
  }

  return RANK_TIERS[0];
}

export function getNextRankTier(currentLevel: number): RankTier | null {
  if (currentLevel >= 10) return null;
  const nextLevel = currentLevel + 1;
  return RANK_TIERS.find(t => t.level === nextLevel) || null;
}
