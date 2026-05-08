"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { authApi, ApiClientError } from "@/lib/api";
import { setStoredAccessToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

  return (
    <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-[560px] place-items-center px-4 py-8">
      <Card className="w-full p-8 [animation:panel-rise_0.5s_ease-out_both] sm:p-10">
        <CardCorners />
        <header className="mb-8 grid gap-3">
          <CardEyebrow>{isSignup ? "// create operator" : "// operator access"}</CardEyebrow>
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
            <div role="alert" className="border border-p1/50 bg-p1/5 px-4 py-3 text-sm text-p1">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" variant="primary" disabled={loading}>
            {isSignup ? <UserPlus size={16} aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
            {loading ? "Working" : isSignup ? "Create Account" : "Login"}
          </Button>
        </form>

        <div className="mt-6 border-t border-line pt-5 text-center font-mono text-xs text-fg-muted">
          {isSignup ? (
            <Link href="/login" className="text-cherenkov hover:text-fg">
              Already have an account?
            </Link>
          ) : (
            <Link href="/signup" className="text-cherenkov hover:text-fg">
              Create an account
            </Link>
          )}
        </div>
      </Card>
    </main>
  );
}
