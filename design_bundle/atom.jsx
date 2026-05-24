// atom.jsx — render the cluster of atoms inside a cell.
// 1, 2, 3, 4 atoms have fixed honeycomb-ish positions for legibility.
// Three style variants: "nucleus", "plasma", "crystal".

function AtomCluster({ count, color, critical, style = "nucleus" }) {
  const positions = ATOM_POSITIONS[Math.min(count, 4)] || [];
  const cls = `atom style-${style} ${critical ? "critical" : "idle"}`;
  return (
    <span className="atoms" aria-hidden="true">
      <span className="atom-cluster">
        {positions.map((p, i) => (
          <span
            key={i}
            className={cls}
            style={{
              "--cell-color": color,
              "--tx": p.x,
              "--ty": p.y,
              "--as": p.size,
              animationDelay: `${i * 0.04}s`,
            }}
          />
        ))}
        {count > 4 && (
          <span
            style={{
              position: "absolute",
              bottom: "4%",
              right: "8%",
              fontFamily: "var(--font-display)",
              fontSize: "clamp(8px, 1.4vw, 12px)",
              color,
              textShadow: `0 0 8px ${color}`,
              letterSpacing: "0.04em",
            }}
          >
            {count}
          </span>
        )}
      </span>
    </span>
  );
}

// Positions are CSS values offsetting each atom from cell center.
// Sized as percentages of the cluster (which is 80% of the cell).
const ATOM_POSITIONS = {
  1: [
    { x: "0%", y: "0%", size: "48%" },
  ],
  2: [
    { x: "-22%", y: "0%", size: "38%" },
    { x: "22%", y: "0%", size: "38%" },
  ],
  3: [
    { x: "0%", y: "-22%", size: "34%" },
    { x: "-22%", y: "16%", size: "34%" },
    { x: "22%", y: "16%", size: "34%" },
  ],
  4: [
    { x: "-22%", y: "-22%", size: "32%" },
    { x: "22%", y: "-22%", size: "32%" },
    { x: "-22%", y: "22%", size: "32%" },
    { x: "22%", y: "22%", size: "32%" },
  ],
};

window.AtomCluster = AtomCluster;
