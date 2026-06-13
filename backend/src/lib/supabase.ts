import { config } from "../constants/config";
import { getLogger } from "./logger";

const logger = getLogger("supabase");

const VERIFY_TIMEOUT_MS = 8_000;

export interface SupabaseAuthUser {
	id: string;
	email?: string;
	app_metadata?: {
		provider?: string;
		providers?: string[];
	};
	user_metadata?: {
		full_name?: string;
		name?: string;
	};
}

export function isSupabaseAuthConfigured(): boolean {
	return Boolean(config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
}

// Verifies a Supabase Auth access token by asking Supabase which user it
// belongs to. Returns null for an invalid/expired token; throws on network
// failure so callers can distinguish "bad token" from "Supabase unreachable".
export async function getSupabaseUser(accessToken: string): Promise<SupabaseAuthUser | null> {
	if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
		throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
	}

	const response = await fetch(`${config.SUPABASE_URL}/auth/v1/user`, {
		headers: {
			apikey: config.SUPABASE_ANON_KEY,
			Authorization: `Bearer ${accessToken}`,
		},
		signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
	});

	if (!response.ok) {
		logger.warn("Supabase token verification rejected", { status: response.status });
		return null;
	}

	return (await response.json()) as SupabaseAuthUser;
}
