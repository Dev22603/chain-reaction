import { randomUUID } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import {
  LIMITS,
  MESSAGE_TYPES,
  RECONNECT_GRACE_MS,
  WS_IDLE_TIMEOUT_MS,
  WS_MAX_PAYLOAD_BYTES,
  WS_PING_INTERVAL_MS,
  WS_RATE_LIMIT_MAX,
  WS_RATE_LIMIT_WINDOW_MS
} from "../constants/app.constants.js";
import { config } from "../constants/config.js";
import { graceExpireLeaveGame, sendGameStateToPlayer } from "../handlers/game.handlers.js";
import { handleLeaveGame } from "../handlers/game.handlers.js";
import { handleLeaveQueue } from "../handlers/queue.handlers.js";
import { playersRepo } from "../db/index.js";
import { getLogger } from "../lib/logger.js";
import { dispatch } from "../router.js";
import { connections, pendingReconnects, playerRooms, players } from "../state/memory.js";
import type { ConnectionIdentity } from "../types/connection.js";
import { getClientIp } from "../utils/clientIp.js";
import { send } from "../utils/broadcast.js";
import { verifyAccessToken } from "../utils/jwt.js";

const logger = getLogger("realtime.websocket");

const rateLimitState = new WeakMap<WebSocket, { count: number; windowStart: number }>();
const socketLiveness = new WeakMap<WebSocket, boolean>();
const idleTimeouts = new WeakMap<WebSocket, NodeJS.Timeout>();

const perIp = new Map<string, number>();
let totalConnections = 0;

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    maxPayload: WS_MAX_PAYLOAD_BYTES,
    verifyClient: (info, done) => {
      const { ALLOWED_ORIGINS } = config;
      const origin = info.origin;
      const originOk = ALLOWED_ORIGINS.length === 0 || (origin && ALLOWED_ORIGINS.includes(origin));
      if (!originOk) {
        logger.warn("websocket upgrade rejected: origin not allowed", { origin });
        return done(false, 1008, "origin not allowed");
      }

      const ip = getClientIp(info.req);
      if (totalConnections >= LIMITS.MAX_CONNECTIONS) {
        logger.warn("websocket upgrade rejected: server full", { ip, totalConnections });
        return done(false, 1013, "server full");
      }

      const currentIpConnections = perIp.get(ip) ?? 0;
      if (currentIpConnections >= LIMITS.MAX_CONNECTIONS_PER_IP) {
        logger.warn("websocket upgrade rejected: too many connections from IP", { ip, currentIpConnections });
        return done(false, 1013, "too many connections");
      }

      done(true);
    }
  });

  const pingInterval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socketLiveness.get(socket) === false) {
        logger.info("reaping dead socket via heartbeat");
        return socket.terminate();
      }
      socketLiveness.set(socket, false);
      socket.ping();
    });
  }, WS_PING_INTERVAL_MS);

  wss.on("close", () => {
    clearInterval(pingInterval);
  });

  wss.on("connection", (socket, request) => {
    const ip = getClientIp(request);

    totalConnections++;
    perIp.set(ip, (perIp.get(ip) ?? 0) + 1);

    socketLiveness.set(socket, true);
    socket.on("pong", () => {
      socketLiveness.set(socket, true);
    });
    resetIdleTimeout(socket);

    socket.on("close", () => {
      const handle = idleTimeouts.get(socket);
      if (handle) {
        clearTimeout(handle);
        idleTimeouts.delete(socket);
      }

      totalConnections = Math.max(0, totalConnections - 1);
      const count = perIp.get(ip) ?? 1;
      if (count <= 1) {
        perIp.delete(ip);
      } else {
        perIp.set(ip, count - 1);
      }
    });

    void handleConnection(socket, request, ip);
  });

  return wss;
}

function resetIdleTimeout(socket: WebSocket): void {
  const existing = idleTimeouts.get(socket);
  if (existing) {
    clearTimeout(existing);
  }

  const handle = setTimeout(() => {
    logger.info("terminating idle socket");
    socket.terminate();
  }, WS_IDLE_TIMEOUT_MS);

  idleTimeouts.set(socket, handle);
}

async function handleConnection(socket: WebSocket, request: IncomingMessage, ip: string): Promise<void> {
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
    isGuest: identity.isGuest,
    ip
  });
}

function wireSocketEvents(socket: WebSocket, identity: ConnectionIdentity): void {
  rateLimitState.set(socket, { count: 0, windowStart: Date.now() });

  socket.on("message", (raw) => {
    resetIdleTimeout(socket);

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
