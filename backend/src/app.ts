import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { MESSAGE_TYPES } from "./constants/app.constants.js";
import { handleLeaveGame } from "./handlers/game.handlers.js";
import { handleLeaveQueue } from "./handlers/queue.handlers.js";
import { getLogger } from "./lib/logger.js";
import { dispatch } from "./router.js";
import { players } from "./state/memory.js";
import { send } from "./utils/broadcast.js";

const logger = getLogger("app");

export const server = createServer();
export const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  const playerId = randomUUID();
  players.set(playerId, socket);

  send(socket, {
    type: MESSAGE_TYPES.CONNECTED,
    playerId
  });

  socket.on("message", (raw) => {
    dispatch(socket, playerId, raw);
  });

  socket.on("close", () => {
    handleLeaveQueue(playerId);
    handleLeaveGame(playerId);
    players.delete(playerId);
    logger.info("player disconnected", { playerId });
  });

  logger.info("player connected", { playerId });
});
