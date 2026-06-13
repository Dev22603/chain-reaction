"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/GoogleIcon";
import { useAuthForm, type AuthMode } from "@/hooks/useAuthForm";

interface AuthPanelProps {
  mode: AuthMode;
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const router = useRouter();
  const form = useAuthForm({
    mode,
    onSuccess: () => {
      router.push("/");
      router.refresh();
    }
  });
  const { isSignup } = form;

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

        <form className="grid gap-5" onSubmit={form.handleSubmit}>
          {isSignup ? (
            <Input
              name="displayName"
              label="Display Name"
              value={form.displayName}
              maxLength={100}
              onChange={(event) => form.setDisplayName(event.target.value)}
              autoComplete="nickname"
              required
            />
          ) : null}

          <Input
            name="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            autoComplete="email"
            required
          />

          <Input
            name="password"
            label="Password"
            type="password"
            value={form.password}
            minLength={8}
            onChange={(event) => form.setPassword(event.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
          />

          {form.error ? (
            <div role="alert" className="rounded-xl border-2 border-danger/50 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
              {form.error}
            </div>
          ) : null}

          <Button type="submit" size="lg" variant="primary" disabled={form.loading}>
            {isSignup ? <UserPlus size={16} aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
            {form.loading ? "Working" : isSignup ? "Create Account" : "Login"}
          </Button>
        </form>

        <div className="mt-5 grid gap-4">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-fg-soft">
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            or
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>
          <Button size="lg" variant="ghost" onClick={form.handleGoogleSignIn} disabled={form.googleLoading}>
            <GoogleIcon />
            {form.googleLoading ? "Redirecting" : "Continue with Google"}
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
