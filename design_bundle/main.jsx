// app.jsx — top-level prototype.
// (cache touch)

const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "screen": "landing",
  "atomStyle": "nucleus",
  "popStyle": "burst",
  "soundPack": "reactor",
  "gridSize": "6x9",
  "playerCount": 4,
  "selfIndex": 0,
  "muted": false,
  "autoAI": true,
  "aiSpeed": 900
}/*EDITMODE-END*/;

const GRID_PRESETS = {
  "4x5":   { rows: 4,  cols: 5  },
  "6x6":   { rows: 6,  cols: 6  },
  "6x9":   { rows: 6,  cols: 9  },
  "8x6":   { rows: 8,  cols: 6  },
  "8x12":  { rows: 8,  cols: 12 },
  "10x6":  { rows: 10, cols: 6  },
  "10x8":  { rows: 10, cols: 8  },
};

function gridKey(rows, cols) {
  const k = `${rows}x${cols}`;
  return GRID_PRESETS[k] ? k : null;
}

const CASCADE_STEP_MS = 380;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const grid = GRID_PRESETS[t.gridSize] || GRID_PRESETS["6x9"];

  // Lobby / matchmaking state
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  // { mode: 'casual'|'private', code: string|null, position: number, max: number, rows, cols }
  const [queueInfo, setQueueInfo] = useState(null);
  // In-game room meta (set when we entered via CREATE) so the host can re-share the code.
  // { code: string, joined: number, max: number }
  const [roomMeta, setRoomMeta] = useState(null);

  // Build initial players list
  const players = useMemo(
    () => Array.from({ length: t.playerCount }, (_, i) => ({
      id: `p${i}`,
      name: PLAYER_NAMES[i],
      eliminated: false,
    })),
    [t.playerCount]
  );

  const [game, setGame] = useState(() => buildGame(grid.rows, grid.cols, players));
  const [effects, setEffects] = useState([]);
  const cascadeBusy = useRef(false);
  const [winner, setWinner] = useState(null);
  const [resetKey, setResetKey] = useState(0);

  // Reset game when player count or grid size changes
  useEffect(() => {
    setGame(buildGame(grid.rows, grid.cols, players));
    setEffects([]);
    setWinner(null);
    cascadeBusy.current = false;
    if (t.selfIndex >= t.playerCount) setTweak("selfIndex", 0);
  }, [t.playerCount, t.gridSize, resetKey]); // eslint-disable-line

  // Sound pack + mute wiring
  useEffect(() => { window.ChainSound.setPack(t.soundPack); }, [t.soundPack]);
  useEffect(() => { window.ChainSound.setMuted(t.muted); }, [t.muted]);

  // Resume audio on first interaction
  useEffect(() => {
    const onAny = () => window.ChainSound.resume();
    window.addEventListener("pointerdown", onAny, { once: true });
    return () => window.removeEventListener("pointerdown", onAny);
  }, []);

  // ─── Lobby → Queue → Game flow ────────────────────────────────────

  const startQueue = useCallback(({ mode, code, players, rows, cols }) => {
    window.ChainSound?.resume();
    window.ChainSound?.play("click");
    // Apply settings to the tweak store so the game rebuilds with them
    setTweak({ playerCount: players });
    const key = gridKey(rows, cols);
    if (key) setTweak({ gridSize: key });
    setQueueInfo({
      mode,
      code: code || null,
      position: 1,
      max: players,
      rows,
      cols,
    });
    setTweak({ screen: "queue" });
  }, [setTweak]);

  const cancelQueue = useCallback(() => {
    window.ChainSound?.play("click");
    setQueueInfo(null);
    setTweak({ screen: "landing" });
  }, [setTweak]);

  const onPlay = useCallback(() => {
    startQueue({
      mode: "casual",
      code: null,
      players: t.playerCount,
      rows: grid.rows,
      cols: grid.cols,
    });
  }, [startQueue, t.playerCount, grid.rows, grid.cols]);

  const onCreateConfirm = useCallback(({ players, rows, cols }) => {
    setCreateOpen(false);
    startQueue({
      mode: "private",
      code: makeRoomCode(),
      players,
      rows,
      cols,
    });
  }, [startQueue]);

  const onJoinConfirm = useCallback((code) => {
    setJoinOpen(false);
    // Joining a room = the lattice is already provisioned by the host.
    // Drop straight into the game; no share-code screen for the joiner.
    window.ChainSound?.resume();
    window.ChainSound?.play("turn");
    setRoomMeta({ code, joined: t.playerCount, max: t.playerCount });
    setResetKey((k) => k + 1);
    setQueueInfo(null);
    setTweak({ screen: "game" });
  }, [setTweak, t.playerCount]);

  // Queue auto-fill tick: every ~750ms add a player, then start the game.
  // Private rooms (CREATE) do NOT auto-fill — the host shares the code and either
  // waits or hits "Start with bots" to begin.
  useEffect(() => {
    if (t.screen !== "queue" || !queueInfo) return;
    if (queueInfo.mode === "private") return; // wait for host action
    if (queueInfo.position >= queueInfo.max) {
      const tm = setTimeout(() => {
        // Casual queue matched — mint a room code so the user can still re-share it.
        const code = queueInfo.code || makeRoomCode();
        setRoomMeta({ code, joined: queueInfo.max, max: queueInfo.max });
        setResetKey((k) => k + 1);
        setQueueInfo(null);
        setTweak({ screen: "game" });
        window.ChainSound?.play("turn");
      }, 650);
      return () => clearTimeout(tm);
    }
    const tm = setTimeout(() => {
      setQueueInfo((q) => (q ? { ...q, position: q.position + 1 } : q));
      window.ChainSound?.play("click");
    }, 650 + Math.random() * 350);
    return () => clearTimeout(tm);
  }, [t.screen, queueInfo, setTweak]);

  const startNow = useCallback(() => {
    // Lock in the room's settings as game state, but keep the code visible in-game
    // so the host can resend it if a friend asks.
    setRoomMeta(queueInfo?.code
      ? { code: queueInfo.code, joined: Math.max(1, queueInfo.position || 1), max: queueInfo.max }
      : null);
    setResetKey((k) => k + 1);
    setQueueInfo(null);
    setTweak({ screen: "game" });
    window.ChainSound?.play("turn");
  }, [setTweak, queueInfo]);

  // Simulate a slow trickle of joins while the host is in-game with an open room.
  // (In the real app this comes from the server's room_state frames.)
  useEffect(() => {
    if (t.screen !== "game" || !roomMeta) return;
    if (roomMeta.joined >= roomMeta.max) return;
    const tm = setTimeout(() => {
      setRoomMeta((rm) => (rm && rm.joined < rm.max ? { ...rm, joined: rm.joined + 1 } : rm));
      window.ChainSound?.play("click");
    }, 7000 + Math.random() * 5000);
    return () => clearTimeout(tm);
  }, [t.screen, roomMeta]);

  // If the user lands on the game screen without going through a flow (e.g. by
  // flipping the Tweaks screen toggle), mint a stub room so the Show Code
  // affordance still appears. This is purely a prototype convenience.
  useEffect(() => {
    if (t.screen === "game" && !roomMeta) {
      setRoomMeta({
        code: makeRoomCode(),
        joined: t.playerCount,
        max: t.playerCount,
      });
    }
  }, [t.screen, roomMeta, t.playerCount]);

  // AI driver — when it's not the user's turn and autoAI on
  useEffect(() => {
    if (t.screen !== "game") return;
    if (winner !== null) return;
    if (cascadeBusy.current) return;
    if (game.currentTurn === t.selfIndex) return;
    if (!t.autoAI) return;
    const current = game.players[game.currentTurn];
    if (!current || current.eliminated) return;
    const handle = setTimeout(() => {
      const move = window.GameEngine.aiPickMove(game.board, game.rows, game.cols, game.currentTurn);
      if (move) handleMove(move.row, move.col, true);
    }, t.aiSpeed);
    return () => clearTimeout(handle);
  }, [game, t.autoAI, t.aiSpeed, t.screen, t.selfIndex, winner]); // eslint-disable-line

  const handleMove = useCallback(async (row, col, isAi = false) => {
    if (cascadeBusy.current) return;
    if (winner !== null) return;
    const cell = game.board[row][col];
    const player = game.currentTurn;
    if (cell.owner !== null && cell.owner !== player) {
      window.ChainSound.play("error");
      return;
    }

    cascadeBusy.current = true;
    const E = window.GameEngine;

    // Place the orb
    const placed = E.deepCloneBoard(game.board);
    placed[row][col].count += 1;
    placed[row][col].owner = player;
    const moveCounts = game.moveCounts.slice();
    moveCounts[player] += 1;

    // Initial place sound + place flash effect
    window.ChainSound.play("place", { intensity: 0 });
    const placeFx = {
      id: `place-${Date.now()}`,
      type: "catch",
      row, col,
      color: PLAYER_COLORS[player],
    };
    setEffects((prev) => [...prev, placeFx]);
    setTimeout(() => setEffects((prev) => prev.filter((e) => e.id !== placeFx.id)), 500);

    setGame((g) => ({ ...g, board: placed, moveCounts }));

    // Run cascade
    let boardNow = placed;
    let stepIndex = 0;
    const gen = E.resolveCascade(placed, game.rows, game.cols, player);
    let next = await gen.next();
    while (!next.done) {
      const step = next.value;
      if (step.kind === "step") {
        // Wait a tick before showing the explosion so the initial placement is visible
        await delay(stepIndex === 0 ? 140 : 60);
        boardNow = step.board;
        setEffects((prev) => [...prev, ...step.effects]);
        const intensity = Math.min(1, step.exploded / 6);
        window.ChainSound.play("explode", { intensity });
        if (stepIndex >= 1) window.ChainSound.play("chain", { intensity });
        setGame((g) => ({ ...g, board: boardNow }));
        const ids = new Set(step.effects.map((e) => e.id));
        setTimeout(() => setEffects((prev) => prev.filter((e) => !ids.has(e.id))), 700);
        await delay(CASCADE_STEP_MS);
        stepIndex += 1;
      } else if (step.kind === "done") {
        boardNow = step.board;
        setGame((g) => ({ ...g, board: boardNow }));
      }
      next = await gen.next();
    }
    if (next.value && next.value.board) boardNow = next.value.board;

    // After cascade — eliminations + winner check + advance turn
    const elim = E.computeEliminated(boardNow, game.players, moveCounts);
    let nextPlayers = game.players.map((p, idx) => ({ ...p, eliminated: elim.has(idx) }));
    let win = E.checkWinner(nextPlayers);

    if (win === null) {
      const nt = E.nextTurn(player, nextPlayers);
      setGame((g) => ({
        ...g,
        board: boardNow,
        players: nextPlayers,
        currentTurn: nt,
        moveCounts,
      }));
      window.ChainSound.play("turn");
    } else {
      setGame((g) => ({
        ...g,
        board: boardNow,
        players: nextPlayers,
        moveCounts,
      }));
      setWinner(win);
      window.ChainSound.play("win");
    }
    cascadeBusy.current = false;
  }, [game, winner]);

  const turnColor = PLAYER_COLORS[game.currentTurn] || "#ffffff";
  const orbCounts = useMemo(
    () => window.GameEngine.tallyOrbs(game.board, game.players.length),
    [game.board, game.players.length]
  );

  if (t.screen === "landing") {
    return (
      <>
        <LandingScreen
          playerCount={t.playerCount}
          onPick={(n) => setTweak("playerCount", n)}
          onPlay={onPlay}
          onCreate={() => { window.ChainSound?.play("click"); setCreateOpen(true); }}
          onJoin={() => { window.ChainSound?.play("click"); setJoinOpen(true); }}
        />
        <CreateRoomDialog
          open={createOpen}
          defaultPlayers={t.playerCount}
          onClose={() => setCreateOpen(false)}
          onConfirm={onCreateConfirm}
        />
        <JoinRoomDialog
          open={joinOpen}
          onClose={() => setJoinOpen(false)}
          onConfirm={onJoinConfirm}
        />
        <Tweaks t={t} setTweak={setTweak} onReset={() => setResetKey((k) => k + 1)} />
      </>
    );
  }

  if (t.screen === "queue") {
    return (
      <>
        <QueueScreen
          mode={queueInfo?.mode || "casual"}
          code={queueInfo?.code || null}
          position={queueInfo?.position || 1}
          max={queueInfo?.max || t.playerCount}
          onCancel={cancelQueue}
          onStartNow={queueInfo?.mode === "private" ? startNow : undefined}
        />
        <Tweaks t={t} setTweak={setTweak} onReset={() => setResetKey((k) => k + 1)} />
      </>
    );
  }

  return (
    <>
      <div className="shell">
        <Topbar
          game={game}
          selfIndex={t.selfIndex}
          turnColor={turnColor}
          muted={t.muted}
          onToggleMute={() => setTweak("muted", !t.muted)}
          onLeave={() => {
            setRoomMeta(null);
            setTweak("screen", "landing");
          }}
        />
        {roomMeta?.code ? (
          <BoardCodePopover
            code={roomMeta.code}
            joined={roomMeta.joined}
            max={roomMeta.max}
          />
        ) : null}
        <Board
          state={game}
          selfIndex={t.selfIndex}
          turnColor={turnColor}
          onMove={(r, c) => handleMove(r, c, false)}
          popStyle={t.popStyle}
          atomStyle={t.atomStyle}
          effects={effects}
        />
        <BottomBar
          game={game}
          selfIndex={t.selfIndex}
          turnColor={turnColor}
          orbCounts={orbCounts}
          isMyTurn={game.currentTurn === t.selfIndex}
        />
      </div>

      {winner !== null && (
        <GameOver
          winnerName={game.players[winner]?.name || "Reactor"}
          winnerColor={PLAYER_COLORS[winner]}
          onAgain={() => {
            setWinner(null);
            setResetKey((k) => k + 1);
            setQueueInfo(null);
            setRoomMeta(null);
            setTweak({ screen: "landing" });
          }}
          onRematch={() => {
            setWinner(null);
            setResetKey((k) => k + 1);
          }}
        />
      )}

      <Tweaks t={t} setTweak={setTweak} onReset={() => setResetKey((k) => k + 1)} />
    </>
  );
}

function buildGame(rows, cols, players) {
  return {
    rows, cols,
    board: window.GameEngine.makeBoard(rows, cols),
    players: players.map((p) => ({ ...p })),
    currentTurn: 0,
    status: "playing",
    moveCounts: new Array(players.length).fill(0),
  };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ─── Topbar ───────────────────────────────────────────────────────────

function Topbar({ game, selfIndex, turnColor, muted, onToggleMute, onLeave }) {
  const cur = game.players[game.currentTurn];
  const isMe = game.currentTurn === selfIndex;
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-dot" />
        <span>Chain Reaction</span>
      </div>
      <div className="turn-chip" style={{ "--turn": turnColor }}>
        <span className="turn-dot" />
        <span className="name">
          {isMe ? <span className="your">YOUR TURN</span> : cur?.name}
        </span>
      </div>
      <div className="top-actions">
        <button
          className="icon-btn"
          onClick={onToggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? IconVolumeX() : IconVolume()}
        </button>
        <button className="icon-btn danger" onClick={onLeave} aria-label="Leave game">
          {IconExit()}
        </button>
      </div>
    </header>
  );
}

// ─── Bottom bar (player rail + hint row in one strip) ─────────────────

function BottomBar({ game, selfIndex, turnColor, orbCounts, isMyTurn }) {
  return (
    <div style={{ display: "grid", gap: "clamp(6px, 1svh, 10px)" }}>
      <div className="player-rail">
        {game.players.map((p, i) => {
          const color = PLAYER_COLORS[i];
          return (
            <div
              key={p.id}
              className={[
                "player-chip",
                game.currentTurn === i && !p.eliminated ? "active" : "",
                p.id === game.players[selfIndex]?.id ? "self" : "",
                p.eliminated ? "eliminated" : "",
              ].filter(Boolean).join(" ")}
              style={{ "--p": color }}
            >
              <span className="swatch">{p.eliminated ? "✕" : i + 1}</span>
              <span className="pname">{p.name}</span>
              <span className="pcount">{p.eliminated ? "out" : (orbCounts[i] ?? 0)}</span>
            </div>
          );
        })}
      </div>
      <div className="hint-row">
        <span>{game.rows} × {game.cols} lattice</span>
        <span className={`live ${isMyTurn ? "" : "idle"}`}>
          {isMyTurn ? "● tap a legal cell" : "○ watching reactor"}
        </span>
      </div>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────

const PLAYER_COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8];
const PLAYER_CHIP_COLORS = ["#ff3b6b", "#2ad8ff", "#ffd23f", "#5cff9b", "#ff3da7", "#ff6b1f", "#b6ff3c"];

function LandingScreen({ playerCount, onPick, onPlay, onCreate, onJoin }) {
  return (
    <div className="landing">
      <div className="landing-card">
        <div className="hero-orbs">
          {[
            { color: "#ff3b6b", x: 18, y: 50, s: 48 },
            { color: "#2ad8ff", x: 50, y: 30, s: 64 },
            { color: "#ffd23f", x: 82, y: 55, s: 42 },
            { color: "#5cff9b", x: 35, y: 80, s: 34 },
            { color: "#ff6b1f", x: 68, y: 78, s: 50 },
          ].map((o, i) => (
            <span
              key={i}
              className="horb"
              style={{
                width: o.s, height: o.s,
                left: `${o.x}%`, top: `${o.y}%`,
                background: `radial-gradient(circle at 30% 30%, #fff, ${o.color} 55%, color-mix(in srgb, ${o.color} 55%, #000))`,
                boxShadow: `0 0 24px ${o.color}, inset 0 0 6px rgba(255,255,255,.4)`,
                animation: `atom-breathe ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>

        <h1 className="title">
          CHAIN <span className="accent">REACTION</span>
        </h1>
        <p className="tagline">Pop. Bounce. Take over the board.</p>

        <div className="player-count-row" role="radiogroup" aria-label="Number of players">
          {PLAYER_COUNT_OPTIONS.map((n, i) => {
            const active = playerCount === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={active}
                className={`pc-chip ${active ? "active" : ""}`}
                style={{ "--pc-color": PLAYER_CHIP_COLORS[i] }}
                onClick={() => { window.ChainSound.play("click"); onPick(n); }}
              >
                {n}
              </button>
            );
          })}
        </div>

        <div className="cta-row">
          <div className="cta-secondary-row">
            <button className="btn-secondary btn-create" onClick={onCreate} type="button">
              {IconUsers()}<span>CREATE</span>
            </button>
            <button className="btn-secondary btn-join" onClick={onJoin} type="button">
              {IconLogin()}<span>JOIN</span>
            </button>
          </div>
          <button className="btn-play" onClick={onPlay} type="button">
            {IconPlay()}<span>PLAY</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Game Over ───────────────────────────────────────────────────────

function GameOver({ winnerName, winnerColor, onAgain, onRematch }) {
  return (
    <div className="gameover" style={{ "--win-color": winnerColor }}>
      <Confetti color={winnerColor} />
      <div className="gameover-card">
        <div className="label">Winner</div>
        <h2 className="winner">{winnerName}</h2>
        <div className="gameover-actions">
          {onRematch ? (
            <button className="btn-secondary" onClick={onRematch} type="button">
              <span>REMATCH</span>
            </button>
          ) : null}
          <button className="btn-play" onClick={onAgain} type="button">
            <span>BACK TO LOBBY</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Confetti({ color }) {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.6 + Math.random() * 1.6,
    rot: Math.random() * 360,
    color: [color, "#ffd23f", "#2ad8ff", "#ff3da7", "#5cff9b"][i % 5],
  })), [color]);
  return (
    <>
      {pieces.map((p) => (
        <span key={p.id} className="confetti" style={{
          left: `${p.left}%`,
          background: p.color,
          transform: `rotate(${p.rot}deg)`,
          animationDelay: `${p.delay}s`,
          "--dur": `${p.dur}s`,
        }} />
      ))}
    </>
  );
}

// ─── Tweaks panel ────────────────────────────────────────────────────

function Tweaks({ t, setTweak, onReset }) {
  return (
    <TweaksPanel>
      <TweakSection label="View" />
      <TweakRadio
        label="Screen"
        value={t.screen}
        options={["landing", "queue", "game"]}
        onChange={(v) => setTweak("screen", v)}
      />

      <TweakSection label="Visuals" />
      <TweakRadio
        label="Atom"
        value={t.atomStyle}
        options={["nucleus", "plasma", "crystal"]}
        onChange={(v) => setTweak("atomStyle", v)}
      />
      <TweakRadio
        label="Pop FX"
        value={t.popStyle}
        options={["burst", "shockwave", "implosion"]}
        onChange={(v) => setTweak("popStyle", v)}
      />

      <TweakSection label="Audio" />
      <TweakRadio
        label="Sound"
        value={t.soundPack}
        options={["reactor", "arcade", "lab"]}
        onChange={(v) => setTweak("soundPack", v)}
      />
      <TweakToggle
        label="Muted"
        value={t.muted}
        onChange={(v) => setTweak("muted", v)}
      />

      <TweakSection label="Match" />
      <TweakSelect
        label="Grid"
        value={t.gridSize}
        options={["4x5", "6x6", "6x9", "8x6", "8x12", "10x6", "10x8"]}
        onChange={(v) => setTweak("gridSize", v)}
      />
      <TweakSlider
        label="Players"
        value={t.playerCount}
        min={2} max={8} step={1}
        onChange={(v) => setTweak("playerCount", v)}
      />
      <TweakSelect
        label="You are"
        value={String(t.selfIndex)}
        options={Array.from({ length: t.playerCount }, (_, i) => String(i)).map((s) => s)}
        onChange={(v) => setTweak("selfIndex", parseInt(v, 10))}
      />
      <TweakToggle
        label="AI opponents"
        value={t.autoAI}
        onChange={(v) => setTweak("autoAI", v)}
      />
      <TweakSlider
        label="AI speed"
        value={t.aiSpeed}
        min={250} max={2000} step={50}
        unit="ms"
        onChange={(v) => setTweak("aiSpeed", v)}
      />
      <TweakButton label="Restart match" onClick={onReset} />
    </TweaksPanel>
  );
}

// ─── Icons (Lucide-style) ────────────────────────────────────────────

function svg(children, size = 16) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
function IconVolume() {
  return svg(<>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
  </>);
}
function IconVolumeX() {
  return svg(<>
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <line x1="22" y1="9" x2="16" y2="15" />
    <line x1="16" y1="9" x2="22" y2="15" />
  </>);
}
function IconExit() {
  return svg(<>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>);
}
function IconPlay() {
  return svg(<polygon points="6 4 20 12 6 20 6 4" fill="currentColor" />, 28);
}
function IconUsers() {
  return svg(<>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </>, 20);
}
function IconLogin() {
  return svg(<>
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </>, 20);
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
