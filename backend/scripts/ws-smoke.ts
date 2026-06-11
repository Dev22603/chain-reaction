// WS protocol smoke test (guest flow + quick match). Run with the server up:
//   npx tsx scripts/ws-smoke.ts [token]
import WebSocket from "ws";

const URL = "ws://localhost:8080/game";
const token = process.argv[2];
const results: Array<{ name: string; ok: boolean }> = [];
let finished = false;

interface Frame {
	event: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
}

interface TestClient {
	next(): Promise<Frame>;
	sendEvent(event: string, data?: unknown): void;
	close(): void;
}

function log(name: string, ok: boolean, detail?: string): void {
	results.push({ name, ok });
	console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " — " + detail : ""}`);
}

function connect(label: string, subprotocol?: string): Promise<TestClient> {
	const ws = subprotocol ? new WebSocket(URL, subprotocol) : new WebSocket(URL);
	const queue: Frame[] = [];
	const waiters: Array<(frame: Frame) => void> = [];

	ws.on("message", (raw) => {
		const frame = JSON.parse(raw.toString()) as Frame;
		const waiter = waiters.shift();
		if (waiter) waiter(frame);
		else queue.push(frame);
	});

	const client: TestClient = {
		next: () =>
			new Promise((resolve, reject) => {
				const queued = queue.shift();
				if (queued) return resolve(queued);
				const timer = setTimeout(() => reject(new Error(`${label}: timed out waiting for message`)), 5000);
				waiters.push((frame) => {
					clearTimeout(timer);
					resolve(frame);
				});
			}),
		sendEvent: (event, data) => ws.send(JSON.stringify({ event, data })),
		close: () => ws.close(),
	};

	return new Promise((resolve, reject) => {
		ws.on("open", () => resolve(client));
		ws.on("error", reject);
	});
}

async function main(): Promise<void> {
	// 1. Guest connect
	const a = await connect("A");
	const aConnected = await a.next();
	log(
		"guest connected frame",
		aConnected.event === "game:connected" && aConnected.data.isGuest === true,
		JSON.stringify(aConnected),
	);

	// 2. Invalid payload -> validation error
	a.sendEvent("game:make-move", { row: "x" });
	const invalid = await a.next();
	log(
		"invalid payload -> game:error 400",
		invalid.event === "game:error" && invalid.data.code === 400 && Array.isArray(invalid.data.errors),
		JSON.stringify(invalid),
	);

	// 3. Unknown event
	a.sendEvent("game:nonsense", {});
	const unknown = await a.next();
	log(
		"unknown event -> game:error 400",
		unknown.event === "game:error" && unknown.data.code === 400,
		JSON.stringify(unknown.data),
	);

	// 4. Non-preset board -> validation error
	a.sendEvent("game:join-queue", { gridRows: 3, gridCols: 3, maxPlayers: 2, playerName: "GuestA" });
	const nonPreset = await a.next();
	log(
		"non-preset board -> game:error 400",
		nonPreset.event === "game:error" && nonPreset.data.code === 400,
		JSON.stringify(nonPreset.data),
	);

	// 5. Two guests queue micro 4x5x2 -> game starts
	const b = await connect("B");
	const bConnected = await b.next();
	log("second guest connected", bConnected.event === "game:connected");

	a.sendEvent("game:join-queue", { gridRows: 4, gridCols: 5, maxPlayers: 2, playerName: "GuestA" });
	const aQueued = await a.next();
	log("queued frame", aQueued.event === "game:queued" && aQueued.data.position === 1, JSON.stringify(aQueued.data));

	b.sendEvent("game:join-queue", { gridRows: 4, gridCols: 5, maxPlayers: 2, playerName: "GuestB" });
	const bQueued = await b.next();
	log("second queued frame", bQueued.event === "game:queued" && bQueued.data.position === 2, JSON.stringify(bQueued.data));

	const aStart = await a.next();
	const aState = await a.next();
	const bStart = await b.next();
	const bState = await b.next();
	log(
		"game:start broadcast",
		aStart.event === "game:start" && bStart.event === "game:start" && aStart.data.players.length === 2,
		JSON.stringify(aStart.data.players.map((p: { name: string }) => p.name)),
	);
	log("game:state broadcast", aState.event === "game:state" && bState.event === "game:state" && aState.data.currentTurn === 0);

	// 6. Current-turn player moves
	const firstPlayerId = aStart.data.players[0].id;
	const mover = firstPlayerId === aConnected.data.playerId ? a : b;
	const other = mover === a ? b : a;
	mover.sendEvent("game:make-move", { row: 0, col: 0 });
	const moveStateMover = await mover.next();
	const moveStateOther = await other.next();
	log(
		"move applied + broadcast",
		moveStateMover.event === "game:state" &&
			moveStateOther.event === "game:state" &&
			moveStateMover.data.board[0][0].count === 1 &&
			moveStateMover.data.currentTurn === 1,
		`cell=${JSON.stringify(moveStateMover.data.board[0][0])} turn=${moveStateMover.data.currentTurn}`,
	);

	// 7. Other player forfeits -> game over
	other.sendEvent("game:leave-game");
	const over = await mover.next();
	log(
		"forfeit -> game:over",
		over.event === "game:over" && over.data.winner.id === aStart.data.players[0].id,
		JSON.stringify(over.data),
	);

	a.close();
	b.close();

	// 8. Authenticated connect via subprotocol
	if (token) {
		const auth = await connect("AUTH", token);
		const authMsg = await auth.next();
		log(
			"auth subprotocol connect",
			authMsg.event === "game:connected" && authMsg.data.isGuest === false,
			JSON.stringify(authMsg.data),
		);
		auth.close();
	} else {
		log("auth subprotocol connect", false, "no token provided");
	}

	finished = true;
	const failed = results.filter((result) => !result.ok);
	console.log(`\n${results.length - failed.length}/${results.length} passed`);
	process.exit(failed.length ? 1 : 0);
}

main().catch((err: unknown) => {
	console.error("SMOKE FAILED:", err instanceof Error ? err.message : String(err));
	process.exit(1);
});

setTimeout(() => {
	if (!finished) {
		console.error("SMOKE TIMED OUT");
		process.exit(1);
	}
}, 30000);
