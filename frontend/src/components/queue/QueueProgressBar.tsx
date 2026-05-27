import { cn } from "@/lib/cn";

interface QueueProgressBarProps {
  percent: number;
  tone: "reactor" | "cherenkov";
}

export function QueueProgressBar({ percent, tone }: QueueProgressBarProps) {
  const fillClass =
    tone === "reactor"
      ? "bg-gradient-to-r from-reactor via-reactor-glow to-uranium"
      : "bg-gradient-to-r from-cherenkov/70 to-cherenkov";
  const heightClass = tone === "reactor" ? "h-12" : "h-8";
  const textClass = tone === "reactor" ? "text-sm" : "text-[10px]";

  return (
    <div className={cn("relative overflow-hidden border border-line bg-bg", heightClass)}>
      <div
        className={cn("absolute inset-y-0 left-0 transition-all duration-500", fillClass)}
        style={{ width: `${percent}%` }}
      />
      <div
        className={cn(
          "relative grid h-full place-items-center font-display font-semibold uppercase tracking-[0.3em] text-paper mix-blend-difference",
          textClass
        )}
      >
        {percent}%
      </div>
    </div>
  );
}
