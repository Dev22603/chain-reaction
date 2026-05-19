"use client";

import { cn } from "@/lib/cn";

interface AtomicHeroProps {
  className?: string;
}

export function AtomicHero({ className }: AtomicHeroProps) {
  return (
    <div className={cn("relative grid place-items-center", className)} aria-hidden="true">
      <svg
        viewBox="-260 -260 520 520"
        className="absolute inset-0 h-full w-full"
        role="presentation"
      >
        <defs>
          <radialGradient id="atom-nucleus" cx="0" cy="0" r="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffd9c2" />
            <stop offset="35%" stopColor="#ff8a4c" />
            <stop offset="75%" stopColor="#ff5b2e" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ff5b2e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="electron-glow-a" cx="0" cy="0" r="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#25d3ff" />
            <stop offset="100%" stopColor="#25d3ff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="electron-glow-b" cx="0" cy="0" r="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#b6ff3c" />
            <stop offset="100%" stopColor="#b6ff3c" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="electron-glow-c" cx="0" cy="0" r="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#ffd23f" />
            <stop offset="100%" stopColor="#ffd23f" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g style={{ transformOrigin: "0 0", animation: "orbit-tilt-a 28s linear infinite" }}>
          <g transform="rotate(0)">
            <ellipse
              cx="0"
              cy="0"
              rx="220"
              ry="80"
              fill="none"
              stroke="#25d3ff"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            <circle cx="220" cy="0" r="8" fill="url(#electron-glow-a)" />
            <circle cx="220" cy="0" r="3" fill="#ffffff" />
          </g>
        </g>

        <g style={{ transformOrigin: "0 0", animation: "orbit-tilt-b 36s linear infinite" }}>
          <g transform="rotate(60)">
            <ellipse
              cx="0"
              cy="0"
              rx="220"
              ry="80"
              fill="none"
              stroke="#b6ff3c"
              strokeOpacity="0.5"
              strokeWidth="1"
            />
            <circle cx="-220" cy="0" r="7" fill="url(#electron-glow-b)" />
            <circle cx="-220" cy="0" r="2.5" fill="#ffffff" />
          </g>
        </g>

        <g style={{ transformOrigin: "0 0", animation: "orbit-tilt-a 22s linear infinite" }}>
          <g transform="rotate(-60)">
            <ellipse
              cx="0"
              cy="0"
              rx="220"
              ry="80"
              fill="none"
              stroke="#ffd23f"
              strokeOpacity="0.45"
              strokeWidth="1"
            />
            <circle cx="220" cy="0" r="6" fill="url(#electron-glow-c)" />
            <circle cx="220" cy="0" r="2" fill="#ffffff" />
          </g>
        </g>

        <g style={{ transformOrigin: "0 0", animation: "nucleus-pulse 3.4s ease-in-out infinite" }}>
          <circle cx="0" cy="0" r="60" fill="url(#atom-nucleus)" />
          <circle cx="0" cy="0" r="22" fill="#ff5b2e" />
          <circle cx="0" cy="0" r="12" fill="#ffd9c2" />
          <circle cx="-4" cy="-5" r="3" fill="#ffffff" fillOpacity="0.8" />
        </g>

        <g
          stroke="#232636"
          strokeWidth="0.8"
          fill="none"
          opacity="0.5"
        >
          <circle cx="0" cy="0" r="245" strokeDasharray="2 6" />
          <circle cx="0" cy="0" r="180" strokeDasharray="1 8" />
        </g>

        <g fill="#6a708a" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2">
          <text x="-248" y="-238">NE</text>
          <text x="222" y="-238">NW</text>
          <text x="-248" y="246">SE</text>
          <text x="222" y="246">SW</text>
          <text x="-22" y="-220">A.01</text>
          <text x="-22" y="232">Z.99</text>
        </g>

        <g
          stroke="#ff5b2e"
          strokeOpacity="0.35"
          strokeWidth="0.8"
          fill="none"
        >
          <line x1="-244" y1="0" x2="-200" y2="0" />
          <line x1="244" y1="0" x2="200" y2="0" />
          <line x1="0" y1="-244" x2="0" y2="-200" />
          <line x1="0" y1="244" x2="0" y2="200" />
        </g>
      </svg>
    </div>
  );
}
