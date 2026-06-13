"use client";

import { useEffect, useState } from "react";
import { Mail, UserPlus, X } from "lucide-react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { GoogleIcon } from "@/components/GoogleIcon";
import { useAuthForm, type AuthMode } from "@/hooks/useAuthForm";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful login/signup, once the token is stored. */
  onSuccess: () => void;
  onInteract?: () => void;
}

// Smash-Karts-style blue sign-in modal. Same auth flows as AuthPanel, but it
// stays on top of the current screen instead of navigating to /login.
export function AuthDialog({ open, onClose, onSuccess, onInteract }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const form = useAuthForm({
    mode,
    onSuccess: () => {
      onSuccess();
      onClose();
    }
  });
  const { isSignup } = form;

  useEffect(() => {
    if (!open) {
      setMode("login");
      form.reset();
    }
    // form.reset is recreated each render; keying on `open` alone is intended.
  }, [open]);

  return (
    <DialogShell open={open} onClose={onClose} titleId="auth-dialog-title" variant="blue">
      <div className="grid gap-4 p-5 sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="game-btn-shadow absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-gradient-to-b from-[#57b0ff] to-secondary text-white [--btn-depth:var(--color-secondary-deep)]"
        >
          <X size={16} strokeWidth={3} aria-hidden="true" />
        </button>

        <h2
          id="auth-dialog-title"
          className="m-0 text-center font-display text-3xl tracking-wide text-white [text-shadow:0_3px_0_rgba(13,47,86,0.4)]"
        >
          {isSignup ? "Sign Up" : "Sign In"}
        </h2>

        <button
          type="button"
          onClick={() => {
            onInteract?.();
            void form.handleGoogleSignIn();
          }}
          disabled={form.googleLoading}
          className="game-btn-shadow inline-flex w-full items-center justify-center gap-2.5 rounded-2xl border-[3px] border-white/90 bg-white px-4 py-3 font-display text-sm tracking-wide text-fg [--btn-depth:#b9cfe4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {form.googleLoading ? "Redirecting…" : `Sign ${isSignup ? "up" : "in"} with Google`}
        </button>

        <div className="flex items-center gap-3 font-display text-[10px] tracking-[0.32em] text-white/75">
          <span className="h-px flex-1 bg-white/35" aria-hidden="true" />
          OR
          <span className="h-px flex-1 bg-white/35" aria-hidden="true" />
        </div>

        <form className="grid gap-3.5" onSubmit={form.handleSubmit}>
          {isSignup ? (
            <Field
              label="Display Name"
              name="displayName"
              value={form.displayName}
              maxLength={100}
              autoComplete="nickname"
              onChange={form.setDisplayName}
            />
          ) : null}

          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            autoComplete="email"
            onChange={form.setEmail}
          />

          <Field
            label="Password"
            name="password"
            type="password"
            value={form.password}
            minLength={8}
            autoComplete={isSignup ? "new-password" : "current-password"}
            onChange={form.setPassword}
          />

          {form.error ? (
            <div
              role="alert"
              className="rounded-xl border-2 border-[#ffb0c8] bg-[#d6336c]/35 px-4 py-3 text-sm font-bold text-white"
            >
              {form.error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={form.loading}
            className="btn-primary game-btn-shadow w-full px-4 py-3 text-base tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSignup ? (
              <UserPlus size={16} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Mail size={16} strokeWidth={2.5} aria-hidden="true" />
            )}
            {form.loading ? "Working…" : isSignup ? "Create Account" : "Sign in with Email"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            onInteract?.();
            form.clearError();
            setMode(isSignup ? "login" : "signup");
          }}
          className="justify-self-center text-xs font-bold text-white/85 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          {isSignup ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </DialogShell>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}

// White-on-blue form field; the shared Input component is styled for white
// surface panels, so the blue dialog carries its own.
function Field({ label, name, value, onChange, type = "text", minLength, maxLength, autoComplete }: FieldProps) {
  return (
    <label htmlFor={`auth-${name}`} className="grid gap-1.5">
      <span className="font-display text-[10px] uppercase tracking-[0.32em] text-white/85">
        {label}
      </span>
      <input
        id={`auth-${name}`}
        name={name}
        type={type}
        value={value}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
        required
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full min-w-0 rounded-xl border-2 border-white/80 bg-white px-4 py-2.5 text-sm font-semibold text-fg transition-colors placeholder:text-fg-muted focus:border-accent focus:outline-none"
      />
    </label>
  );
}
