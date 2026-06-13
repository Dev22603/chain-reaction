"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, Home, Trophy, UserX } from "lucide-react";
import {
  ApiClientError,
  playersApi,
  type MatchHistoryEntry,
  type PlayerModeStats,
  type PlayerProfile
} from "@/lib/api";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatsTable, type StatsColumn } from "@/components/ui/stats-table";
import { BOARD_PRESETS } from "@/lib/presets";

function presetLabel(key: string): string {
  return BOARD_PRESETS.find((preset) => preset.key === key)?.label ?? key;
}

const MODE_STATS_COLUMNS: Array<StatsColumn<PlayerModeStats>> = [
  {
    label: "Board",
    cellClass: "font-display text-fg",
    render: (stat) => presetLabel(stat.boardPreset)
  },
  { label: "Players", render: (stat) => stat.maxPlayers },
  {
    label: "XP",
    align: "right",
    cellClass: "font-display text-primary",
    render: (stat) => stat.xp
  },
  { label: "Wins", align: "right", render: (stat) => stat.wins },
  { label: "Losses", align: "right", render: (stat) => stat.losses },
  { label: "Games", align: "right", render: (stat) => stat.gamesPlayed }
];

export default function PlayerProfilePage() {
  const params = useParams<{ playerId: string }>();
  const playerId = useMemo(() => params.playerId, [params.playerId]);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const [profileResult, matchesResult] = await Promise.all([
          playersApi.profile(playerId),
          playersApi.matches(playerId, 20)
        ]);

        if (active) {
          setProfile(profileResult.profile);
          setMatches(matchesResult.matches);
        }
      } catch (caught) {
        if (active) {
          setError(caught instanceof ApiClientError ? caught.message : "Could not load profile.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [playerId]);

  const maxed = profile ? profile.xpForNextLevel === 0 : false;
  const xpPercent = profile
    ? maxed
      ? 100
      : profile.xpForNextLevel
        ? Math.min(100, Math.round((profile.xpIntoLevel / profile.xpForNextLevel) * 100))
        : 0
    : 0;

  return (
    <main className="relative z-10 mx-auto w-full max-w-[980px] px-4 py-8 sm:px-8">
      {error ? (
        <Card className="mx-auto grid w-[min(520px,100%)] gap-6 p-8 sm:p-10 [animation:panel-rise_0.5s_ease-out_both]" role="alert">
          <div className="grid gap-3 text-center">
            <UserX className="mx-auto text-secondary" size={40} aria-hidden="true" />
            <h1 className="font-display text-3xl text-fg sm:text-4xl">Player not found</h1>
            <p className="text-xs font-semibold leading-relaxed text-fg-muted">
              We couldn&apos;t find that player. The link may be old or the account may have been removed.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-secondary/60 bg-secondary/10 px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-secondary-deep transition hover:bg-secondary/20"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to leaderboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-line bg-surface px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-fg-muted transition hover:border-primary/60 hover:text-primary"
            >
              <Home size={14} aria-hidden="true" />
              Back to home
            </Link>
          </div>
        </Card>
      ) : null}

      {loading && !error ? (
        <Card className="p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-fg-muted">Loading profile…</p>
        </Card>
      ) : null}

      {!loading && profile ? (
        <div className="grid gap-6">
          <Card className="p-6 sm:p-8">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-3">
                <CardEyebrow>Player profile</CardEyebrow>
                <CardTitle className="break-words text-3xl sm:text-4xl">{profile.displayName}</CardTitle>
              </div>
              <Trophy className="text-accent" size={32} aria-hidden="true" />
            </header>

            <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="grid place-items-center gap-1 rounded-2xl border-2 border-accent bg-accent/10 px-6 py-4">
                <span className="font-display text-4xl text-[#7a4d00]">{profile.level}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-fg-muted">Level</span>
              </div>
              <div className="grid gap-2">
                <div className="flex items-baseline justify-between text-xs font-bold text-fg-muted">
                  <span className="uppercase tracking-[0.2em]">Total XP</span>
                  <span className="font-display text-xl text-primary">{profile.totalXp}</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full border-2 border-line bg-surface-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-b from-[#ffd95e] to-accent transition-[width] duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-fg-muted">
                  {maxed
                    ? "Max level reached"
                    : `${profile.xpIntoLevel} / ${profile.xpForNextLevel} XP to next level`}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <header className="mb-6 grid gap-2">
              <CardEyebrow>Stats per mode</CardEyebrow>
              <h2 className="font-display text-xl text-fg">Mode breakdown</h2>
            </header>

            {profile.modeStats.length === 0 ? (
              <EmptyState>No games played yet.</EmptyState>
            ) : (
              <StatsTable
                minWidthClass="min-w-[560px]"
                columns={MODE_STATS_COLUMNS}
                rows={profile.modeStats}
                rowKey={(stat) => `${stat.boardPreset}-${stat.maxPlayers}`}
              />
            )}
          </Card>

          <Card className="p-6 sm:p-8">
            <header className="mb-6 flex items-center justify-between gap-4">
              <div className="grid gap-2">
                <CardEyebrow>Recent matches</CardEyebrow>
                <h2 className="font-display text-xl text-fg">History</h2>
              </div>
              <History className="text-secondary" size={24} aria-hidden="true" />
            </header>

            {matches.length === 0 ? (
              <EmptyState>No matches saved yet.</EmptyState>
            ) : (
              <div className="grid gap-3">
                {matches.map((match) => (
                  <article key={match.matchId} className="rounded-xl border-2 border-line bg-surface-2 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-fg-muted">
                        {match.gridRows} x {match.gridCols} board · {match.maxPlayers} players · {match.turnCount} turns
                      </div>
                      <div className="text-xs font-bold text-primary">Winner: {match.winnerName}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.participants.map((participant) => (
                        <span
                          key={participant.playerId}
                          className={
                            participant.playerId === match.winnerId
                              ? "rounded-full border-2 border-accent/70 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-[#7a4d00]"
                              : "rounded-full border-2 border-line px-2.5 py-1 text-xs font-semibold text-fg-muted"
                          }
                        >
                          {participant.displayName}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </main>
  );
}
