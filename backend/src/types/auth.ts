export interface AuthTokenPayload {
  sub: string;
  email: string;
}

export interface PublicPlayer {
  id: string;
  displayName: string;
  email: string | null;
}

export interface AuthResult {
  player: PublicPlayer;
  accessToken: string;
}
