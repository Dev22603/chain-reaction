"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ChevronLeft, LogIn, UserPlus } from "lucide-react";
import { authApi, ApiClientError } from "@/lib/api";
import { setStoredAccessToken } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/GoogleIcon";

interface AuthPanelProps {
  mode: "login" | "signup";
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isSignup
        ? await authApi.signup({ displayName: displayName.trim(), email, password })
        : await authApi.login({ email, password });

      setStoredAccessToken(result.accessToken);
      router.push("/");
      router.refresh();
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

  return (
    <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-[560px] place-items-center px-4 py-8">
      <Card className="w-full p-8 [animation:panel-rise_0.5s_ease-out_both] sm:p-10">
        <CardCorners />
        <header className="mb-8 grid gap-3">
          <CardEyebrow>{isSignup ? "Create account" : "Welcome back"}</CardEyebrow>
          <CardTitle className="text-3xl sm:text-4xl">
            {isSignup ? "Sign Up" : "Login"}
          </CardTitle>
        </header>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          {isSignup ? (
            <Input
              name="displayName"
              label="Display Name"
              value={displayName}
              maxLength={100}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="nickname"
              required
            />
          ) : null}

          <Input
            name="email"
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <Input
            name="password"
            label="Password"
            type="password"
            value={password}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />

          {error ? (
            <div role="alert" className="rounded-xl border-2 border-danger/50 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" variant="primary" disabled={loading}>
            {isSignup ? <UserPlus size={16} aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
            {loading ? "Working" : isSignup ? "Create Account" : "Login"}
          </Button>
        </form>

        <div className="mt-5 grid gap-4">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-fg-soft">
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            or
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
          <Button size="lg" variant="ghost" onClick={handleGoogleSignIn} disabled={googleLoading}>
            <GoogleIcon />
            {googleLoading ? "Redirecting" : "Continue with Google"}
          </Button>
        </div>

        <div className="mt-6 grid gap-3 border-t border-line pt-5 text-center text-xs font-semibold text-fg-muted">
          {isSignup ? (
            <Link href="/login" className="text-secondary-deep hover:text-fg">
              Already have an account?
            </Link>
          ) : (
            <Link href="/signup" className="text-secondary-deep hover:text-fg">
              Create an account
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.32em] text-fg-soft hover:text-fg-muted"
          >
            <ChevronLeft size={12} aria-hidden="true" />
            Back to home
          </Link>
        </div>
      </Card>
    </main>
  );
}
