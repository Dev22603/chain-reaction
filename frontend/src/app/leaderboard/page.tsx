import Link from "next/link";
import { Trophy } from "lucide-react";
import { leaderboardApi } from "@/lib/api";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui";

export default async function LeaderboardPage() {
  const result = await leaderboardApi.list(50);
  const entries = result.leaderboard;

  return (
    <main className="relative z-10 mx-auto w-full max-w-[980px] px-4 py-8 sm:px-8">
      <Card className="p-6 sm:p-8">
        <CardCorners />
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3">
            <CardEyebrow>// ranked simple points</CardEyebrow>
            <CardTitle className="text-3xl sm:text-4xl">Leaderboard</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Trophy className="text-uranium" size={32} aria-hidden="true" />
          </div>
        </header>

        {entries.length === 0 ? (
          <EmptyState message="No ranked games yet" />
        ) : (
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
        )}
      </Card>
    </main>
  );
}
