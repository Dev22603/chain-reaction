// board.jsx — grid, cells, and pop-effect overlay.

const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;

function Board({
  state,
  selfIndex,
  turnColor,
  onMove,
  popStyle,
  atomStyle,
  effects,
}) {
  const { board, rows, cols, currentTurn, players, status } = state;
  const isMyTurn = currentTurn === selfIndex;
  const currentPlayer = players[currentTurn];
  const acceptingInput = status === "playing" && !currentPlayer?.eliminated;

  // Measure cell size for absolute-positioned pop effects
  const frameRef = useRef(null);
  const [cellSize, setCellSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!frameRef.current) return;
    const ro = new ResizeObserver(() => {
      const el = frameRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCellSize({ w: r.width / cols, h: r.height / rows });
    });
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, [cols, rows]);

  return (
    <div className="board-wrap">
      <div
        ref={frameRef}
        className="board-frame"
        style={{
          "--cols": cols,
          "--rows": rows,
          "--turn": turnColor,
          "--cw": `${cellSize.w}px`,
          "--ch": `${cellSize.h}px`,
        }}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const cellColor =
              cell.owner === null ? turnColor : PLAYER_COLORS[cell.owner];
            const legal =
              acceptingInput &&
              isMyTurn &&
              (cell.owner === null || cell.owner === selfIndex);
            const cap = capacityFor(r, c, rows, cols);
            const critical = cell.count > 0 && cell.count >= cap - 1;
            return (
              <CellView
                key={`${r}-${c}`}
                cell={cell}
                row={r}
                col={c}
                cap={cap}
                legal={legal}
                critical={critical}
                cellColor={cellColor}
                atomStyle={atomStyle}
                onPlay={() => onMove(r, c)}
              />
            );
          })
        )}

        <PopLayer effects={effects} popStyle={popStyle} cellSize={cellSize} cols={cols} rows={rows} />
      </div>
    </div>
  );
}

function CellView({ cell, row, col, cap, legal, critical, cellColor, atomStyle, onPlay }) {
  const filled = cell.count > 0;
  const ticks = capacityTicks(cap);
  return (
    <button
      type="button"
      className={[
        "cell",
        legal && "legal",
        filled && "filled",
        critical && "critical",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={!legal}
      onClick={onPlay}
      aria-label={`Row ${row + 1}, column ${col + 1}, ${cell.count} ${cell.count === 1 ? "atom" : "atoms"}`}
      style={{ "--cell-color": cellColor }}
    >
      <span className="cell-inner" />
      {legal && !filled && <span className="cell-hint" />}
      <span className="cap-ticks">
        {ticks.map((t) => (
          <span key={t} className={`cap-tick ${t}`} />
        ))}
      </span>
      {filled && (
        <AtomCluster
          count={cell.count}
          color={cellColor}
          critical={critical}
          style={atomStyle}
        />
      )}
    </button>
  );
}

// Capacity = neighbors count. Corners 2, edges 3, interior 4.
function capacityFor(r, c, rows, cols) {
  let n = 4;
  if (r === 0 || r === rows - 1) n -= 1;
  if (c === 0 || c === cols - 1) n -= 1;
  return n;
}

function capacityTicks(cap) {
  // Show ticks at corners equal to capacity (2 for corner cell, 3 for edge, 4 for interior).
  // We only mark the dot-pairs that actually represent emit directions.
  // Simple: just show 4 corner indicators for interior, 3 for edge, 2 for corner.
  if (cap === 2) return ["tl-h", "tl-v", "br-h", "br-v"];
  if (cap === 3) return ["tl-h", "tl-v", "tr-h", "tr-v", "br-h", "br-v"];
  return ["tl-h", "tl-v", "tr-h", "tr-v", "bl-h", "bl-v", "br-h", "br-v"];
}

// ─── Pop layer ──────────────────────────────────────────────────────────

function PopLayer({ effects, popStyle, cellSize, cols, rows }) {
  if (!effects || effects.length === 0 || cellSize.w === 0) return null;
  return (
    <div className="pop-layer">
      {effects.map((e) =>
        renderEffect(e, popStyle, cellSize, cols, rows)
      )}
    </div>
  );
}

function renderEffect(e, popStyle, cell, cols, rows) {
  const cx = ((e.col + 0.5) / cols) * 100;
  const cy = ((e.row + 0.5) / rows) * 100;
  const size = Math.min(cell.w, cell.h);

  if (e.type === "catch") {
    return (
      <span
        key={e.id}
        className="cell-catch"
        style={{
          left: `${(e.col / cols) * 100}%`,
          top: `${(e.row / rows) * 100}%`,
          width: `${100 / cols}%`,
          height: `${100 / rows}%`,
          "--catch-color": e.color,
        }}
      />
    );
  }

  if (e.type === "explode") {
    return (
      <span key={e.id} style={{ position: "absolute", left: `${cx}%`, top: `${cy}%`, "--pop-color": e.color }}>
        <span className="pop-flash" style={{ "--size": `${size * 1.2}px` }} />
        {popStyle === "shockwave" && (
          <>
            <span className="pop-ring" style={{ "--size": `${size}px` }} />
            <span className="pop-ring" style={{ "--size": `${size * 1.4}px`, animationDelay: ".08s" }} />
          </>
        )}
        {popStyle === "burst" && e.dirs.map((d, i) => {
          const ang = Math.atan2(d.dy, d.dx) * 180 / Math.PI;
          const len = Math.sqrt((d.dx * cell.w) ** 2 + (d.dy * cell.h) ** 2);
          return (
            <React.Fragment key={i}>
              <span
                className="pop-trail"
                style={{
                  "--ang": `${ang}deg`,
                  "--len": `${len * 0.9}px`,
                  "--pop-color": e.color,
                  "--dur": "320ms",
                }}
              />
              <span
                className="pop-projectile"
                style={{
                  "--dx": `${d.dx * cell.w}px`,
                  "--dy": `${d.dy * cell.h}px`,
                  "--ps": `${size * 0.34}px`,
                  "--pop-color": e.color,
                  "--dur": "340ms",
                }}
              />
            </React.Fragment>
          );
        })}
        {popStyle === "implosion" && e.dirs.map((d, i) => {
          const startAng = (i / e.dirs.length) * Math.PI * 2;
          const fx = Math.cos(startAng) * size * 0.5;
          const fy = Math.sin(startAng) * size * 0.5;
          return (
            <span
              key={i}
              className="pop-implode"
              style={{
                "--from-x": `${fx}px`,
                "--from-y": `${fy}px`,
                "--dx": `${d.dx * cell.w}px`,
                "--dy": `${d.dy * cell.h}px`,
                "--ps": `${size * 0.32}px`,
                "--pop-color": e.color,
                "--dur": "440ms",
              }}
            />
          );
        })}
      </span>
    );
  }
  return null;
}

window.Board = Board;
