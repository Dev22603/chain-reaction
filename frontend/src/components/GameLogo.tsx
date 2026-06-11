import { cn } from "@/lib/cn";

interface GameLogoProps {
  className?: string;
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
      <span className="game-logo-line game-logo-top">CHAIN</span>
      <span className="game-logo-line game-logo-bottom">REACTION</span>
    </div>
  );
}
