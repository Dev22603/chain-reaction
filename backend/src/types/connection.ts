import type { PlayerId } from "./game.js";

export interface ConnectionIdentity {
  playerId: PlayerId;
  displayName: string;
  email: string | null;
  isGuest: boolean;
}
