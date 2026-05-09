"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow } from "@/components/ui/card";
import type { QueuedInfo } from "@/lib/types";

interface QueueScreenProps {
  info: QueuedInfo | null;
  onCancel: () => void;
}

export function QueueScreen({ info, onCancel }: QueueScreenProps) {
  const position = info?.position ?? 0;
  const max = info?.maxPlayers ?? 0;
  const slots = max || 4;

  return (
    <Card
      className="mx-auto grid w-full max-w-[560px] gap-7 p-5 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both] sm:mt-[8vh] sm:p-10"
      aria-labelledby="queue-title"
    >
      <CardCorners />
      <div className="grid gap-3">
        <CardEyebrow>// awaiting fission</CardEyebrow>
        <h1 id="queue-title" className="font-display text-3xl uppercase tracking-[0.05em] text-fg sm:text-4xl">
          Spinning Up<span className="ml-1 inline-block animate-[blink-cursor_1s_steps(1)_infinite] text-cherenkov">_</span>
        </h1>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
          {info?.mode ?? "casual"} queue
        </span>
      </div>

      <div className="relative">
        <div className="grid gap-2 font-display text-[11px] uppercase tracking-[0.3em] text-fg-muted">
          <div className="flex items-baseline justify-between">
            <span>Operators</span>
            <span className="text-fg">
              {position}<span className="text-fg-muted">/{max || "-"}</span>
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: slots }, (_, idx) => {
              const filled = idx < position;
              return (
                <div
                  key={idx}
                  className={
                    filled
                      ? "h-1.5 flex-1 bg-cherenkov shadow-cherenkov"
                      : "h-1.5 flex-1 bg-line"
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center">
          <div className="relative h-24 w-24">
            <span className="absolute inset-0 rounded-full border-2 border-line" />
            <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-cherenkov [animation:spinner-ring_1.4s_linear_infinite]" />
            <span className="absolute inset-3 rounded-full border border-transparent border-t-reactor [animation:spinner-ring_2.2s_linear_infinite_reverse]" />
            <span className="absolute inset-0 grid place-items-center font-display text-xs tracking-[0.2em] text-cherenkov">
              SYNC
            </span>
          </div>
        </div>
      </div>

      <Button variant="ghost" onClick={onCancel}>
        <X size={16} aria-hidden="true" />
        Abort
      </Button>
    </Card>
  );
}
