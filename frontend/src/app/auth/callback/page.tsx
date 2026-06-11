"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { authApi, ApiClientError } from "@/lib/api";
import { setStoredAccessToken } from "@/lib/auth";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";

const GENERIC_ERROR = "Google sign-in could not be completed.";

export default function AuthCallbackPage() {
  const router = useRouter();
  const startedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The OAuth code is single-use; guard against React Strict Mode running
    // this effect twice in development.
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;

    async function completeSignIn() {
      const params = new URLSearchParams(window.location.search);
      const oauthError = params.get("error_description") ?? params.get("error");
      if (oauthError) {
        setError(oauthError);
        return;
      }

      const code = params.get("code");
      const supabase = getSupabaseClient();
      if (!code || !supabase) {
        setError(GENERIC_ERROR);
        return;
      }

      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError || !data.session) {
          setError(exchangeError?.message ?? GENERIC_ERROR);
          return;
        }

        const result = await authApi.googleLogin(data.session.access_token);

        // The Supabase session only existed to prove the Google identity.
        await supabase.auth.signOut({ scope: "local" });

        setStoredAccessToken(result.accessToken);
        router.replace("/");
        router.refresh();
      } catch (caught) {
        setError(caught instanceof ApiClientError ? caught.message : GENERIC_ERROR);
      }
    }

    void completeSignIn();
  }, [router]);

  return (
    <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-[560px] place-items-center px-4 py-8">
      <Card className="w-full p-8 [animation:panel-rise_0.5s_ease-out_both] sm:p-10">
        <CardCorners />
        <header className="mb-6 grid gap-3">
          <CardEyebrow>{error ? "Sign-in failed" : "Almost there"}</CardEyebrow>
          <CardTitle className="text-3xl sm:text-4xl">
            {error ? "Google Sign-In" : "Signing you in"}
          </CardTitle>
        </header>

        {error ? (
          <div className="grid gap-5">
            <div role="alert" className="rounded-xl border-2 border-danger/50 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
              {error}
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.32em] text-fg-soft hover:text-fg-muted"
            >
              <ChevronLeft size={12} aria-hidden="true" />
              Back to login
            </Link>
          </div>
        ) : (
          <p className="text-sm font-semibold text-fg-muted">
            Finishing your Google sign-in. This only takes a moment.
          </p>
        )}
      </Card>
    </main>
  );
}
