import { randomUUID } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import { MESSAGE_TYPES, RECONNECT_GRACE_MS, WS_RATE_LIMIT_MAX, WS_RATE_LIMIT_WINDOW_MS } from "../constants/app.constants.js";
import { graceExpireLeaveGame, sendGameStateToPlayer } from "../handlers/game.handlers.js";
import { handleLeaveGame } from "../handlers/game.handlers.js";
import { handleLeaveQueue } from "../handlers/queue.handlers.js";
import { playersRepo } from "../db/index.js";
import { getLogger } from "../lib/logger.js";
import { dispatch } from "../router.js";
import { connections, pendingReconnects, playerRooms, players } from "../state/memory.js";
import type { ConnectionIdentity } from "../types/connection.js";
import { send } from "../utils/broadcast.js";
import { verifyAccessToken } from "../utils/jwt.js";

const logger = getLogger("realtime.websocket");

const rateLimitState = new WeakMap<WebSocket, { count: number; windowStart: number }>();

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket, request) => {
    void handleConnection(socket, request);
  });

  return wss;
}

async function handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
  const identity = await resolveIdentity(request);

  // If this authenticated player has a pending reconnect, resume instead of starting fresh.
  if (!identity.isGuest) {
    const pending = pendingReconnects.get(identity.playerId);
    if (pending) {
      clearTimeout(pending.timeoutHandle);
      pendingReconnects.delete(identity.playerId);

      // Rebind socket so broadcasts reach the rejoined player.
      players.set(identity.playerId, socket);
      connections.set(identity.playerId, identity);

      // If the room was destroyed while in the grace window, drop gracefully.
      const roomStillExists = playerRooms.has(identity.playerId);
      if (roomStillExists) {
        sendGameStateToPlayer(identity.playerId);
        logger.info("player reconnected within grace window", { playerId: identity.playerId, roomId: pending.roomId });
      } else {
        logger.info("player reconnected but room ended during grace window", { playerId: identity.playerId });
      }

      wireSocketEvents(socket, identity);
      return;
    }
  }

  players.set(identity.playerId, socket);
  connections.set(identity.playerId, identity);

  send(socket, {
    type: MESSAGE_TYPES.CONNECTED,
    playerId: identity.playerId,
    displayName: identity.displayName,
    isGuest: identity.isGuest
  });

  wireSocketEvents(socket, identity);

  logger.info("player connected", {
    playerId: identity.playerId,
    isGuest: identity.isGuest
  });
}

function wireSocketEvents(socket: WebSocket, identity: ConnectionIdentity): void {
  rateLimitState.set(socket, { count: 0, windowStart: Date.now() });

  socket.on("message", (raw) => {
    const state = rateLimitState.get(socket) ?? { count: 0, windowStart: Date.now() };

    if (Date.now() - state.windowStart > WS_RATE_LIMIT_WINDOW_MS) {
      state.count = 0;
      state.windowStart = Date.now();
    }

    state.count += 1;
    rateLimitState.set(socket, state);

    if (state.count > WS_RATE_LIMIT_MAX) {
      socket.send(JSON.stringify({ type: "error", code: "rate_limited", message: "Too many messages. Slow down." }));
      return;
    }

    dispatch(socket, identity.playerId, raw);
  });

  socket.on("close", () => {
    // Only the socket that is currently registered should trigger cleanup.
    if (players.get(identity.playerId) !== socket) {
      return;
    }

    handleLeaveQueue(identity.playerId);

    const roomId = playerRooms.get(identity.playerId);
    const isInRoom = roomId !== undefined;

    // Guests have no stable identity across connections — clean up immediately.
    if (identity.isGuest || !isInRoom) {
      handleLeaveGame(identity.playerId);
      players.delete(identity.playerId);
      connections.delete(identity.playerId);
      logger.info("player disconnected", { playerId: identity.playerId, isGuest: identity.isGuest });
      return;
    }

    // Authenticated player mid-game: enter a 30-second reconnect grace window.
    // We defer elimination so a brief network blip doesn't forfeit the match.
    players.delete(identity.playerId);
    connections.delete(identity.playerId);

    const expiresAt = Date.now() + RECONNECT_GRACE_MS;
    const timeoutHandle = setTimeout(() => {
      pendingReconnects.delete(identity.playerId);
      graceExpireLeaveGame(identity.playerId);
      logger.info("grace window expired, player eliminated", { playerId: identity.playerId, roomId });
    }, RECONNECT_GRACE_MS);

    pendingReconnects.set(identity.playerId, { roomId, expiresAt, timeoutHandle });

    logger.info("player disconnected mid-game, grace window started", {
      playerId: identity.playerId,
      roomId,
      expiresAt: new Date(expiresAt).toISOString()
    });
  });
}

async function resolveIdentity(request: IncomingMessage): Promise<ConnectionIdentity> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return buildGuestIdentity();
  }

  try {
    const payload = verifyAccessToken(token);
    const player = await playersRepo.findById(payload.sub);
    if (!player?.email) {
      return buildGuestIdentity();
    }

    return {
      playerId: player.id,
      displayName: player.displayName,
      email: player.email,
      isGuest: false
    };
  } catch (error) {
    logger.warn("websocket auth failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    return buildGuestIdentity();
  }
}

function getTokenFromRequest(request: IncomingMessage): string | null {
  const url = new URL(request.url ?? "/", "http://localhost");
  return url.searchParams.get("token")?.trim() || null;
}

function buildGuestIdentity(): ConnectionIdentity {
  const playerId = randomUUID();

  return {
    playerId,
    displayName: `Guest ${playerId.slice(0, 8)}`,
    email: null,
    isGuest: true
  };
}
