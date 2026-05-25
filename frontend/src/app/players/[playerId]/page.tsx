
import { History, Trophy } from "lucide-react";
import { playersApi } from "@/lib/api";
import { Card, CardCorners, CardEyebrow, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function PlayerProfilePage({
  params
}: {
  params: Promise<{ playerId: string }>
}) {
  const { playerId } = await params;

  const [profileResult, matchesResult] = await Promise.all([
    playersApi.profile(playerId),
    playersApi.matches(playerId, 20)
  ]);

  const profile = profileResult.profile;
  const matches = matchesResult.matches;

  return (
    <main className="relative z-10 mx-auto w-full max-w-[980px] px-4 py-8 sm:px-8">
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
            <EmptyState message="No persisted matches yet" />
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
                    {match.participants.map((participant: { playerId: string; displayName: string }) => (
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
