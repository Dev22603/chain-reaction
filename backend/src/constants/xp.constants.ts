const XP = {
	// Winner XP = WINNER_PER_OPPONENT × (players − 1) × board sizeFactor.
	WINNER_PER_OPPONENT: 10,
	// Loser XP = LOSER_BASE × board sizeFactor (forfeiters and guests get 0).
	LOSER_BASE: 2,
} as const;

// LEVEL_THRESHOLDS[i] = total XP required to reach level i + 1.
const LEVEL_THRESHOLDS: readonly number[] = [
	0, // L1
	1_000, // L2
	2_000, // L3
	5_000, // L4
	10_000, // L5
	18_000, // L6
	30_000, // L7
	50_000, // L8
	80_000, // L9
	120_000, // L10
	170_000, // L11
	220_000, // L12
	270_000, // L13
	320_000, // L14
	370_000, // L15
	420_000, // L16
	470_000, // L17
	520_000, // L18
	570_000, // L19
	620_000, // L20
] as const;

const MAX_LEVEL = LEVEL_THRESHOLDS.length;

function levelForXp(totalXp: number): number {
	let level = 1;
	for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
		if (totalXp >= LEVEL_THRESHOLDS[i]) {
			level = i + 1;
		}
	}
	return level;
}

// XP progress within the current level; at MAX_LEVEL the bar is pinned full.
function levelProgress(totalXp: number): { level: number; xpIntoLevel: number; xpForNextLevel: number } {
	const level = levelForXp(totalXp);
	if (level >= MAX_LEVEL) {
		return { level, xpIntoLevel: 0, xpForNextLevel: 0 };
	}
	const floor = LEVEL_THRESHOLDS[level - 1];
	const ceiling = LEVEL_THRESHOLDS[level];
	return { level, xpIntoLevel: totalXp - floor, xpForNextLevel: ceiling - floor };
}

export { XP, LEVEL_THRESHOLDS, MAX_LEVEL, levelForXp, levelProgress };
