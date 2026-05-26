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
          className={`flex items-start gap-3 border border-p1/50 bg-p1/5 ${paddingClass} text-p1`}
        >
          <WifiOff size={wifiIconSize} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-mono leading-relaxed">
            {compact
              ? "Reactor offline — reconnecting. Gameplay paused until the link is back."
              : "Reactor offline — reconnecting to the backend. Gameplay paused until the link is back."}
          </span>
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className={`flex items-start gap-3 border border-p1/50 bg-p1/5 ${paddingClass} text-p1 [animation:panel-rise_0.4s_ease-out_both]`}
        >
          <AlertTriangle size={alertIconSize} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-mono leading-relaxed">{error.message}</span>
        </div>
      ) : null}
      {notice ? (
        <div
          role="status"
          className={`flex items-start gap-3 border border-cherenkov/40 bg-cherenkov/5 ${paddingClass} text-cherenkov [animation:panel-rise_0.4s_ease-out_both]`}
        >
          <Sparkles size={sparklesIconSize} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span className="font-mono leading-relaxed">{notice}</span>
        </div>
      ) : null}
    </div>
  );
}
