import type { WebSocket } from "ws";

export interface SocketUser {
	id: string;
	name: string;
	email: string | null;
	isGuest: boolean;
}

export interface AuthenticatedWebSocket extends WebSocket {
	user: SocketUser;
}
