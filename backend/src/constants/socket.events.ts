export const SOCKET_EVENTS = {
	GAME: {
		// client → server
		JOIN_QUEUE: "game:join-queue",
		LEAVE_QUEUE: "game:leave-queue",
		MAKE_MOVE: "game:make-move",
		LEAVE_GAME: "game:leave-game",
		CREATE_ROOM: "game:create-room",
		JOIN_ROOM_BY_CODE: "game:join-room-by-code",
		// server → client
		CONNECTED: "game:connected",
		QUEUED: "game:queued",
		START: "game:start",
		STATE: "game:state",
		OVER: "game:over",
		ROOM_CREATED: "game:room-created",
		ERROR: "game:error",
	},
} as const;
