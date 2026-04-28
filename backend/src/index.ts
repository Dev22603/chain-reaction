import { config } from "./constants/config.js";
import { getLogger } from "./lib/logger.js";
import { server } from "./app.js";

const logger = getLogger("index");

server.listen(config.PORT, () => {
  logger.info("server listening", { port: config.PORT });
});
