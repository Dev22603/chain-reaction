import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Supabase is used solely to run the Google OAuth handshake. The session it
// produces is exchanged for a backend JWT on /auth/callback and then dropped,
// so the client keeps no long-lived Supabase state.
export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  client ??= createClient(url, anonKey, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      autoRefreshToken: false
    }
  });

  return client;
}
