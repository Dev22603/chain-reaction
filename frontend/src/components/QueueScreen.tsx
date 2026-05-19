"use client";

import { X } from "lucide-react";
import { AtomicHero } from "@/components/AtomicHero";
import { Button } from "@/components/ui/button";
import type { QueuedInfo } from "@/lib/types";

interface QueueScreenProps {
  info: QueuedInfo | null;
  onCancel: () => void;
}

export function QueueScreen({ info, onCancel }: QueueScreenProps) {
  const position = info?.position ?? 1;
  const max = info?.maxPlayers ?? 0;
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
        <p className="font-editorial text-base italic text-fg-soft">
          Pairing {max ? `${max} reactors` : "operators"} into a {info?.mode === "ranked" ? "ranked" : "casual"} lattice.
        </p>
      </header>

      <section className="grid items-center gap-8 sm:grid-cols-[1fr_auto] sm:gap-12">
        <AtomicHero className="mx-auto h-[260px] w-full max-w-[320px] sm:h-[320px]" />

        <div className="grid min-w-[260px] gap-5 border border-line bg-bg-soft/50 p-5">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
              <span>operators</span>
              <span>
                <span className="text-fg">{position}</span>
                <span className="opacity-60">/{max || "-"}</span>
              </span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: slots }, (_, idx) => {
                const filled = idx < position;
                return (
                  <div
                    key={idx}
                    className={
                      "h-2 flex-1 transition-colors duration-300 " +
                      (filled ? "bg-reactor shadow-reactor" : "bg-line")
                    }
                  />
                );
              })}
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
            queue · {info?.mode ?? "casual"} <br />
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
