// Mirrors backend LIMITS.PLAYERS_MIN / PLAYERS_MAX (backend/src/constants/app.constants.ts).
// Change both together; this is the only knob for how many players a game can hold.
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 20;

export function clampPlayerCount(value: number): number {
  return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, value));
}
