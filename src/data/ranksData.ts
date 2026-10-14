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
    maxXp: 199,
    title: 'Nhà Thám Hiểm Tập Sự',
    icon: '🌟',
    color: 'text-amber-500',
    bgGradient: 'from-amber-400 to-orange-500',
    borderColor: 'border-amber-300',
    description: 'Bước khởi đầu hành trình khám phá thế giới tiếng Anh.'
  },
  {
    level: 2,
    minXp: 200,
    maxXp: 399,
    title: 'Thợ Săn Từ Vựng',
    icon: '🧭',
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-400 to-teal-500',
    borderColor: 'border-emerald-300',
    description: 'Làm quen và tích lũy vốn từ vựng cơ bản qua các bài học.'
  },
  {
    level: 3,
    minXp: 400,
    maxXp: 599,
    title: 'Dũng Sĩ Tiếng Anh',
    icon: '🏹',
    color: 'text-blue-500',
    bgGradient: 'from-blue-400 to-indigo-500',
    borderColor: 'border-blue-300',
    description: 'Vượt qua nhiều thử thách lật thẻ và ghép từ một cách tự tin.'
  },
  {
    level: 4,
    minXp: 600,
    maxXp: 799,
    title: 'Chiến Binh Cú Pháp',
    icon: '🛡️',
    color: 'text-indigo-500',
    bgGradient: 'from-indigo-400 to-purple-500',
    borderColor: 'border-indigo-300',
    description: 'Thành thạo cấu trúc câu, ghép câu chuẩn xác và tốc độ.'
  },
  {
    level: 5,
    minXp: 800,
    maxXp: 999,
    title: 'Hiệp Sĩ Tri Thức',
    icon: '⚔️',
    color: 'text-purple-500',
    bgGradient: 'from-purple-500 to-fuchsia-500',
    borderColor: 'border-purple-300',
    description: 'Đạt cột mốc 800 XP với phong độ học tập bền bỉ và xuất sắc.'
  },
  {
    level: 6,
    minXp: 1000,
    maxXp: 1199,
    title: 'Phù Thủy Ngôn Ngữ',
    icon: '🧙‍♂️',
    color: 'text-pink-500',
    bgGradient: 'from-pink-500 to-rose-500',
    borderColor: 'border-pink-300',
    description: 'Làm chủ từ vựng ngữ pháp, phản xạ nhạy bén trong mọi thử thách.'
  },
  {
    level: 7,
    minXp: 1200,
    maxXp: 1399,
    title: 'Bậc Thầy Toàn Năng',
    icon: '👑',
    color: 'text-amber-600',
    bgGradient: 'from-amber-500 to-yellow-400',
    borderColor: 'border-amber-400',
    description: 'Đạt điểm số cao và sưu tầm nhiều huy hiệu danh giá.'
  },
  {
    level: 8,
    minXp: 1400,
    maxXp: 1599,
    title: 'Đại Sứ Anh Ngữ',
    icon: '🔮',
    color: 'text-cyan-600',
    bgGradient: 'from-cyan-500 to-blue-600',
    borderColor: 'border-cyan-300',
    description: 'Bản lĩnh tự tin, chinh phục các bài tập khó với độ chính xác cao.'
  },
  {
    level: 9,
    minXp: 1600,
    maxXp: 1799,
    title: 'Huyền Thoại Học Đường',
    icon: '🦅',
    color: 'text-red-500',
    bgGradient: 'from-red-500 to-orange-600',
    borderColor: 'border-red-300',
    description: 'Thành tích vượt trội, dẫn đầu bảng xếp hạng của lớp học.'
  },
  {
    level: 10,
    minXp: 1800,
    maxXp: 1999,
    title: 'Trạng Nguyên Xuất Chúng',
    icon: '🏆',
    color: 'text-yellow-500',
    bgGradient: 'from-yellow-400 to-amber-600',
    borderColor: 'border-yellow-400',
    description: 'Chinh phục gần như tuyệt đối các bài học với số sao 3 sao rực rỡ.'
  },
  {
    level: 11,
    minXp: 2000,
    maxXp: null,
    title: 'Thần Đồng Bất Khả Chiến Bại',
    icon: '⚡',
    color: 'text-violet-600',
    bgGradient: 'from-violet-600 to-indigo-800',
    borderColor: 'border-violet-400',
    description: 'Đỉnh cao tri thức, hoàn thành trọn vẹn toàn bộ chương trình học tập.'
  }
];

export function getRankTier(level: number, xp?: number): RankTier {
  // If level is passed, match level; for level >= 11 return top tier
  if (level >= 11) {
    return RANK_TIERS[RANK_TIERS.length - 1];
  }
  const tier = RANK_TIERS.find(t => t.level === level);
  if (tier) return tier;

  // Fallback by XP
  if (xp !== undefined) {
    const byXp = RANK_TIERS.find(t => t.maxXp === null ? xp >= t.minXp : xp >= t.minXp && xp <= t.maxXp);
    if (byXp) return byXp;
  }

  return RANK_TIERS[0];
}

export function getNextRankTier(currentLevel: number): RankTier | null {
  const nextLevel = currentLevel + 1;
  return RANK_TIERS.find(t => t.level === nextLevel) || null;
}
