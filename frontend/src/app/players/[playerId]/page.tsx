"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { History, Trophy } from "lucide-react";
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
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
        <Link href="/" className="font-display text-sm uppercase tracking-[0.32em] text-fg hover:text-cherenkov">
          Chain . Reaction
        </Link>
        <Link href="/leaderboard" className="font-mono text-[10px] uppercase tracking-[0.28em] text-fg-muted hover:text-cherenkov">
          leaderboard
        </Link>
      </div>

      {error ? (
        <div role="alert" className="border border-p1/50 bg-p1/5 px-4 py-3 text-sm text-p1">
          {error}
        </div>
      ) : null}

      {loading ? (
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
