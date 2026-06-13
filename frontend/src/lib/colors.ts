// 20 pre-decided player colors (one per seat, max 20 players). The list is
// ordered so any prefix of N colors stays clearly distinguishable; hues are
// interleaved instead of sorted, so a 5-player game gets 5 far-apart colors.
export const PLAYER_COLORS = [
  "#E6194B", // 1  red
  "#4363D8", // 2  blue
  "#3CB44B", // 3  green
  "#FFB000", // 4  gold
  "#911EB4", // 5  purple
  "#00B8D9", // 6  cyan
  "#F58231", // 7  orange
  "#F032E6", // 8  magenta
  "#469990", // 9  teal
  "#9A6324", // 10 brown
  "#84CC16", // 11 lime
  "#000075", // 12 navy
  "#800000", // 13 maroon
  "#B388FF", // 14 lavender
  "#808000", // 15 olive
  "#FF7AB6", // 16 pink
  "#607D8B", // 17 slate
  "#A9A9A9", // 18 grey
  "#1B5E20", // 19 dark green
  "#FFD700", // 20 yellow
] as const;

export function playerColor(index: number): string {
  return PLAYER_COLORS[index] ?? "#1E3A5F";
}

/** playerColor for a possibly-absent seat index, with an explicit fallback. */
export function playerColorOr(index: number | null | undefined, fallback: string): string {
  return index === null || index === undefined ? fallback : playerColor(index);
}
