import { randomUUID } from "node:crypto";
import type { IncomingMessage, Server } from "node:http";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import { MESSAGE_TYPES } from "../constants/app.constants.js";
import { handleLeaveGame } from "../handlers/game.handlers.js";
import { handleLeaveQueue } from "../handlers/queue.handlers.js";
import { playersRepo } from "../db/index.js";
import { getLogger } from "../lib/logger.js";
import { dispatch } from "../router.js";
import { connections, players } from "../state/memory.js";
import type { ConnectionIdentity } from "../types/connection.js";
import { send } from "../utils/broadcast.js";
import { verifyAccessToken } from "../utils/jwt.js";

const logger = getLogger("realtime.websocket");

export function attachWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket, request) => {
    void handleConnection(socket, request);
  });

  return wss;
}

async function handleConnection(socket: WebSocket, request: IncomingMessage): Promise<void> {
  const identity = await resolveIdentity(request);
  players.set(identity.playerId, socket);
  connections.set(identity.playerId, identity);

  send(socket, {
    type: MESSAGE_TYPES.CONNECTED,
    playerId: identity.playerId,
    displayName: identity.displayName,
    isGuest: identity.isGuest
  });

  socket.on("message", (raw) => {
    dispatch(socket, identity.playerId, raw);
  });

  socket.on("close", () => {
    handleLeaveQueue(identity.playerId);
    handleLeaveGame(identity.playerId);

    if (players.get(identity.playerId) === socket) {
      players.delete(identity.playerId);
      connections.delete(identity.playerId);
    }

    logger.info("player disconnected", {
      playerId: identity.playerId,
      isGuest: identity.isGuest
    });
  });

  logger.info("player connected", {
    playerId: identity.playerId,
    isGuest: identity.isGuest
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
