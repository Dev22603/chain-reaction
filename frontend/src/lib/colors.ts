export const PLAYER_COLORS = [
  "#ff3b6b", "#2ad8ff", "#ffd23f", "#5cff9b",
  "#ff3da7", "#ff6b1f", "#b6ff3c", "#c77dff",
] as const;

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length] ?? "#ffffff";
}
