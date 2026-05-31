import { createServer } from "node:http";
import { app } from "./app.js";
import { config } from "./constants/config.js";
import { getLogger } from "./lib/logger.js";
import { attachWebSocketServer } from "./sockets/index.js";
import { startRoomReaper, stopRoomReaper } from "./services/room.services.js";
import { prisma } from "./lib/prisma.js";
import { pendingReconnects } from "./state/connection.state.js";

const logger = getLogger("index");
const server = createServer(app);

const wss = attachWebSocketServer(server);
startRoomReaper();

server.listen(config.PORT, () => {
	logger.info("server listening", { port: config.PORT });
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

	// Force exit fallback timer (5 seconds)
	const forceExitTimeout = setTimeout(() => {
		logger.error("Graceful shutdown timed out, force exiting process");
		process.exit(1);
	}, 5000);
	forceExitTimeout.unref();

	// Stop accepting new HTTP connections
	logger.info("Closing HTTP server");
	server.close((err) => {
		if (err) {
			logger.error("Error closing HTTP server", { error: err.message });
		} else {
			logger.info("HTTP server closed");
		}
	});

	// Close all active WebSocket connections (1001 going-away) and close WebSocket server
	logger.info("Closing active WebSocket connections");
	for (const client of wss.clients) {
		try {
			client.close(1001, "Server going away");
		} catch {
			// ignore client close errors
		}
	}
	wss.close();

	// Stop periodic room reaper
	stopRoomReaper();

	// Clear all pending player reconnection grace-period timers
	logger.info("Clearing pending reconnect timers");
	for (const reconnect of pendingReconnects.values()) {
		clearTimeout(reconnect.timeoutHandle);
	}
	pendingReconnects.clear();

	// Disconnect database client
	logger.info("Disconnecting from database");
	try {
		await prisma.$disconnect();
		logger.info("Database client disconnected");
	} catch (err) {
		logger.error("Error disconnecting from database", {
			error: err instanceof Error ? err.message : String(err),
		});
	}

	// Cancel force exit timeout and exit cleanly
	clearTimeout(forceExitTimeout);
	logger.info("Graceful shutdown completed successfully");
	process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Register global uncaught crash handlers
process.on("uncaughtException", (error) => {
	logger.error("uncaughtException crash", {
		error: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : undefined,
	});
	// Wait a short delay for logs to flush before exiting
	setTimeout(() => process.exit(1), 500).unref();
});

process.on("unhandledRejection", (reason) => {
	logger.error("unhandledRejection crash", {
		error: reason instanceof Error ? reason.message : String(reason),
		stack: reason instanceof Error ? reason.stack : undefined,
	});
	// Wait a short delay for logs to flush before exiting
	setTimeout(() => process.exit(1), 500).unref();
});
