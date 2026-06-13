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
import { EmptyState } from "@/components/ui/empty-state";
import { StatsTable, type StatsColumn } from "@/components/ui/stats-table";
import { BOARD_PRESETS } from "@/lib/presets";
import { MAX_PLAYERS, MIN_PLAYERS } from "@/lib/constants";

type Tab = "overall" | "mode";

const PLAYER_OPTIONS = Array.from(
  { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
  (_, i) => MIN_PLAYERS + i
);

function playerLink(playerId: string, displayName: string) {
  return (
    <Link href={`/players/${playerId}`} className="hover:text-secondary-deep">
      {displayName}
    </Link>
  );
}

const OVERALL_COLUMNS: Array<StatsColumn<LeaderboardEntry>> = [
  {
    label: "Rank",
    cellClass: "font-display text-secondary-deep",
    render: (_, index) => index + 1
  },
  {
    label: "Player",
    cellClass: "text-fg",
    render: (entry) => playerLink(entry.playerId, entry.displayName)
  },
  {
    label: "Level",
    align: "right",
    render: (entry) => <LevelChip level={entry.level} />
  },
  {
    label: "Total XP",
    align: "right",
    cellClass: "font-display text-primary",
    render: (entry) => entry.totalXp
  }
];

const MODE_COLUMNS: Array<StatsColumn<ModeLeaderboardEntry>> = [
  {
    label: "Rank",
    cellClass: "font-display text-secondary-deep",
    render: (_, index) => index + 1
  },
  {
    label: "Player",
    cellClass: "text-fg",
    render: (entry) => playerLink(entry.playerId, entry.displayName)
  },
  {
    label: "XP",
    align: "right",
    cellClass: "font-display text-primary",
    render: (entry) => entry.xp
  },
  { label: "Wins", align: "right", render: (entry) => entry.wins },
  { label: "Losses", align: "right", render: (entry) => entry.losses },
  { label: "Games", align: "right", render: (entry) => entry.gamesPlayed }
];

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
          <StatsTable
            minWidthClass="min-w-[420px]"
            columns={OVERALL_COLUMNS}
            rows={overall}
            rowKey={(entry) => entry.playerId}
          />
        ) : null}

        {!error && !loading && !empty && tab === "mode" ? (
          <StatsTable
            minWidthClass="min-w-[640px]"
            columns={MODE_COLUMNS}
            rows={modeEntries}
            rowKey={(entry) => entry.playerId}
          />
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
