"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trophy } from "lucide-react";
import {
  ApiClientError,
  leaderboardApi,
  type LeaderboardEntry,
  type ModeLeaderboardEntry
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardEyebrow, CardTitle } from "@/components/ui/card";
import { BOARD_PRESETS } from "@/lib/presets";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";

type Tab = "overall" | "mode";

const PLAYER_OPTIONS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i
);

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("overall");
  const [size, setSize] = useState<string>(BOARD_PRESETS[1].key);
  const [players, setPlayers] = useState<number>(2);

  const [overall, setOverall] = useState<LeaderboardEntry[]>([]);
  const [modeEntries, setModeEntries] = useState<ModeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (tab === "overall") {
        const result = await leaderboardApi.list(50);
        setOverall(result.leaderboard);
      } else {
        const result = await leaderboardApi.mode(size, players, 50);
        setModeEntries(result.leaderboard);
      }
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [tab, size, players]);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = tab === "overall" ? overall.length === 0 : modeEntries.length === 0;

  return (
    <main className="relative z-10 mx-auto w-full max-w-[980px] px-4 py-8 sm:px-8">
      <Card className="p-6 sm:p-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-3">
            <CardEyebrow>Top players</CardEyebrow>
            <CardTitle className="text-3xl sm:text-4xl">Leaderboard</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </Button>
            <Trophy className="text-accent" size={32} aria-hidden="true" />
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-5 flex gap-2" role="tablist" aria-label="Leaderboard type">
          <TabButton active={tab === "overall"} onClick={() => setTab("overall")}>
            Overall
          </TabButton>
          <TabButton active={tab === "mode"} onClick={() => setTab("mode")}>
            By mode
          </TabButton>
        </div>

        {/* Mode selectors */}
        {tab === "mode" ? (
          <div className="mb-6 grid gap-4 rounded-2xl border-2 border-line bg-surface-2 p-4 sm:grid-cols-[1fr_auto]">
            <div className="grid gap-2">
              <p className="font-display text-[11px] tracking-[0.24em] text-fg-muted">BOARD SIZE</p>
              <div className="flex flex-wrap gap-2">
                {BOARD_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setSize(preset.key)}
                    className={
                      "rounded-full border-2 px-3.5 py-1.5 font-display text-xs transition-colors " +
                      (size === preset.key
                        ? "border-secondary bg-secondary/10 text-secondary-deep"
                        : "border-line bg-surface text-fg-soft hover:border-line-2 hover:text-fg")
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="players-select"
                className="font-display text-[11px] tracking-[0.24em] text-fg-muted"
              >
                PLAYERS
              </label>
              <select
                id="players-select"
                value={players}
                onChange={(event) => setPlayers(Number(event.target.value))}
                className="h-10 rounded-xl border-2 border-line bg-surface px-3 text-sm font-bold text-fg focus:border-secondary focus:outline-none"
              >
                {PLAYER_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count} players
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="rounded-xl border-2 border-danger/50 bg-danger/5 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        ) : null}

        {!error && loading ? (
          <EmptyState>Loading standings…</EmptyState>
        ) : null}

        {!error && !loading && empty ? (
          <EmptyState>
            {tab === "overall" ? "No games played yet." : "No games played in this mode yet."}
          </EmptyState>
        ) : null}

        {!error && !loading && !empty && tab === "overall" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm font-semibold">
              <thead>
                <tr className="border-b-2 border-line text-left text-[10px] uppercase tracking-[0.28em] text-fg-muted">
                  <th className="py-3 pr-4 font-bold">Rank</th>
                  <th className="px-4 py-3 font-bold">Player</th>
                  <th className="px-4 py-3 text-right font-bold">Level</th>
                  <th className="py-3 pl-4 text-right font-bold">Total XP</th>
                </tr>
              </thead>
              <tbody>
                {overall.map((entry, index) => (
                  <tr key={entry.playerId} className="border-b border-line text-fg-soft">
                    <td className="py-4 pr-4 font-display text-secondary-deep">{index + 1}</td>
                    <td className="px-4 py-4 text-fg">
                      <Link href={`/players/${entry.playerId}`} className="hover:text-secondary-deep">
                        {entry.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <LevelChip level={entry.level} />
                    </td>
                    <td className="py-4 pl-4 text-right font-display text-primary">{entry.totalXp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {!error && !loading && !empty && tab === "mode" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm font-semibold">
              <thead>
                <tr className="border-b-2 border-line text-left text-[10px] uppercase tracking-[0.28em] text-fg-muted">
                  <th className="py-3 pr-4 font-bold">Rank</th>
                  <th className="px-4 py-3 font-bold">Player</th>
                  <th className="px-4 py-3 text-right font-bold">XP</th>
                  <th className="px-4 py-3 text-right font-bold">Wins</th>
                  <th className="px-4 py-3 text-right font-bold">Losses</th>
                  <th className="py-3 pl-4 text-right font-bold">Games</th>
                </tr>
              </thead>
              <tbody>
                {modeEntries.map((entry, index) => (
                  <tr key={entry.playerId} className="border-b border-line text-fg-soft">
                    <td className="py-4 pr-4 font-display text-secondary-deep">{index + 1}</td>
                    <td className="px-4 py-4 text-fg">
                      <Link href={`/players/${entry.playerId}`} className="hover:text-secondary-deep">
                        {entry.displayName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-right font-display text-primary">{entry.xp}</td>
                    <td className="px-4 py-4 text-right">{entry.wins}</td>
                    <td className="px-4 py-4 text-right">{entry.losses}</td>
                    <td className="py-4 pl-4 text-right">{entry.gamesPlayed}</td>
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

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "rounded-full border-2 px-5 py-2 font-display text-sm transition-colors " +
        (active
          ? "border-primary bg-primary/10 text-primary"
          : "border-line bg-surface text-fg-soft hover:border-line-2 hover:text-fg")
      }
    >
      {children}
    </button>
  );
}

function LevelChip({ level }: { level: number }) {
  return (
    <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-accent bg-accent/15 px-1.5 font-display text-xs text-[#7a4d00]">
      {level}
    </span>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-2 border-line bg-surface-2 px-4 py-8 text-center text-xs font-bold uppercase tracking-[0.24em] text-fg-muted">
      {children}
    </div>
  );
}
