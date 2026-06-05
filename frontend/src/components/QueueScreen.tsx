"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CasualOrbCloud } from "@/components/queue/CasualOrbCloud";
import { CopyButton } from "@/components/queue/CopyButton";
import { InviteCodeTiles } from "@/components/queue/InviteCodeTiles";
import { QueueProgressBar } from "@/components/queue/QueueProgressBar";
import { QueueSlots } from "@/components/queue/QueueSlots";
import type { QueuedInfo } from "@/lib/types";

interface QueueScreenProps {
  info: QueuedInfo | null;
  code?: string | null;
  onCancel: () => void;
}

function percentFor(position: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((position / max) * 100));
}

export function QueueScreen({ info, code, onCancel }: QueueScreenProps) {
  const position = info?.position ?? 1;
  const max = info?.maxPlayers ?? 0;

  if (code) {
    return <PrivateQueueScreen code={code} position={position} max={max} onCancel={onCancel} />;
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
  const slots = max || 4;
  const percent = percentFor(position, max);

  return (
    <div className="relative mx-auto grid w-full max-w-[640px] gap-8 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <PrivateHeader max={max} />

      <div className="grid gap-6 rounded-2xl border border-cherenkov/20 bg-cherenkov/5 p-6 sm:p-8">
        <InviteCodeTiles code={code} />
        <div className="flex justify-center">
          <CopyButton
            value={code}
            className="border-cherenkov/40 bg-cherenkov/10 text-cherenkov hover:border-cherenkov hover:bg-cherenkov/20"
          />
        </div>
      </div>

      <CrewProgress position={position} max={max} slots={slots} percent={percent} />

      <Button variant="ghost" size="md" onClick={onCancel} className="justify-self-start">
        <X size={14} aria-hidden="true" />
        Cancel room
      </Button>
    </div>
  );
}

function PrivateHeader({ max }: { max: number }) {
  return (
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
  );
}

function CrewProgress({
  position,
  max,
  slots,
  percent
}: {
  position: number;
  max: number;
  slots: number;
  percent: number;
}) {
  return (
    <div className="grid gap-3 border border-line bg-bg-soft/50 p-5">
      <SlotsHeader label="crew" position={position} max={max} />
      <QueueSlots filled={position} total={slots} tone="cherenkov" />
      <div className="mt-1 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-fg-muted">
        <span>room · private</span>
        <span>status · open</span>
      </div>
      <QueueProgressBar percent={percent} tone="cherenkov" />
    </div>
  );
}

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
  const percent = percentFor(position, max);

  return (
    <div className="relative mx-auto grid w-full max-w-[720px] gap-10 [animation:panel-rise_0.6s_cubic-bezier(0.2,0.8,0.4,1)_both]">
      <CasualHeader max={max} mode={mode} />

      <section className="grid items-center gap-8 sm:grid-cols-[1fr_auto] sm:gap-12">
        <CasualOrbCloud />

        <div className="grid min-w-[240px] gap-5 border border-line bg-bg-soft/50 p-5">
          <div className="grid gap-2">
            <SlotsHeader label="operators" position={position} max={max} />
            <QueueSlots filled={position} total={slots} tone="reactor" />
          </div>

          <div className="grid gap-2 border-t border-line/60 pt-4">
            <p className="font-display text-[10px] uppercase tracking-[0.4em] text-fg-soft">progress</p>
            <QueueProgressBar percent={percent} tone="reactor" />
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

function CasualHeader({ max, mode }: { max: number; mode: string }) {
  return (
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
  );
}

function SlotsHeader({ label, position, max }: { label: string; position: number; max: number }) {
  return (
    <div className="flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
      <span>{label}</span>
      <span>
        <span className="text-fg">{position}</span>
        <span className="opacity-60">/{max || "–"}</span>
      </span>
    </div>
  );
}
