"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import { ApiClientError, leaderboardApi, type LeaderboardEntry } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLeaderboard() {
    setLoading(true);
    setError(null);

    try {
      const result = await leaderboardApi.list(50);
      setEntries(result.leaderboard);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  return (
    <main className="relative z-10 mx-auto w-full max-w-[980px] px-4 py-8 sm:px-8">
      <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
        <Link href="/" className="font-display text-sm uppercase tracking-[0.32em] text-fg hover:text-cherenkov">
          Chain . Reaction
        </Link>
        <Button variant="ghost" onClick={() => void loadLeaderboard()} disabled={loading}>
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <Card className="p-6 sm:p-8">
        <CardCorners />
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3">
            <CardEyebrow>// ranked simple points</CardEyebrow>
            <CardTitle className="text-3xl sm:text-4xl">Leaderboard</CardTitle>
          </div>
          <Trophy className="text-uranium" size={32} aria-hidden="true" />
        </header>

        {error ? (
          <div role="alert" className="border border-p1/50 bg-p1/5 px-4 py-3 text-sm text-p1">
            {error}
          </div>
        ) : null}

        {!error && loading ? (
          <div className="border border-line bg-bg-soft px-4 py-8 text-center font-mono text-xs uppercase tracking-[0.24em] text-fg-muted">
            Loading standings
          </div>
        ) : null}

        {!error && !loading && entries.length === 0 ? (
          <div className="border border-line bg-bg-soft px-4 py-8 text-center font-mono text-xs uppercase tracking-[0.24em] text-fg-muted">
            No ranked games yet
          </div>
        ) : null}

        {!error && !loading && entries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse font-mono text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.28em] text-fg-muted">
                  <th className="py-3 pr-4 font-normal">Rank</th>
                  <th className="px-4 py-3 font-normal">Player</th>
                  <th className="px-4 py-3 text-right font-normal">Score</th>
                  <th className="px-4 py-3 text-right font-normal">Wins</th>
                  <th className="px-4 py-3 text-right font-normal">Losses</th>
                  <th className="px-4 py-3 text-right font-normal">Games</th>
                  <th className="py-3 pl-4 text-right font-normal">Forfeits</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.playerId} className="border-b border-line/70 text-fg-soft">
                    <td className="py-4 pr-4 text-cherenkov">{index + 1}</td>
                    <td className="px-4 py-4 text-fg">
                      <Link href={`/players/${entry.playerId}`} className="hover:text-cherenkov">
                        {entry.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right text-uranium">{entry.score}</td>
                    <td className="px-4 py-4 text-right">{entry.wins}</td>
                    <td className="px-4 py-4 text-right">{entry.losses}</td>
                    <td className="px-4 py-4 text-right">{entry.gamesPlayed}</td>
                    <td className="py-4 pl-4 text-right">{entry.forfeits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
