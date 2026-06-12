"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CreateRoomInput,
  GameState,
  JoinQueueInput,
  LastError,
  Phase,
  Player,
  QueuedInfo,
  ServerEnvelope
} from "@/lib/types";
import { getStoredAccessToken } from "@/lib/auth";

const DEFAULT_WS_URL = "ws://localhost:8080";

export type WebSocketConnectionState = "connecting" | "open" | "closed" | "error";

function buildWebSocketUrl(): string {
  return new URL("/game", process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL).toString();
}

export function useGameWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const [phase, setPhase] = useState<Phase>("lobby");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [queuedInfo, setQueuedInfo] = useState<QueuedInfo | null>(null);
  const [winner, setWinner] = useState<Pick<Player, "id" | "name"> | null>(null);
  const [xpDeltas, setXpDeltas] = useState<Record<string, number> | null>(null);
  const [lastError, setLastError] = useState<LastError | null>(null);
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>("connecting");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [connectNonce, setConnectNonce] = useState(0);

  const sendJSON = useCallback((event: string, data?: unknown) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    socket.send(JSON.stringify({ event, data }));
  }, []);

  useEffect(() => {
    // Authenticated clients pass the JWT as the WebSocket subprotocol;
    // the backend echoes it during the handshake and resolves the identity.
    const token = getStoredAccessToken();
    const socket = token ? new WebSocket(buildWebSocketUrl(), token) : new WebSocket(buildWebSocketUrl());
    socketRef.current = socket;
    setConnectionState("connecting");

    socket.onopen = () => {
      setConnectionState("open");
    };

    socket.onerror = () => {
      setConnectionState("error");
    };

    socket.onclose = () => {
      setConnectionState("closed");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data as string) as ServerEnvelope;

      switch (message.event) {
        case "game:connected":
          setPlayerId(message.data.playerId);
          break;
        case "game:queued":
          setQueuedInfo({
            position: message.data.position,
            maxPlayers: message.data.maxPlayers,
            gridRows: message.data.gridRows,
            gridCols: message.data.gridCols
          });
          setLastError(null);
          setPhase("queued");
          break;
        case "game:start":
          setQueuedInfo(null);
          setWinner(null);
          setLastError(null);
          setPhase("playing");
          break;
        case "game:state":
          setGameState({
            board: message.data.board,
            currentTurn: message.data.currentTurn,
            players: message.data.players
          });
          setLastError(null);
          setPhase("playing");
          break;
        case "game:over":
          setWinner(message.data.winner);
          setXpDeltas(message.data.xpDeltas ?? null);
          setLastError(null);
          setPhase("gameover");
          break;
        case "game:room-created":
          setRoomCode(message.data.code);
          setPhase("queued");
          break;
        case "game:error":
          setLastError({ code: message.data.code, message: message.data.message });
          break;
        default:
          break;
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [connectNonce]);

  // The JWT only travels during the connection handshake, so a login or
  // logout that happens without a page navigation (modal auth) must tear the
  // socket down and reconnect under the new identity.
  const reconnect = useCallback(() => {
    setConnectNonce((nonce) => nonce + 1);
  }, []);

  const joinQueue = useCallback(
    (input: JoinQueueInput) => {
      sendJSON("game:join-queue", input);
    },
    [sendJSON]
  );

  const createRoom = useCallback(
    (input: CreateRoomInput) => {
      sendJSON("game:create-room", input);
    },
    [sendJSON]
  );

  const joinRoomByCode = useCallback(
    (code: string, playerName: string) => {
      sendJSON("game:join-room-by-code", { code, playerName });
    },
    [sendJSON]
  );

  const leaveQueue = useCallback(() => {
    sendJSON("game:leave-queue");
    setQueuedInfo(null);
    setPhase("lobby");
  }, [sendJSON]);

  const makeMove = useCallback(
    (row: number, col: number) => {
      sendJSON("game:make-move", { row, col });
    },
    [sendJSON]
  );

  const leaveGame = useCallback(() => {
    sendJSON("game:leave-game");
    setGameState(null);
    setPhase("lobby");
  }, [sendJSON]);

  const reset = useCallback(() => {
    setGameState(null);
    setQueuedInfo(null);
    setRoomCode(null);
    setWinner(null);
    setXpDeltas(null);
    setLastError(null);
    setPhase("lobby");
  }, []);

  return {
    phase,
    playerId,
    gameState,
    queuedInfo,
    roomCode,
    winner,
    xpDeltas,
    lastError,
    connectionState,
    reconnect,
    joinQueue,
    createRoom,
    joinRoomByCode,
    leaveQueue,
    makeMove,
    leaveGame,
    reset
  };
}
