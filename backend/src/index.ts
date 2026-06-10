import { createServer } from "http";
import { app } from "./app";
import { config } from "./constants/config";
import logger from "./lib/logger";
import { prisma } from "./lib/prisma";
import { createWSS, getWSS } from "./lib/realtime";
import { connectionService } from "./services/connection.services";
import { startRoomReaper, stopRoomReaper } from "./services/room.services";
import { registerSocketGateways } from "./sockets/index";

const httpServer = createServer(app);
createWSS();
registerSocketGateways(httpServer);
startRoomReaper();

httpServer.listen(config.PORT, () => {
	logger.info(`Server is running on http://localhost:${config.PORT}`);
});

// --- Graceful Shutdown & Crash Handling ---

let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
	if (isShuttingDown) {
		logger.warn(`Shutdown already in progress, ignoring duplicate signal: ${signal}`);
		return;
	}
	isShuttingDown = true;
	logger.info(`Received ${signal}, starting graceful shutdown`);

	const forceExitTimeout = setTimeout(() => {
		logger.error("Graceful shutdown timed out, force exiting process");
		process.exit(1);
	}, 5000);
	forceExitTimeout.unref();

	logger.info("Closing HTTP server");
	httpServer.close((err) => {
		if (err) {
			logger.error("Error closing HTTP server", { error: err.message });
		} else {
			logger.info("HTTP server closed");
		}
	});

	logger.info("Closing active WebSocket connections");
	const wss = getWSS();
	for (const client of wss.clients) {
		try {
			client.close(1001, "Server going away");
		} catch {
			// ignore client close errors
		}
	}
	wss.close();

	stopRoomReaper();

	logger.info("Clearing pending reconnect timers");
	connectionService.clearAllPendingReconnects();

	logger.info("Disconnecting from database");
	try {
		await prisma.$disconnect();
		logger.info("Database client disconnected");
	} catch (err) {
		logger.error("Error disconnecting from database", {
			error: err instanceof Error ? err.message : String(err),
		});
	}

	clearTimeout(forceExitTimeout);
	logger.info("Graceful shutdown completed successfully");
	process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (error) => {
	logger.error("uncaughtException crash", {
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
	});
	setTimeout(() => process.exit(1), 500).unref();
});

process.on("unhandledRejection", (reason) => {
	logger.error("unhandledRejection crash", {
		error: reason instanceof Error ? reason.message : String(reason),
		stack: reason instanceof Error ? reason.stack : undefined,
	});
	setTimeout(() => process.exit(1), 500).unref();
});
