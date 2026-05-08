import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { ERROR_CODES } from "../constants/app.constants.js";
import { SERVER_MESSAGES } from "../constants/app.messages.js";
import { playersRepo } from "../db/index.js";
import type { LoginInput, SignupInput } from "../schemas/auth.schemas.js";
import type { AuthResult, PublicPlayer } from "../types/auth.js";
import { ApiError } from "../utils/api_error.js";
import { signAccessToken } from "../utils/jwt.js";

const PASSWORD_SALT_ROUNDS = 12;

export const authService = {
  async signup(input: SignupInput): Promise<AuthResult> {
    const existing = await playersRepo.findByEmail(input.email);
    if (existing) {
      throw new ApiError(ERROR_CODES.EMAIL_TAKEN, SERVER_MESSAGES.EMAIL_TAKEN, [], 409);
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const player = await playersRepo.createAccount({
      id: randomUUID(),
      displayName: input.displayName,
      email: input.email,
      passwordHash
    });

    return buildAuthResult(toPublicPlayer(player));
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const player = await playersRepo.findByEmail(input.email);
    if (!player?.passwordHash) {
      throwInvalidCredentials();
    }

    const validPassword = await bcrypt.compare(input.password, player.passwordHash);
    if (!validPassword) {
      throwInvalidCredentials();
    }

    return buildAuthResult(toPublicPlayer(player));
  },

  async getMe(playerId: string): Promise<PublicPlayer> {
    const player = await playersRepo.findById(playerId);
    if (!player?.email) {
      throw new ApiError(
        ERROR_CODES.NOT_AUTHENTICATED,
        SERVER_MESSAGES.NOT_AUTHENTICATED,
        [],
        401
      );
    }

    return toPublicPlayer(player);
  }
};

function buildAuthResult(player: PublicPlayer): AuthResult {
  if (!player.email) {
    throwInvalidCredentials();
  }

  return {
    player,
    accessToken: signAccessToken({
      sub: player.id,
      email: player.email
    })
  };
}

function toPublicPlayer(player: { id: string; displayName: string; email: string | null }): PublicPlayer {
  return {
    id: player.id,
    displayName: player.displayName,
    email: player.email
  };
}

function throwInvalidCredentials(): never {
  throw new ApiError(
    ERROR_CODES.INVALID_CREDENTIALS,
    SERVER_MESSAGES.INVALID_CREDENTIALS,
    [],
    401
  );
}
