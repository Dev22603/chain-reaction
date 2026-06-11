// Mirrors backend LEVEL_THRESHOLDS (backend/src/constants/xp.constants.ts).
// LEVEL_THRESHOLDS[i] = total XP required to reach level i + 1.
export const LEVEL_THRESHOLDS = [
  0, 1_000, 2_000, 5_000, 10_000, 18_000, 30_000, 50_000, 80_000, 120_000,
  170_000, 220_000, 270_000, 320_000, 370_000, 420_000, 470_000, 520_000, 570_000, 620_000
] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export function levelForXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  return level;
}

// XP progress within the current level; at MAX_LEVEL the bar is pinned full.
export function levelProgress(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
  const level = levelForXp(totalXp);
  if (level >= MAX_LEVEL) {
    return { level, xpIntoLevel: 0, xpForNextLevel: 0 };
  }
  const floor = LEVEL_THRESHOLDS[level - 1];
  const ceiling = LEVEL_THRESHOLDS[level];
  return { level, xpIntoLevel: totalXp - floor, xpForNextLevel: ceiling - floor };
}
