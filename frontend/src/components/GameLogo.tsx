import { cn } from "@/lib/cn";

interface GameLogoProps {
  className?: string;
}

// Renders one word letter-by-letter on a gentle upward arch (∩): outer
// letters dip down and tilt outward, like the SMASH KARTS wordmark.
function ArchedWord({ word, className, dip, tilt }: { word: string; className: string; dip: number; tilt: number }) {
  const mid = (word.length - 1) / 2;
  return (
    <span className={cn("game-logo-word", className)} aria-hidden="true">
      {Array.from(word).map((ch, i) => {
        const offset = i - mid;
        return (
          <span
            key={`${ch}-${i}`}
            className="logo-letter"
            data-ch={ch}
            style={{
              transform: `translateY(${(dip * offset * offset).toFixed(4)}em) rotate(${(tilt * offset).toFixed(2)}deg)`
            }}
          >
            {ch}
          </span>
        );
      })}
    </span>
  );
}

export function GameLogo({ className }: GameLogoProps) {
  return (
    <div
      className={cn(
        "grid select-none place-items-center text-center leading-none [animation:hero-drop_0.7s_cubic-bezier(0.2,0.8,0.4,1)_both]",
        className
      )}
      aria-label="Chain Reaction"
      role="img"
    >
      <ArchedWord word="CHAIN" className="game-logo-top" dip={0.016} tilt={1.8} />
      <ArchedWord word="REACTION" className="game-logo-bottom" dip={0.009} tilt={1.3} />
    </div>
  );
}
