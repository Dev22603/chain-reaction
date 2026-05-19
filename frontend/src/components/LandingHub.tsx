"use client";

import { ArrowUpRight, KeyRound, Play, Plus, Sparkles, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AtomicHero } from "@/components/AtomicHero";
import { CreateRoomDialog, type CreateRoomConfig } from "@/components/dialogs/CreateRoomDialog";
import { JoinRoomDialog } from "@/components/dialogs/JoinRoomDialog";

const PLAYER_OPTIONS = [2, 3, 4, 5, 6, 7, 8] as const;

interface LandingHubProps {
  isAuthenticated: boolean;
  displayName: string | null;
  onPlay: (playerCount: number) => void;
  onCreate: (config: CreateRoomConfig) => void;
  onJoin: (code: string) => void;
  onInteract?: () => void;
}

export function LandingHub({
  isAuthenticated,
  displayName,
  onPlay,
  onCreate,
  onJoin,
  onInteract
}: LandingHubProps) {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const tickerWords = useMemo(
    () => [
      "criticality",
      "fission",
      "lattice",
      "cascade",
      "isotope",
      "reactor",
      "yield",
      "moderator",
      "radium",
      "uranium"
    ],
    []
  );

  const handlePlay = useCallback(() => {
    onInteract?.();
    onPlay(playerCount);
  }, [onInteract, onPlay, playerCount]);

  const handleOpenCreate = useCallback(() => {
    onInteract?.();
    setCreateOpen(true);
  }, [onInteract]);

  const handleOpenJoin = useCallback(() => {
    onInteract?.();
    setJoinOpen(true);
  }, [onInteract]);

  return (
    <>
      <div className="relative mx-auto grid w-full max-w-[1180px] gap-12 [animation:panel-rise_0.7s_cubic-bezier(0.2,0.8,0.4,1)_both] lg:gap-16">
        <section className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="relative grid content-center gap-6">
            <p className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-cherenkov/80">
              <span className="inline-block h-1.5 w-1.5 animate-[orb-pulse_1.8s_ease-in-out_infinite] rounded-full bg-cherenkov" />
              est. 2025
              <span className="text-fg-muted">/</span>
              atomic edition
              <span className="text-fg-muted">/</span>
              <span className="text-radium">{isAuthenticated ? "ranked + casual" : "play as guest"}</span>
            </p>

            <h1 className="font-display text-fg" aria-label="Chain Reaction">
              <span className="block text-[clamp(4.5rem,16vw,11rem)] font-black uppercase leading-[0.78] tracking-[-0.02em] [animation:hero-reveal_1s_cubic-bezier(0.2,0.8,0.4,1)_both]">
                Chain
              </span>
              <span className="relative block text-[clamp(4.5rem,16vw,11rem)] font-black uppercase leading-[0.78] tracking-[-0.02em] text-reactor [animation:hero-reveal_1s_cubic-bezier(0.2,0.8,0.4,1)_0.15s_both]">
                Reaction
                <span
                  aria-hidden
                  className="absolute -right-2 top-2 hidden font-mono text-[10px] tracking-[0.4em] text-fg-muted lg:inline-block"
                >
                  v.1
                </span>
              </span>
            </h1>

            <p className="max-w-[36ch] font-editorial text-base italic leading-relaxed text-fg-soft sm:text-lg">
              Stack orbs, trigger criticality, overwhelm the lattice.
              <span className="text-paper">
                {" "}
                Quick-match a stranger or rally the office.
              </span>
            </p>

            <div className="mt-2 inline-flex items-center gap-3 self-start border border-line bg-bg-soft/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-radium shadow-[0_0_10px_rgba(182,255,60,0.7)]" />
              reactor online
              <span className="text-fg-soft">{isAuthenticated && displayName ? `· ${displayName}` : "· anonymous operator"}</span>
            </div>
          </div>

          <AtomicHero className="relative mx-auto h-[320px] w-full max-w-[460px] sm:h-[400px] lg:h-[480px]" />
        </section>

        <section className="relative grid gap-7">
          <div className="grid gap-3">
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.42em] text-fg-soft">
                <span className="text-reactor">01</span> Reactors
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
                quick match size · 2 — 8
              </p>
            </div>

            <div
              className="grid grid-cols-7 gap-2 sm:gap-3"
              role="radiogroup"
              aria-label="Number of reactors"
            >
              {PLAYER_OPTIONS.map((count, idx) => {
                const active = playerCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      onInteract?.();
                      setPlayerCount(count);
                    }}
                    style={{ animationDelay: `${0.05 * idx + 0.2}s` }}
                    className={
                      "group relative grid aspect-[3/4] place-items-center overflow-hidden border font-display text-3xl font-black uppercase tracking-tight transition-all duration-200 [animation:chip-pop_0.4s_ease-out_both] sm:text-4xl " +
                      (active
                        ? "border-reactor bg-reactor text-bg shadow-reactor"
                        : "border-line bg-bg-soft text-fg-soft hover:border-cherenkov hover:text-cherenkov")
                    }
                  >
                    <span className="absolute left-1.5 top-1 font-mono text-[8px] tracking-[0.2em] opacity-60">
                      0{count}
                    </span>
                    <span className="leading-none">{count}</span>
                    <span className="absolute bottom-1 right-1.5 font-mono text-[8px] uppercase tracking-[0.18em] opacity-70">
                      {count === 2 ? "duel" : count <= 4 ? "rally" : count <= 6 ? "skirmish" : "melee"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-end justify-between gap-3">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.42em] text-fg-soft">
                <span className="text-reactor">02</span> Initiate
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-muted">
                pick one
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
              <ActionTile
                tone="primary"
                eyebrow="Quick · Public"
                title="Play"
                description={`Match into a ${playerCount}-player lobby.`}
                shortcut="P"
                icon={<Play size={20} strokeWidth={2.5} aria-hidden="true" />}
                onClick={handlePlay}
              />
              <ActionTile
                tone="paper"
                eyebrow="Private · Shareable"
                title="Create"
                description="Configure a room, share the code."
                shortcut="C"
                icon={<Plus size={20} strokeWidth={2.5} aria-hidden="true" />}
                onClick={handleOpenCreate}
              />
              <ActionTile
                tone="line"
                eyebrow="Friend · Office"
                title="Join"
                description="Got a code? Drop into the lobby."
                shortcut="J"
                icon={<KeyRound size={20} strokeWidth={2.5} aria-hidden="true" />}
                onClick={handleOpenJoin}
              />
            </div>
          </div>

          {!isAuthenticated ? (
            <Link
              href="/login"
              onClick={() => onInteract?.()}
              className="group relative flex items-center justify-between gap-4 overflow-hidden border border-uranium/40 bg-gradient-to-r from-uranium/10 via-uranium/5 to-transparent px-5 py-4 transition-colors hover:border-uranium hover:from-uranium/15"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-uranium/15 text-uranium">
                  <Sparkles size={16} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="grid gap-0.5">
                  <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-uranium">
                    Sign in to bank XP
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted">
                    optional · play the same matches · climb the ladder
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.3em] text-uranium opacity-80 group-hover:opacity-100">
                continue
                <ArrowUpRight size={14} aria-hidden="true" />
              </span>
            </Link>
          ) : (
            <Link
              href="/leaderboard"
              onClick={() => onInteract?.()}
              className="group flex items-center justify-between gap-4 border border-line bg-bg-soft/40 px-5 py-4 transition-colors hover:border-cherenkov"
            >
              <div className="flex items-center gap-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cherenkov/10 text-cherenkov">
                  <Trophy size={16} strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div className="grid gap-0.5">
                  <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-fg">
                    Ranking — see where you stand
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted">
                    ranked & casual · global leaderboard
                  </p>
                </div>
              </div>
              <ArrowUpRight size={14} aria-hidden="true" className="text-fg-muted group-hover:text-cherenkov" />
            </Link>
          )}
        </section>

        <Ticker words={tickerWords} />
      </div>

      <CreateRoomDialog
        open={createOpen}
        defaultPlayers={playerCount}
        onClose={() => setCreateOpen(false)}
        onConfirm={(config) => {
          setCreateOpen(false);
          onCreate(config);
        }}
        onInteract={onInteract}
      />

      <JoinRoomDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onConfirm={(code) => {
          setJoinOpen(false);
          onJoin(code);
        }}
        onInteract={onInteract}
      />
    </>
  );
}

interface ActionTileProps {
  tone: "primary" | "paper" | "line";
  eyebrow: string;
  title: string;
  description: string;
  shortcut: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ActionTile({ tone, eyebrow, title, description, shortcut, icon, onClick }: ActionTileProps) {
  const toneClasses =
    tone === "primary"
      ? "border-reactor bg-gradient-to-br from-reactor/95 via-reactor to-reactor-glow text-bg shadow-reactor hover:scale-[1.02] hover:shadow-[0_0_0_1px_rgba(255,138,76,0.7),0_0_44px_rgba(255,138,76,0.55)]"
      : tone === "paper"
        ? "border-paper/60 bg-paper text-bg hover:bg-paper-dim hover:scale-[1.01] hover:shadow-[0_18px_44px_rgba(241,234,208,0.18)]"
        : "border-line bg-bg-soft/70 text-fg hover:border-cherenkov hover:text-cherenkov hover:shadow-cherenkov";

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group relative grid min-h-[156px] content-between gap-5 overflow-hidden border px-6 py-5 text-left transition-all duration-200 active:translate-y-px " +
        toneClasses
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 grid h-24 w-24 place-items-center rounded-full border border-current/30 opacity-30 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110"
      >
        <span className="h-8 w-8 rounded-full border border-current/50" />
      </span>

      <span className="flex items-start justify-between gap-3">
        <span
          className={
            "font-mono text-[10px] uppercase tracking-[0.32em] " +
            (tone === "paper" ? "text-bg/70" : tone === "primary" ? "text-bg/80" : "text-fg-muted")
          }
        >
          // {eyebrow}
        </span>
        <span
          className={
            "grid h-6 w-6 place-items-center border font-mono text-[10px] " +
            (tone === "paper"
              ? "border-bg/40 text-bg/70"
              : tone === "primary"
                ? "border-bg/40 text-bg/80"
                : "border-line text-fg-muted")
          }
        >
          {shortcut}
        </span>
      </span>

      <span className="grid gap-2">
        <span className="flex items-center gap-3">
          <span
            className={
              "grid h-10 w-10 place-items-center " +
              (tone === "paper" ? "bg-bg/10 text-bg" : tone === "primary" ? "bg-bg/15 text-bg" : "bg-cherenkov/10 text-cherenkov")
            }
          >
            {icon}
          </span>
          <span
            className={
              "block font-display text-4xl font-black uppercase leading-none tracking-tight sm:text-5xl " +
              (tone === "paper" ? "text-bg" : tone === "primary" ? "text-bg" : "text-fg")
            }
          >
            {title}
          </span>
        </span>
        <span
          className={
            "block max-w-[28ch] text-sm leading-snug " +
            (tone === "paper" ? "text-bg/70" : tone === "primary" ? "text-bg/85" : "text-fg-muted")
          }
        >
          {description}
        </span>
      </span>
    </button>
  );
}

function Ticker({ words }: { words: string[] }) {
  const doubled = [...words, ...words, ...words];
  return (
    <div
      aria-hidden
      className="relative -mx-3 overflow-hidden border-y border-line/70 bg-bg-soft/40 py-3 sm:-mx-6 lg:-mx-8"
    >
      <div
        className="flex shrink-0 gap-10 font-display text-sm font-semibold uppercase tracking-[0.32em] text-fg-muted [animation:ticker-scroll_42s_linear_infinite] whitespace-nowrap"
      >
        {doubled.map((word, idx) => (
          <span key={`${word}-${idx}`} className="flex items-center gap-10">
            <Zap size={12} className="text-reactor" />
            <span className={idx % 5 === 0 ? "text-paper" : ""}>{word}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
