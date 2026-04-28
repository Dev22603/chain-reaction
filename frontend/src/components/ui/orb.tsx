import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface OrbProps {
  color: string;
  size?: number;
  delay?: number;
  critical?: boolean;
  spawn?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Orb({ color, size = 14, delay = 0, critical = false, spawn = true, className, style }: OrbProps) {
  const animation = critical
    ? "orb-critical 0.7s ease-in-out infinite"
    : `orb-spawn 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) ${spawn ? "both" : "none"}, orb-pulse 2.4s ease-in-out ${0.4 + delay}s infinite`;

  return (
    <span
      className={cn("inline-block rounded-full will-change-transform", className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, color-mix(in srgb, ${color} 70%, white) 0%, ${color} 55%, color-mix(in srgb, ${color} 65%, black) 100%)`,
        boxShadow: `0 0 ${size * 0.6}px ${color}, 0 0 ${size * 1.4}px color-mix(in srgb, ${color} 60%, transparent), inset 0 0 ${size * 0.3}px rgba(255,255,255,0.4)`,
        color,
        animation,
        animationDelay: `${delay}s`,
        ...style
      }}
    />
  );
}
