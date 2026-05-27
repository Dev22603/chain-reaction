import { PLAYER_COLORS } from "@/lib/colors";
import type { Player } from "@/lib/types";

interface GameOverScoreListProps {
  players: Player[];
  scoreDeltas: Record<string, number>;
  winnerId: string | undefined;
}

export function GameOverScoreList({ players, scoreDeltas, winnerId }: GameOverScoreListProps) {
  return (
    <ul className="grid gap-1">
      {players.map((player, index) => (
        <ScoreRow
          key={player.id}
          name={player.name}
          color={PLAYER_COLORS[index] ?? "#ff5b2e"}
          delta={scoreDeltas[player.id]}
          isWinner={player.id === winnerId}
        />
      ))}
    </ul>
  );
}

function ScoreRow({
  name,
  color,
  delta,
  isWinner
}: {
  name: string;
  color: string;
  delta: number | undefined;
  isWinner: boolean;
}) {
  return (
    <li className="flex items-center justify-between border border-line bg-bg-soft px-4 py-2 font-mono text-xs">
      <span className="flex items-center gap-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: color }}
          aria-hidden="true"
        />
        <span className="text-fg-soft">{name}</span>
      </span>
      {delta !== undefined ? (
        <span className={isWinner ? "font-display text-cherenkov" : "font-display text-fg-muted"}>
          {`+${delta}`}
        </span>
      ) : null}
    </li>
  );
}
