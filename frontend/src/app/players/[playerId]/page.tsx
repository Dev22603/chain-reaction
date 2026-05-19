"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, History, Home, Trophy, UserX } from "lucide-react";
import {
  ApiClientError,
  playersApi,
  type MatchHistoryEntry,
  type PlayerProfile
} from "@/lib/api";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";

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

  return (
    <main className="relative z-10 mx-auto w-full max-w-[980px] px-4 py-8 sm:px-8">
      {error ? (
        <Card className="mx-auto grid w-[min(520px,100%)] gap-6 p-8 sm:p-10 [animation:panel-rise_0.5s_ease-out_both]" role="alert">
          <CardCorners />
          <div className="grid gap-3 text-center">
            <CardEyebrow>// signal lost</CardEyebrow>
            <UserX className="mx-auto text-cherenkov" size={40} aria-hidden="true" />
            <h1 className="font-display text-3xl uppercase tracking-[0.06em] text-fg sm:text-4xl">
              Player not found
            </h1>
            <p className="font-mono text-xs leading-relaxed text-fg-muted">
              We could not locate an operator with that ID. They may have been purged from the reactor, or the link is stale.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 border border-cherenkov/60 bg-cherenkov/10 px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] text-cherenkov transition hover:bg-cherenkov/20"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              Back to leaderboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-line bg-bg-soft px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] text-fg-muted transition hover:border-reactor/60 hover:text-reactor"
            >
              <Home size={14} aria-hidden="true" />
              Back to home
            </Link>
          </div>
        </Card>
      ) : null}

      {loading && !error ? (
        <Card className="p-8 text-center">
          <CardCorners />
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-fg-muted">Loading profile</p>
        </Card>
      ) : null}

      {!loading && profile ? (
        <div className="grid gap-6">
          <Card className="p-6 sm:p-8">
            <CardCorners />
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-3">
                <CardEyebrow>// player profile</CardEyebrow>
                <CardTitle className="break-words text-3xl sm:text-4xl">{profile.displayName}</CardTitle>
              </div>
              <Trophy className="text-uranium" size={32} aria-hidden="true" />
            </header>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="Score" value={profile.score} tone="text-uranium" />
              <Stat label="Wins" value={profile.wins} />
              <Stat label="Losses" value={profile.losses} />
              <Stat label="Games" value={profile.gamesPlayed} />
              <Stat label="Forfeits" value={profile.forfeits} />
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <CardCorners />
            <header className="mb-6 flex items-center justify-between gap-4">
              <div className="grid gap-2">
                <CardEyebrow>// recent matches</CardEyebrow>
                <h2 className="font-display text-xl uppercase tracking-[0.08em] text-fg">History</h2>
              </div>
              <History className="text-cherenkov" size={24} aria-hidden="true" />
            </header>

            {matches.length === 0 ? (
              <div className="border border-line bg-bg-soft px-4 py-8 text-center font-mono text-xs uppercase tracking-[0.24em] text-fg-muted">
                No persisted matches yet
              </div>
            ) : (
              <div className="grid gap-3">
                {matches.map((match) => (
                  <article key={match.matchId} className="border border-line bg-bg-soft p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
                        {match.mode} - {match.gridRows} x {match.gridCols} - {match.turnCount} turns
                      </div>
                      <div className="font-mono text-xs text-uranium">Winner: {match.winnerName}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {match.participants.map((participant) => (
                        <span
                          key={participant.playerId}
                          className={
                            participant.playerId === match.winnerId
                              ? "border border-uranium/60 px-2 py-1 text-xs text-uranium"
                              : "border border-line px-2 py-1 text-xs text-fg-muted"
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

function Stat({ label, value, tone = "text-fg" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="border border-line bg-bg-soft p-4">
      <div className={`font-display text-2xl ${tone}`}>{value}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.24em] text-fg-muted">{label}</div>
    </div>
  );
}
