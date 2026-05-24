"use client";

import { Check, Copy, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { QueuedInfo } from "@/lib/types";

interface QueueScreenProps {
  info: QueuedInfo | null;
  code?: string | null;
  onCancel: () => void;
}

export function QueueScreen({ info, code, onCancel }: QueueScreenProps) {
  const position = info?.position ?? 1;
  const max = info?.maxPlayers ?? 0;
  const isPrivate = !!code;

  if (isPrivate && code) {
    return (
      <PrivateQueueScreen
        code={code}
        position={position}
        max={max}
        onCancel={onCancel}
      />
    );
  }

  return (
    <CasualQueueScreen
      position={position}
      max={max}
      mode={info?.mode ?? "casual"}
      onCancel={onCancel}
    />
  );
}

// ─── Private room: hero invite code + crew slots ──────────────────────

function PrivateQueueScreen({
  code,
  position,
  max,
  onCancel
}: {
  code: string;
  position: number;
  max: number;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const slots = max || 4;
  const percent = max > 0 ? Math.min(100, Math.round((position / max) * 100)) : 0;

  async function handleCopy() {
    try { await navigator.clipboard.writeText(code); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="relative mx-auto grid w-full max-w-[640px] gap-8 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <header className="grid gap-3">
        <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.42em] text-cherenkov/80">
          <span className="h-1.5 w-1.5 animate-[orb-pulse_1.8s_ease-in-out_infinite] rounded-full bg-cherenkov" />
          // room created
        </p>
        <h1 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight text-fg sm:text-7xl">
          Share the code
          <span className="ml-2 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-cherenkov">_</span>
        </h1>
        <p className="font-body text-base text-fg-soft">
          Send this code to friends. The lattice starts when {max} reactor{max === 1 ? "" : "s"} are linked.
        </p>
      </header>

      {/* Invite code tiles */}
      <div className="grid gap-6 rounded-2xl border border-cherenkov/20 bg-cherenkov/5 p-6 sm:p-8">
        <div className="invite-code-tiles">
          {code.split("").map((ch, i) => (
            <span
              key={i}
              className="invite-code-tile"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {ch}
            </span>
          ))}
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCopy}
            className={
              "inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors " +
              (copied
                ? "border-radium/50 bg-radium/10 text-radium"
                : "border-cherenkov/40 bg-cherenkov/10 text-cherenkov hover:border-cherenkov hover:bg-cherenkov/20")
            }
          >
            {copied ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{copied ? "Copied!" : "Copy code"}</span>
          </button>
        </div>
      </div>

      {/* Crew progress */}
      <div className="grid gap-3 border border-line bg-bg-soft/50 p-5">
        <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
          <span>crew</span>
          <span>
            <span className="text-fg">{position}</span>
            <span className="opacity-60">/{max || "–"}</span>
          </span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: slots }, (_, i) => (
            <div
              key={i}
              className={"h-2 flex-1 rounded-full transition-colors duration-500 " + (i < position ? "bg-cherenkov shadow-[0_0_8px_rgba(42,216,255,0.55)]" : "bg-line")}
            />
          ))}
        </div>
        <div className="mt-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
          <span>room · private</span>
          <span>status · open</span>
        </div>
        {/* Progress bar */}
        <div className="relative h-8 overflow-hidden border border-line bg-bg">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cherenkov/70 to-cherenkov transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
          <div className="relative grid h-full place-items-center font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-paper mix-blend-difference">
            {percent}%
          </div>
        </div>
      </div>

      <Button variant="ghost" size="md" onClick={onCancel} className="justify-self-start">
        <X size={14} aria-hidden="true" />
        Cancel room
      </Button>
    </div>
  );
}

// ─── Casual matchmaking queue ─────────────────────────────────────────

function CasualQueueScreen({
  position,
  max,
  mode,
  onCancel
}: {
  position: number;
  max: number;
  mode: string;
  onCancel: () => void;
}) {
  const slots = max || 4;
  const percent = max > 0 ? Math.min(100, Math.round((position / max) * 100)) : 0;

  return (
    <div className="relative mx-auto grid w-full max-w-[720px] gap-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <header className="grid gap-3">
        <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.42em] text-cherenkov/80">
          <span className="h-1.5 w-1.5 animate-[orb-pulse_1.8s_ease-in-out_infinite] rounded-full bg-cherenkov" />
          // awaiting fission
        </p>
        <h1 className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight text-fg sm:text-7xl">
          Spinning up
          <span className="ml-2 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-reactor">_</span>
        </h1>
        <p className="font-body text-base italic text-fg-soft">
          Pairing {max ? `${max} reactors` : "operators"} into a {mode === "ranked" ? "ranked" : "casual"} lattice.
        </p>
      </header>

      <section className="grid items-center gap-8 sm:grid-cols-[1fr_auto] sm:gap-12">
        {/* Orb visual */}
        <div className="relative mx-auto h-[220px] w-full max-w-[280px] sm:h-[280px]">
          {[
            { color: "#ff3b6b", x: "20%", y: "45%", s: 52 },
            { color: "#25d3ff", x: "48%", y: "25%", s: 64 },
            { color: "#ffd23f", x: "75%", y: "50%", s: 44 },
            { color: "#5cff9b", x: "35%", y: "72%", s: 36 },
            { color: "#ff6b1f", x: "65%", y: "74%", s: 48 },
          ].map((orb, i) => (
            <span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: orb.x,
                top: orb.y,
                width: orb.s,
                height: orb.s,
                background: `radial-gradient(circle at 32% 30%, #fff, ${orb.color} 55%, color-mix(in srgb, ${orb.color} 55%, #000))`,
                boxShadow: `0 0 24px ${orb.color}, inset 0 0 8px rgba(255,255,255,.35)`,
                animation: `orb-pulse ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="grid min-w-[240px] gap-5 border border-line bg-bg-soft/50 p-5">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
              <span>operators</span>
              <span>
                <span className="text-fg">{position}</span>
                <span className="opacity-60">/{max || "–"}</span>
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: slots }, (_, i) => (
                <div
                  key={i}
                  className={"h-2 flex-1 transition-colors duration-300 " + (i < position ? "bg-reactor" : "bg-line")}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2 border-t border-line/60 pt-4">
            <p className="font-display text-[10px] uppercase tracking-[0.4em] text-fg-soft">progress</p>
            <div className="relative h-12 overflow-hidden border border-line bg-bg">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-reactor via-reactor-glow to-uranium transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
              <div className="relative grid h-full place-items-center font-display text-sm font-semibold uppercase tracking-[0.3em] text-paper mix-blend-difference">
                {percent}%
              </div>
            </div>
          </div>

          <p className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.26em] text-fg-muted">
            queue · {mode} <br />
            est. wait · low
          </p>
        </div>
      </section>

      <Button variant="ghost" size="md" onClick={onCancel} className="justify-self-start">
        <X size={14} aria-hidden="true" />
        Abort sequence
      </Button>
    </div>
  );
}
