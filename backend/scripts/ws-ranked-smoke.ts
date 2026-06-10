// Ranked-flow smoke test (auth players, scoring, persistence). Run with the server up:
//   npx tsx scripts/ws-ranked-smoke.ts <tokenA> <tokenB>
import WebSocket from "ws";

const URL = "ws://localhost:8080/game";
const [tokenA, tokenB] = process.argv.slice(2);

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

function connect(token: string): Promise<TestClient> {
	const ws = new WebSocket(URL, token);
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
				const timer = setTimeout(() => reject(new Error("timed out waiting for message")), 8000);
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
	if (!tokenA || !tokenB) {
		throw new Error("usage: npx tsx scripts/ws-ranked-smoke.ts <tokenA> <tokenB>");
	}

	const a = await connect(tokenA);
	const b = await connect(tokenB);
	const aConn = await a.next();
	const bConn = await b.next();
	console.log("A:", aConn.data.displayName, aConn.data.isGuest ? "(guest!)" : "(auth)");
	console.log("B:", bConn.data.displayName, bConn.data.isGuest ? "(guest!)" : "(auth)");

	a.sendEvent("game:join-queue", { mode: "ranked", gridRows: 3, gridCols: 3, maxPlayers: 2, playerName: "ignored" });
	await a.next(); // queued
	b.sendEvent("game:join-queue", { mode: "ranked", gridRows: 3, gridCols: 3, maxPlayers: 2, playerName: "ignored" });
	await b.next(); // queued

	const aStart = await a.next();
	await a.next(); // state
	await b.next(); // start
	await b.next(); // state
	console.log("ranked game started:", aStart.data.mode, aStart.data.players.map((p: { name: string }) => p.name).join(" vs "));

	const firstId = aStart.data.players[0].id;
	const mover = firstId === aConn.data.playerId ? a : b;
	const other = mover === a ? b : a;
	mover.sendEvent("game:make-move", { row: 0, col: 0 });
	await mover.next(); // state
	await other.next(); // state
	other.sendEvent("game:leave-game");
	const over = await mover.next();
	console.log("game over:", JSON.stringify(over.data));

	if (over.event !== "game:over") throw new Error("expected game:over");
	if (!over.data.scoreDeltas) throw new Error("expected scoreDeltas on ranked game_over");
	console.log("PASS ranked game over with scoreDeltas");

	a.close();
	b.close();
	// give fire-and-forget persistence a moment before the caller checks REST
	await new Promise((resolve) => setTimeout(resolve, 1500));
	process.exit(0);
}

main().catch((err: unknown) => {
	console.error("RANKED SMOKE FAILED:", err instanceof Error ? err.message : String(err));
	process.exit(1);
});
