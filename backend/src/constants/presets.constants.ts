type BoardPresetKey = "micro" | "classic" | "standard" | "mega";

interface BoardPreset {
	key: BoardPresetKey;
	rows: number;
	cols: number;
	sizeFactor: number;
}

// Every game is played on one of these boards; the key doubles as the
// leaderboard bucket and sizeFactor scales XP rewards.
const BOARD_PRESETS: readonly BoardPreset[] = [
	{ key: "micro", rows: 4, cols: 5, sizeFactor: 1 },
	{ key: "classic", rows: 6, cols: 9, sizeFactor: 2 },
	{ key: "standard", rows: 8, cols: 12, sizeFactor: 3 },
	{ key: "mega", rows: 12, cols: 16, sizeFactor: 4 },
] as const;

const BOARD_PRESET_KEYS = BOARD_PRESETS.map((preset) => preset.key) as [BoardPresetKey, ...BoardPresetKey[]];

function presetForGrid(rows: number, cols: number): BoardPreset | null {
	return BOARD_PRESETS.find((preset) => preset.rows === rows && preset.cols === cols) ?? null;
}

function presetByKey(key: string): BoardPreset | null {
	return BOARD_PRESETS.find((preset) => preset.key === key) ?? null;
}

export { BOARD_PRESETS, BOARD_PRESET_KEYS, presetForGrid, presetByKey };
export type { BoardPreset, BoardPresetKey };
