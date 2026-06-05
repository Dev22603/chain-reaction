const ORBS = [
  { color: "#ff3b6b", x: "20%", y: "45%", size: 52 },
  { color: "#25d3ff", x: "48%", y: "25%", size: 64 },
  { color: "#ffd23f", x: "75%", y: "50%", size: 44 },
  { color: "#5cff9b", x: "35%", y: "72%", size: 36 },
  { color: "#ff6b1f", x: "65%", y: "74%", size: 48 }
];

export function CasualOrbCloud() {
  return (
    <div className="relative mx-auto h-[220px] w-full max-w-[280px] sm:h-[280px]" aria-hidden="true">
      {ORBS.map((orb, i) => (
        <span
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle at 32% 30%, #fff, ${orb.color} 55%, color-mix(in srgb, ${orb.color} 55%, #000))`,
            boxShadow: `0 0 24px ${orb.color}, inset 0 0 8px rgba(255,255,255,.35)`,
            animation: `orb-pulse ${2 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`
          }}
        />
      ))}
    </div>
  );
}
