/**
 * Utility for accurately calculating consecutive day learning streaks
 */

export interface StreakUpdateResult {
  currentStreak: number;
  highestStreak: number;
  streakUpdated: boolean;
}

export function calculateUpdatedStreak(
  currentStreak: number = 0,
  lastActiveDateStr?: string,
  highestStreak: number = 0
): StreakUpdateResult {
  const now = new Date();
  const currentSafeStreak = Math.max(0, currentStreak);
  const currentSafeHighest = Math.max(currentSafeStreak, highestStreak || 0);

  if (!lastActiveDateStr) {
    return {
      currentStreak: 1,
      highestStreak: Math.max(1, currentSafeHighest),
      streakUpdated: true
    };
  }

  const lastDate = new Date(lastActiveDateStr);
  if (isNaN(lastDate.getTime())) {
    return {
      currentStreak: 1,
      highestStreak: Math.max(1, currentSafeHighest),
      streakUpdated: true
    };
  }

  // Compare calendar day in local time (ignoring hours/minutes/seconds)
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();

  const lastYear = lastDate.getFullYear();
  const lastMonth = lastDate.getMonth();
  const lastDay = lastDate.getDate();

  // Check if same calendar day
  if (todayYear === lastYear && todayMonth === lastMonth && todayDay === lastDay) {
    // Already counted today
    const streak = Math.max(1, currentSafeStreak);
    return {
      currentStreak: streak,
      highestStreak: Math.max(streak, currentSafeHighest),
      streakUpdated: false
    };
  }

  // Difference in calendar days using local midnight timestamps
  const todayMidnight = new Date(todayYear, todayMonth, todayDay).getTime();
  const lastMidnight = new Date(lastYear, lastMonth, lastDay).getTime();
  const diffDays = Math.round((todayMidnight - lastMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    // Yesterday was active -> consecutive day streak increased!
    const newStreak = (currentSafeStreak > 0 ? currentSafeStreak : 1) + 1;
    return {
      currentStreak: newStreak,
      highestStreak: Math.max(newStreak, currentSafeHighest),
      streakUpdated: true
    };
  } else if (diffDays > 1) {
    // Missed one or more days -> reset to 1
    return {
      currentStreak: 1,
      highestStreak: Math.max(1, currentSafeHighest),
      streakUpdated: true
    };
  }

  // Same day or clock drift backwards
  return {
    currentStreak: Math.max(1, currentSafeStreak),
    highestStreak: Math.max(1, currentSafeHighest),
    streakUpdated: false
  };
}
