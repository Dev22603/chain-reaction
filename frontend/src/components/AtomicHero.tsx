"use client";

import { cn } from "@/lib/cn";

interface AtomicHeroProps {
  className?: string;
}

const ORBS = [
  { color: "#ff3b6b", size: 64, x: 16, y: 30, delay: 0, duration: 3.2 },
  { color: "#2ad8ff", size: 80, x: 50, y: 18, delay: 0.4, duration: 3.8 },
  { color: "#ffd23f", size: 56, x: 78, y: 38, delay: 0.8, duration: 3.4 },
  { color: "#5cff9b", size: 48, x: 34, y: 64, delay: 0.2, duration: 3.6 },
  { color: "#ff6b1f", size: 72, x: 64, y: 70, delay: 0.6, duration: 4 }
];

export function AtomicHero({ className }: AtomicHeroProps) {
  return (
    <div className={cn("relative", className)} aria-hidden="true">
      {ORBS.map((orb, idx) => (
        <span
          key={idx}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle at 30% 30%, #ffffff, ${orb.color} 55%, ${orb.color}cc 100%)`,
            boxShadow: `0 0 32px ${orb.color}80, 0 0 4px ${orb.color}, inset 0 -6px 12px rgba(0,0,0,0.35)`,
            transform: "translate(-50%, -50%)",
            animation: `float-orb ${orb.duration}s ease-in-out ${orb.delay}s infinite`
          }}
        />
      ))}
    </div>
  );
}
