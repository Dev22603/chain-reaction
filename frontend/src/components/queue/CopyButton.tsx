"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";

interface CopyButtonProps {
  value: string;
  className?: string;
  copiedClassName?: string;
  resetMs?: number;
}

export function CopyButton({
  value,
  className,
  copiedClassName,
  resetMs = 1600
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), resetMs);
  }, [value, resetMs]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border-2 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors",
        copied
          ? (copiedClassName ?? "border-radium/50 bg-radium/10 text-radium")
          : className
      )}
    >
      {copied ? <Check size={14} strokeWidth={3} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? "Copied!" : "Copy code"}</span>
    </button>
  );
}
