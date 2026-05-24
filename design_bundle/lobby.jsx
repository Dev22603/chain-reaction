// lobby.jsx — Create / Join dialogs + Queue (matchmaking) screen.
// Mocks the WebSocket flow with timers so the buttons feel alive.

const { useState, useEffect, useRef, useMemo } = React;

// ─── helpers ──────────────────────────────────────────────────────────

const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRoomCode(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return out;
}

const LOBBY_PRESETS = [
  { key: "micro",    label: "Micro",    rows: 4,  cols: 5  },
  { key: "classic",  label: "Classic",  rows: 6,  cols: 9  },
  { key: "standard", label: "Standard", rows: 8,  cols: 12 },
  { key: "tower",    label: "Tower",    rows: 10, cols: 8  },
];

// ─── DialogShell ──────────────────────────────────────────────────────

function DialogShell({ open, onClose, accent, labelledBy, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="dialog-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className="dialog-card"
        style={{ "--dialog-accent": accent }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Create Room dialog ───────────────────────────────────────────────

function CreateRoomDialog({ open, defaultPlayers, onClose, onConfirm }) {
  const [players, setPlayers] = useState(defaultPlayers || 2);
  const [preset, setPreset] = useState(LOBBY_PRESETS[1]);

  useEffect(() => {
    if (open) {
      setPlayers(defaultPlayers || 2);
      setPreset(LOBBY_PRESETS[1]);
    }
  }, [open, defaultPlayers]);

  const adjust = (delta) => {
    setPlayers((p) => Math.min(8, Math.max(2, p + delta)));
    window.ChainSound?.play("click");
  };

  return (
    <DialogShell open={open} onClose={onClose} accent="var(--reactor)" labelledBy="create-title">
      <header className="dlg-header">
        <h2 id="create-title" className="dlg-title">
          CREATE<br /><span className="accent-reactor">A ROOM</span>
        </h2>
        <button className="dlg-close" onClick={onClose} aria-label="Close dialog">
          <DlgIconX />
        </button>
      </header>
      <p className="dlg-subtitle">
        Pick your settings and share the code with friends — no signup needed.
      </p>

      <section className="dlg-section">
        <p className="dlg-section-label">Players</p>
        <div className="dlg-stepper">
          <button
            className="dlg-step-btn"
            onClick={() => adjust(-1)}
            disabled={players <= 2}
            aria-label="Decrease players"
          >
            <DlgIconMinus />
          </button>
          <div className="dlg-step-value">{players}</div>
          <button
            className="dlg-step-btn"
            onClick={() => adjust(1)}
            disabled={players >= 8}
            aria-label="Increase players"
          >
            <DlgIconPlus />
          </button>
        </div>
        <div className="dlg-pips">
          {[2, 3, 4, 5, 6, 7, 8].map((v) => (
            <button
              key={v}
              className={`dlg-pip ${v <= players ? "on" : ""}`}
              onClick={() => { setPlayers(v); window.ChainSound?.play("click"); }}
              aria-label={`Set ${v} players`}
            />
          ))}
        </div>
      </section>

      <section className="dlg-section">
        <p className="dlg-section-label">Board</p>
        <div className="dlg-presets">
          {LOBBY_PRESETS.map((p) => (
            <button
              key={p.key}
              className={`dlg-preset ${preset.key === p.key ? "active" : ""}`}
              onClick={() => { setPreset(p); window.ChainSound?.play("click"); }}
              type="button"
            >
              <span className="dlg-preset-label">{p.label}</span>
              <span className="dlg-preset-dims">{p.rows} × {p.cols}</span>
            </button>
          ))}
        </div>
        <BoardPreview rows={preset.rows} cols={preset.cols} />
      </section>

      <footer className="dlg-footer">
        <button className="dlg-btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="dlg-btn-primary"
          onClick={() => onConfirm({ players, rows: preset.rows, cols: preset.cols })}
        >
          <DlgIconCheck />
          <span>Create room</span>
        </button>
      </footer>
      <p className="dlg-fineprint">You'll get a 6-character code to share.</p>
    </DialogShell>
  );
}

function BoardPreview({ rows, cols }) {
  return (
    <div className="dlg-preview">
      <div
        className="dlg-preview-grid"
        style={{ backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})` }}
        aria-hidden="true"
      >
        <span className="dlg-preview-orb" style={{ left: "18%", top: "24%",  background: "var(--p1)", color: "var(--p1)" }} />
        <span className="dlg-preview-orb sm" style={{ left: "52%", top: "42%", background: "var(--p2)", color: "var(--p2)" }} />
        <span className="dlg-preview-orb xs" style={{ right: "18%", bottom: "20%", background: "var(--uranium)", color: "var(--uranium)" }} />
      </div>
      <div className="dlg-preview-meta">
        <span>Preview</span>
        <span className="alt">{rows} × {cols} board</span>
      </div>
    </div>
  );
}

// ─── Join Room dialog ─────────────────────────────────────────────────

const JOIN_CODE_LEN = 6;
const VALID_CHAR_RE = /^[A-Z0-9]$/;

function JoinRoomDialog({ open, onClose, onConfirm }) {
  const [chars, setChars] = useState(() => Array(JOIN_CODE_LEN).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    if (open) {
      setChars(Array(JOIN_CODE_LEN).fill(""));
      requestAnimationFrame(() => inputRefs.current[0]?.focus());
    }
  }, [open]);

  const code = useMemo(() => chars.join(""), [chars]);
  const complete = chars.every((c) => c !== "");

  const setAt = (i, v) => setChars((prev) => {
    const next = [...prev];
    next[i] = v;
    return next;
  });

  const onInput = (i, raw) => {
    if (!raw) { setAt(i, ""); return; }
    const u = raw.toUpperCase();
    if (!VALID_CHAR_RE.test(u)) return;
    setAt(i, u);
    window.ChainSound?.play("click");
    if (i < JOIN_CODE_LEN - 1) inputRefs.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace") {
      if (!chars[i] && i > 0) {
        e.preventDefault();
        inputRefs.current[i - 1]?.focus();
        setAt(i - 1, "");
      } else if (chars[i]) {
        setAt(i, "");
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      e.preventDefault();
      inputRefs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < JOIN_CODE_LEN - 1) {
      e.preventDefault();
      inputRefs.current[i + 1]?.focus();
    } else if (e.key === "Enter" && complete) {
      e.preventDefault();
      onConfirm(code);
    }
  };

  const onPaste = (e) => {
    const pasted = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = Array(JOIN_CODE_LEN).fill("");
    for (let k = 0; k < Math.min(JOIN_CODE_LEN, pasted.length); k++) next[k] = pasted[k];
    setChars(next);
    window.ChainSound?.play("click");
    inputRefs.current[Math.min(JOIN_CODE_LEN - 1, pasted.length)]?.focus();
  };

  return (
    <DialogShell open={open} onClose={onClose} accent="var(--cherenkov)" labelledBy="join-title">
      <header className="dlg-header">
        <h2 id="join-title" className="dlg-title">
          JOIN<br /><span className="accent-cherenkov">A ROOM</span>
        </h2>
        <button className="dlg-close" onClick={onClose} aria-label="Close dialog">
          <DlgIconX />
        </button>
      </header>
      <p className="dlg-subtitle">Enter the 6-character code your host shared with you.</p>

      <div className="dlg-code-row" onPaste={onPaste}>
        {chars.map((c, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            value={c}
            onChange={(e) => onInput(i, e.target.value.slice(-1))}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            maxLength={1}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-label={`Code position ${i + 1}`}
            className={`dlg-code-input ${c ? "filled" : ""}`}
          />
        ))}
      </div>
      <p className="dlg-code-hint">Paste a code or type to advance</p>

      <footer className="dlg-footer">
        <button className="dlg-btn-ghost" onClick={onClose}>Cancel</button>
        <button
          className="dlg-btn-primary cherenkov"
          onClick={() => complete && onConfirm(code)}
          disabled={!complete}
        >
          <span>Enter room</span>
          <DlgIconArrowRight />
        </button>
      </footer>
    </DialogShell>
  );
}

// ─── Invite card (reused by QueueScreen + in-game share dialog) ──────

function InviteCard({ code, variant = "hero" }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch (e) { /* sandbox */ }
    setCopied(true);
    window.ChainSound?.play("click");
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <section className={`invite-card ${variant}`} aria-label="Invite code">
      {variant === "hero" ? (
        <div className="invite-card-bg" aria-hidden="true">
          {QUEUE_ORB_COLORS.slice(0, 3).map((color, i) => (
            <span
              key={i}
              className="invite-bg-orb"
              style={{
                left: `${15 + i * 35}%`,
                top: `${20 + (i % 2) * 50}%`,
                background: `radial-gradient(circle at 30% 30%, #fff, ${color} 55%, color-mix(in srgb, ${color} 50%, #000))`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="invite-card-content">
        <p className="invite-label">Invite code</p>
        <div className="invite-code-row">
          {code.split("").map((ch, i) => (
            <span key={i} className="invite-code-cell">{ch}</span>
          ))}
        </div>
        <button
          type="button"
          className={`invite-copy-btn ${copied ? "copied" : ""}`}
          onClick={onCopy}
        >
          {copied ? <DlgIconCheck /> : <IconCopy />}
          <span>{copied ? "Copied" : "Copy code"}</span>
        </button>
      </div>
    </section>
  );
}

// ─── ShareCodeDialog (used during gameplay so host can resend code) ──

function ShareCodeDialog({ open, code, joined, max, onClose }) {
  if (!open || !code) return null;
  const remaining = Math.max(0, (max || 0) - (joined || 0));
  return (
    <DialogShell open={open} onClose={onClose} accent="var(--cherenkov)" labelledBy="share-title">
      <header className="dlg-header">
        <h2 id="share-title" className="dlg-title">
          ROOM<br /><span className="accent-cherenkov">CODE</span>
        </h2>
        <button className="dlg-close" onClick={onClose} aria-label="Close dialog">
          <DlgIconX />
        </button>
      </header>
      <p className="dlg-subtitle">
        {remaining > 0
          ? `${joined} of ${max} reactor${max === 1 ? "" : "s"} linked · ${remaining} slot${remaining === 1 ? "" : "s"} open`
          : `All ${max} reactors are linked.`}
      </p>
      <InviteCard code={code} variant="compact" />
      <div className="share-crew-row">
        <div className="share-crew-slots">
          {Array.from({ length: max || 0 }, (_, i) => (
            <div key={i} className={`queue-slot ${i < (joined || 0) ? "on" : ""}`} />
          ))}
        </div>
        <p className="share-crew-label">
          <span>crew</span>
          <span><strong>{joined}</strong><i>/{max}</i></span>
        </p>
      </div>
      <footer className="dlg-footer single">
        <button className="dlg-btn-primary cherenkov" onClick={onClose}>
          <span>Got it</span>
          <DlgIconCheck />
        </button>
      </footer>
    </DialogShell>
  );
}

// ─── Queue screen ─────────────────────────────────────────────────────

const QUEUE_ORB_COLORS = ["#ff3b6b", "#2ad8ff", "#ffd23f", "#5cff9b", "#ff6b1f"];

function QueueScreen({ mode, code, position, max, onCancel, onStartNow }) {
  const slots = max || 4;
  const percent = max > 0 ? Math.min(100, Math.round((position / max) * 100)) : 0;
  const modeLabel = mode === "private" ? "private" : mode === "ranked" ? "ranked" : "casual";
  const isPrivate = mode === "private" && !!code;

  return (
    <div className={`queue-screen ${isPrivate ? "private" : ""}`}>
      <header className="queue-head">
        <p className="queue-eyebrow">
          <span className="dot" />{isPrivate ? "// room created" : "// awaiting fission"}
        </p>
        <h1 className="queue-title">
          {isPrivate ? "Share the code" : "Spinning up"}
          <span className="cursor">_</span>
        </h1>
        <p className="queue-sub">
          {isPrivate
            ? `Send this code to friends. The lattice starts when ${max} reactor${max === 1 ? "" : "s"} are linked.`
            : `Pairing ${max} reactor${max === 1 ? "" : "s"} into a ${modeLabel} lattice.`}
        </p>
      </header>

      {isPrivate ? <InviteCard code={code} variant="hero" /> : null}

      <section className="queue-body">
        {!isPrivate ? (
          <div className="queue-hero-orbs" aria-hidden="true">
            {QUEUE_ORB_COLORS.map((color, i) => (
              <span
                key={i}
                className="qorb"
                style={{
                  "--qd": `${1.8 + i * 0.25}s`,
                  "--qdy": `${i * 0.18}s`,
                  left: `${10 + i * 18}%`,
                  top: `${18 + (i % 2) * 38}%`,
                  background: `radial-gradient(circle at 30% 30%, #fff, ${color} 55%, color-mix(in srgb, ${color} 50%, #000))`,
                  boxShadow: `0 0 24px ${color}, inset 0 0 6px rgba(255,255,255,.4)`,
                }}
              />
            ))}
          </div>
        ) : null}

        <div className="queue-panel">
          <div>
            <div className="queue-row">
              <span>{isPrivate ? "crew" : "operators"}</span>
              <span>
                <strong>{position}</strong>
                <i>/{max || "-"}</i>
              </span>
            </div>
            <div className="queue-slots">
              {Array.from({ length: slots }, (_, i) => (
                <div key={i} className={`queue-slot ${i < position ? "on" : ""}`} />
              ))}
            </div>
          </div>

          <div className="queue-progress-wrap">
            <p className="queue-label">{isPrivate ? "linked" : "progress"}</p>
            <div className="queue-progress">
              <div className="queue-progress-fill" style={{ width: `${percent}%` }} />
              <div className="queue-progress-text">{percent}%</div>
            </div>
          </div>

          <p className="queue-meta">
            {isPrivate ? "room" : "queue"} · {modeLabel}<br />
            {isPrivate ? "status · open" : "est. wait · low"}
          </p>
        </div>
      </section>

      <div className="queue-actions">
        <button className="queue-abort" onClick={onCancel}>
          <DlgIconX />
          <span>{isPrivate ? "Cancel room" : "Abort sequence"}</span>
        </button>
        {isPrivate && onStartNow ? (
          <button className="queue-start-btn" onClick={onStartNow} type="button">
            <span>Start with bots</span>
            <DlgIconArrowRight />
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── BoardCodePopover (in-game floating Show Code button) ────────────

function BoardCodePopover({ code, joined, max }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onCopy = async () => {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); } catch (e) { /* sandbox */ }
    setCopied(true);
    window.ChainSound?.play("click");
    setTimeout(() => setCopied(false), 1500);
  };

  if (!code) return null;

  const showCrew = typeof joined === "number" && typeof max === "number" && max > 0;
  const remaining = showCrew ? Math.max(0, max - joined) : 0;

  return (
    <div className="board-code-anchor" ref={rootRef}>
      <button
        type="button"
        className={`board-code-btn ${open ? "open" : ""}`}
        onClick={() => { setOpen((o) => !o); window.ChainSound?.play("click"); }}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <IconCopy />
        <span>{open ? "Hide code" : "Show code"}</span>
      </button>
      {open ? (
        <div className="board-code-popover" role="dialog" aria-label="Room code">
          <p className="board-code-label">Invite code</p>
          <div className="board-code-row">
            {code.split("").map((ch, i) => (
              <span key={i} className="board-code-cell">{ch}</span>
            ))}
          </div>
          {showCrew ? (
            <div className="board-code-crew">
              <div className="board-code-crew-slots">
                {Array.from({ length: max }, (_, i) => (
                  <div key={i} className={`crew-slot ${i < joined ? "on" : ""}`} />
                ))}
              </div>
              <p className="board-code-crew-text">
                <strong>{joined}</strong>
                <span className="slash">/</span>
                <span className="max">{max}</span>
                <span className="hint">
                  {remaining > 0 ? `· ${remaining} slot${remaining === 1 ? "" : "s"} open` : "· full"}
                </span>
              </p>
            </div>
          ) : null}
          <button
            type="button"
            className={`board-code-copy ${copied ? "copied" : ""}`}
            onClick={onCopy}
          >
            {copied ? <DlgIconCheck /> : <IconCopy />}
            <span>{copied ? "Copied" : "Copy code"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────

function DlgIconX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function DlgIconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function DlgIconArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
function DlgIconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function DlgIconMinus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

// Expose to other Babel scripts
Object.assign(window, {
  CreateRoomDialog,
  JoinRoomDialog,
  QueueScreen,
  ShareCodeDialog,
  InviteCard,
  BoardCodePopover,
  IconShare,
  makeRoomCode,
});
