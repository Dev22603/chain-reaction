import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../constants/config";
import { LIMITS, REGEX } from "../constants/app.constants";
import { AUTH_FEEDBACK_MESSAGES } from "../constants/app.messages";
import { levelProgress } from "../constants/xp.constants";
import { getLogger } from "../lib/logger";
import { getSupabaseUser, isSupabaseAuthConfigured, SupabaseAuthUser } from "../lib/supabase";
import { playerRepository } from "../repositories/player.repositories";
import { validateGoogleLogin, validateLogin, validateSignup, validateUpdateProfile } from "../schemas/auth.schemas";
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

	async googleLogin(data: unknown): Promise<AuthResult> {
		const input = validateGoogleLogin(data);

		if (!isSupabaseAuthConfigured()) {
			throw new ApiError(503, AUTH_FEEDBACK_MESSAGES.GOOGLE_LOGIN_UNAVAILABLE);
		}

		let supabaseUser: SupabaseAuthUser | null;
		try {
			supabaseUser = await getSupabaseUser(input.accessToken);
		} catch (error) {
			logger.error("Supabase verification request failed", { error: (error as Error).message });
			throw new ApiError(503, AUTH_FEEDBACK_MESSAGES.GOOGLE_LOGIN_UNAVAILABLE);
		}

		// Only Google-authenticated Supabase identities may pass: Google verifies
		// email ownership, while other providers (e.g. Supabase email signup with
		// the anon key) would let anyone claim an existing account by email.
		const providers = [supabaseUser?.app_metadata?.provider, ...(supabaseUser?.app_metadata?.providers ?? [])];
		const email = supabaseUser?.email?.trim().toLowerCase();
		if (!supabaseUser || !email || !providers.includes("google")) {
			throw new ApiError(401, AUTH_FEEDBACK_MESSAGES.GOOGLE_LOGIN_FAILED);
		}

		// Link by email: a Google sign-in whose email matches an existing
		// email/password account logs into that same account.
		const existing = await playerRepository.findByEmail(email);
		if (existing) {
			logger.info("Player logged in via Google", { playerId: existing.id });
			return buildAuthResult(toPublicPlayer(existing));
		}

		const player = await playerRepository.createOAuthAccount({
			id: randomUUID(),
			displayName: googleDisplayName(supabaseUser, email),
			email,
		});

		logger.info("Player signed up via Google", { playerId: player.id });
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

// Google names can contain characters the displayName rules reject (digits,
// dots, accents), so sanitize to the allowed alphabet instead of failing the
// sign-in over a name.
function googleDisplayName(user: SupabaseAuthUser, email: string): string {
	const raw = user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split("@")[0] ?? "";
	const cleaned = raw
		.replace(/[^A-Za-z _-]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, LIMITS.DISPLAY_NAME_MAX)
		.trim();
	return REGEX.DISPLAY_NAME.test(cleaned) ? cleaned : "Player";
}

function throwInvalidCredentials(): never {
	throw new ApiError(401, AUTH_FEEDBACK_MESSAGES.INVALID_CREDENTIALS);
}
