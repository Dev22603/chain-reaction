"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClientMessage,
  GameState,
  GameMode,
  JoinQueueInput,
  LastError,
  Phase,
  Player,
  QueuedInfo,
  ServerMessage
} from "@/lib/types";
import { getStoredAccessToken } from "@/lib/auth";

const DEFAULT_WS_URL = "ws://localhost:8080";

function buildWebSocketUrl(): string {
  const url = new URL(process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL);
  const token = getStoredAccessToken();
  if (token) {
    url.searchParams.set("token", token);
  }

  return url.toString();
}

export function useGameWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [queuedInfo, setQueuedInfo] = useState<QueuedInfo | null>(null);
  const [winner, setWinner] = useState<Pick<Player, "id" | "name"> | null>(null);
  const [lastError, setLastError] = useState<LastError | null>(null);

  const sendJSON = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    const socket = new WebSocket(buildWebSocketUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as ServerMessage;

      switch (message.type) {
        case "connected":
          setPlayerId(message.playerId);
          break;
        case "queued":
          setQueuedInfo({
            mode: message.mode,
            position: message.position,
            maxPlayers: message.maxPlayers
          });
          setLastError(null);
          setPhase("queued");
          break;
        case "game_start":
          setGameMode(message.mode);
          setQueuedInfo(null);
          setWinner(null);
          setLastError(null);
          setPhase("playing");
          break;
        case "game_state":
          setGameState({
            board: message.board,
            currentTurn: message.currentTurn,
            players: message.players
          });
          setLastError(null);
          setPhase("playing");
          break;
        case "game_over":
          setGameMode(message.mode);
          setWinner(message.winner);
          setLastError(null);
          setPhase("gameover");
          break;
        case "error":
          setLastError({ code: message.code, message: message.message });
          break;
        default:
          break;
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  const joinQueue = useCallback(
    (input: JoinQueueInput) => {
      sendJSON({ type: "join_queue", ...input });
    },
    [sendJSON]
  );

  const leaveQueue = useCallback(() => {
    sendJSON({ type: "leave_queue" });
    setQueuedInfo(null);
    setPhase("lobby");
  }, [sendJSON]);

  const makeMove = useCallback(
    (row: number, col: number) => {
      sendJSON({ type: "make_move", row, col });
    },
    [sendJSON]
  );

  const leaveGame = useCallback(() => {
    sendJSON({ type: "leave_game" });
    setGameState(null);
    setGameMode(null);
    setPhase("lobby");
  }, [sendJSON]);

  const reset = useCallback(() => {
    setGameState(null);
    setGameMode(null);
    setQueuedInfo(null);
    setWinner(null);
    setLastError(null);
    setPhase("lobby");
  }, []);

  return {
    phase,
    playerId,
    gameState,
    gameMode,
    queuedInfo,
    winner,
    lastError,
    joinQueue,
    leaveQueue,
    makeMove,
    leaveGame,
    reset
  };
}
