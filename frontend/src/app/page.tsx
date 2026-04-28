"use client";

import { GameBoard } from "@/components/GameBoard";
import { GameOver } from "@/components/GameOver";
import { Lobby } from "@/components/Lobby";
import { QueueScreen } from "@/components/QueueScreen";
import { useGameWebSocket } from "@/hooks/useGameWebSocket";

export default function Home() {
  const game = useGameWebSocket();

  return (
    <main className="app-shell">
      {game.lastError ? <p className="error-banner">{game.lastError.message}</p> : null}

      {game.phase === "lobby" ? <Lobby onSubmit={game.joinQueue} /> : null}

      {game.phase === "queued" ? (
        <QueueScreen info={game.queuedInfo} onCancel={game.leaveQueue} />
      ) : null}

      {game.phase === "playing" && game.gameState ? (
        <GameBoard
          gameState={game.gameState}
          playerId={game.playerId}
          onMove={game.makeMove}
          onLeaveGame={game.leaveGame}
        />
      ) : null}

      {game.phase === "playing" && !game.gameState ? (
        <section className="panel">
          <p className="eyebrow">Starting game</p>
          <h1>Preparing board</h1>
        </section>
      ) : null}

      {game.phase === "gameover" ? (
        <GameOver winner={game.winner} onPlayAgain={game.reset} />
      ) : null}
    </main>
  );
}
