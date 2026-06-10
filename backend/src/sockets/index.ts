import type { Server as HttpServer } from "http";
import type { AuthenticatedWebSocket } from "../types/socket";
import { checkUpgradeLimits, getWSS, trackSocket } from "../lib/realtime";
import { parseUserFromRequest } from "../middlewares/socket-auth";
import { handleGameConnection } from "./game.gateway";
import { getClientIp } from "../utils/client_ip";
import { getLogger } from "../lib/logger";

const log = getLogger("ws.server");

export function registerSocketGateways(httpServer: HttpServer) {
	const wss = getWSS();

	httpServer.on("upgrade", (req, socket, head) => {
		socket.on("error", () => socket.destroy());

		void (async () => {
			const url = new URL(req.url ?? "/", "http://localhost");
			const ip = getClientIp(req);

			if (url.pathname !== "/game") {
				socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
				socket.destroy();
				return;
			}

			const limits = checkUpgradeLimits(req);
			if (!limits.ok) {
				socket.write(`HTTP/1.1 ${limits.code} ${limits.reason}\r\n\r\n`);
				socket.destroy();
				return;
			}

			let user: AuthenticatedWebSocket["user"];
			try {
				user = await parseUserFromRequest(req, ip);
			} catch (err) {
				log.warn("WS upgrade rejected — identity resolution failed", {
					path: url.pathname,
					error: (err as Error).message,
				});
				socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
				socket.destroy();
				return;
			}

			wss.handleUpgrade(req, socket, head, (ws) => {
				const authWs = ws as AuthenticatedWebSocket;
				authWs.user = user;
				trackSocket(authWs, req);
				handleGameConnection(authWs, ip);
			});
		})();
	});
}
