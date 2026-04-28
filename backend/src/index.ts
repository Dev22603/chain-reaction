import { createServer } from "node:http";
import { app } from "./app.js";
import { config } from "./constants/config.js";
import { getLogger } from "./lib/logger.js";
import { attachWebSocketServer } from "./realtime/websocket.js";

const logger = getLogger("index");
const server = createServer(app);

attachWebSocketServer(server);

server.listen(config.PORT, () => {
  logger.info("server listening", { port: config.PORT });
});
