"use client";

import { FormEvent, useState } from "react";
import { authApi, ApiClientError } from "@/lib/api";
import { setStoredAccessToken } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";

export type AuthMode = "login" | "signup";

interface UseAuthFormOptions {
  mode: AuthMode;
  /** Called after a successful email login/signup, once the token is stored. */
  onSuccess: () => void;
}

// Form state and submit/Google flows shared by AuthPanel (the /login and
// /signup pages) and AuthDialog (the in-lobby modal). The two differ only in
// markup and in what happens after success.
export function useAuthForm({ mode, onSuccess }: UseAuthFormOptions) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isSignup
        ? await authApi.signup({ displayName: displayName.trim(), email, password })
        : await authApi.login({ email, password });

      setStoredAccessToken(result.accessToken);
      onSuccess();
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        setError(caught.errors[0] ?? caught.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Google sign-in is not configured.");
      return;
    }

    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });

    // On success the browser navigates away to Google; only failures land here.
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  function reset() {
    setDisplayName("");
    setEmail("");
    setPassword("");
    setError(null);
    setLoading(false);
    setGoogleLoading(false);
  }

  return {
    isSignup,
    displayName,
    setDisplayName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    googleLoading,
    handleSubmit,
    handleGoogleSignIn,
    clearError,
    reset
  };
}
