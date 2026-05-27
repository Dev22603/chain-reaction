interface WinnerBadgeProps {
  color: string;
}

export function WinnerBadge({ color }: WinnerBadgeProps) {
  return (
    <span
      className="mx-auto block h-14 w-14 rounded-full"
      style={{
        background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 55%, color-mix(in srgb, ${color} 65%, black) 100%)`,
        boxShadow: `0 0 30px ${color}, 0 0 60px color-mix(in srgb, ${color} 40%, transparent)`,
        animation: "orb-critical 0.7s ease-in-out infinite"
      }}
    />
  );
}
