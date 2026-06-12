// Mirrors backend BOARD_PRESETS (backend/src/constants/presets.constants.ts).
// Every game is played on one of these boards; the key is the leaderboard bucket.
export const BOARD_PRESETS = [
  { key: "micro", label: "Micro", gridRows: 4, gridCols: 5, sizeFactor: 1 },
  { key: "classic", label: "Classic", gridRows: 6, gridCols: 9, sizeFactor: 2 },
  { key: "standard", label: "Standard", gridRows: 8, gridCols: 12, sizeFactor: 3 },
  { key: "mega", label: "Mega", gridRows: 12, gridCols: 16, sizeFactor: 4 }
] as const;

export type BoardPreset = (typeof BOARD_PRESETS)[number];

export type BoardPresetKey = BoardPreset["key"];

// What the dialogs preselect: Classic 6x9.
export const DEFAULT_BOARD_PRESET = BOARD_PRESETS[1];

export function presetForGrid(gridRows: number, gridCols: number) {
  return BOARD_PRESETS.find((preset) => preset.gridRows === gridRows && preset.gridCols === gridCols) ?? null;
}
