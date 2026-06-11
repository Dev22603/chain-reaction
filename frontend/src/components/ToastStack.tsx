import { AlertTriangle, Sparkles, WifiOff } from "lucide-react";
import type { LastError } from "@/lib/types";

interface ToastStackProps {
  disconnected: boolean;
  error: LastError | null;
  notice: string | null;
  compact?: boolean;
}

export function ToastStack({ disconnected, error, notice, compact = false }: ToastStackProps) {
  if (!disconnected && !error && !notice) {
    return null;
  }

  const paddingClass = compact ? "px-4 py-2 text-xs" : "px-4 py-3 text-sm";
  const wifiIconSize = compact ? 14 : 16;
  const alertIconSize = compact ? 14 : 16;
  const sparklesIconSize = compact ? 12 : 14;

  return (
    <div className="grid gap-2">
      {disconnected ? (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border-2 border-danger/60 bg-surface ${paddingClass} text-danger shadow-panel`}
        >
          <WifiOff size={wifiIconSize} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-semibold leading-relaxed">
            {compact
              ? "Connection lost. Reconnecting…"
              : "Connection lost. Reconnecting, the game will resume in a moment."}
          </span>
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-xl border-2 border-danger/60 bg-surface ${paddingClass} text-danger shadow-panel [animation:panel-rise_0.4s_ease-out_both]`}
        >
          <AlertTriangle size={alertIconSize} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-semibold leading-relaxed">{error.message}</span>
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border-2 border-secondary/60 bg-surface ${paddingClass} text-secondary-deep shadow-panel [animation:panel-rise_0.4s_ease-out_both]`}
        >
          <Sparkles size={sparklesIconSize} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-semibold leading-relaxed">{notice}</span>
        </div>
      ) : null}
    </div>
  );
}
