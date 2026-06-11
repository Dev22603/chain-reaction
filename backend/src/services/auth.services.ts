import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../constants/config";
import { AUTH_FEEDBACK_MESSAGES } from "../constants/app.messages";
import { levelProgress } from "../constants/xp.constants";
import { getLogger } from "../lib/logger";
import { playerRepository } from "../repositories/player.repositories";
import { validateLogin, validateSignup, validateUpdateProfile } from "../schemas/auth.schemas";
import { ApiError } from "../utils/api_error";

const logger = getLogger("auth.service");

const PASSWORD_SALT_ROUNDS = 12;
// Compared against when the email is unknown, so login takes the same time
// whether or not the account exists (prevents user enumeration via timing).
const DUMMY_HASH = "$2b$12$4lpQHVrnzc9xN9kLolJIMu3rGeYx60oB1JYyZqEdzvqVTpPRiVQHC";

export interface PublicPlayer {
	id: string;
	displayName: string;
	email: string | null;
	totalXp: number;
	level: number;
	xpIntoLevel: number;
	xpForNextLevel: number;
}

export interface AuthResult {
	player: PublicPlayer;
	accessToken: string;
}

export const authService = {
	async signup(data: unknown): Promise<AuthResult> {
		const input = validateSignup(data);

		const existing = await playerRepository.findByEmail(input.email);
		if (existing) {
			throw new ApiError(409, AUTH_FEEDBACK_MESSAGES.EMAIL_TAKEN);
		}

		const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
		const player = await playerRepository.createAccount({
			id: randomUUID(),
			displayName: input.displayName,
			email: input.email,
			passwordHash,
		});

		logger.info("Player signed up", { playerId: player.id });
		return buildAuthResult(toPublicPlayer(player));
	},

	async login(data: unknown): Promise<AuthResult> {
		const input = validateLogin(data);

		const player = await playerRepository.findByEmail(input.email);
		const passwordHash = player?.passwordHash ?? DUMMY_HASH;

		const validPassword = await bcrypt.compare(input.password, passwordHash);
		if (!player || !player.passwordHash || !validPassword) {
			throwInvalidCredentials();
		}

		logger.info("Player logged in", { playerId: player.id });
		return buildAuthResult(toPublicPlayer(player));
	},

	async getMe(playerId: string): Promise<PublicPlayer> {
		const player = await playerRepository.findById(playerId);
		if (!player?.email) {
			throw new ApiError(401, AUTH_FEEDBACK_MESSAGES.NOT_AUTHENTICATED);
		}

		return toPublicPlayer(player);
	},

	async updateProfile(playerId: string, data: unknown): Promise<PublicPlayer> {
		const input = validateUpdateProfile(data);

		const existing = await playerRepository.findById(playerId);
		if (!existing?.email) {
			throw new ApiError(401, AUTH_FEEDBACK_MESSAGES.NOT_AUTHENTICATED);
		}

		const updated = await playerRepository.updateDisplayName(playerId, input.displayName);
		logger.info("Player display name updated", { playerId });
		return toPublicPlayer(updated);
	},
};

function buildAuthResult(player: PublicPlayer): AuthResult {
	if (!player.email) {
		throwInvalidCredentials();
	}

	return {
		player,
		accessToken: jwt.sign({ id: player.id, name: player.displayName, email: player.email }, config.JWT_SECRET, {
			algorithm: "HS256",
			expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
			issuer: config.JWT_ISSUER,
			audience: config.JWT_AUDIENCE,
		}),
	};
}

function toPublicPlayer(player: { id: string; displayName: string; email: string | null; totalXp: number }): PublicPlayer {
	return {
		id: player.id,
		displayName: player.displayName,
		email: player.email,
		totalXp: player.totalXp,
		...levelProgress(player.totalXp),
	};
}

function throwInvalidCredentials(): never {
	throw new ApiError(401, AUTH_FEEDBACK_MESSAGES.INVALID_CREDENTIALS);
}
