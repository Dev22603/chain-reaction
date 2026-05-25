
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return (
    <div className={cn("border border-line bg-bg-soft px-4 py-8 text-center font-mono text-xs uppercase tracking-[0.24em] text-fg-muted", className)}>
      {message}
    </div>
  );
}
