import { cn } from "@/lib/cn";

interface QueueSlotsProps {
  filled: number;
  total: number;
  tone: "reactor" | "cherenkov";
}

const TONE_FILLED: Record<QueueSlotsProps["tone"], string> = {
  reactor: "bg-reactor",
  cherenkov: "bg-cherenkov shadow-[0_0_8px_rgba(42,216,255,0.55)]"
};

export function QueueSlots({ filled, total, tone }: QueueSlotsProps) {
  return (
    <div className={cn("flex", tone === "reactor" ? "gap-1" : "gap-1.5")}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 flex-1 transition-colors",
            tone === "reactor" ? "duration-300" : "rounded-full duration-500",
            i < filled ? TONE_FILLED[tone] : "bg-line"
          )}
        />
      ))}
    </div>
  );
}
