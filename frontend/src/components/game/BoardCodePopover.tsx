import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

interface BoardCodePopoverProps {
  code: string;
}

export function BoardCodePopover({ code }: BoardCodePopoverProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* noop */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [code]);

  return (
    <div
      ref={rootRef}
      className="absolute left-2 top-2 z-20"
      style={{ position: "absolute" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur-sm transition-colors " +
          (open
            ? "border-cherenkov/50 bg-cherenkov/12 text-cherenkov"
            : "border-white/10 bg-surface/50 text-fg-muted hover:border-cherenkov/40 hover:text-cherenkov")
        }
      >
        <Copy size={11} aria-hidden="true" />
        <span>{open ? "Hide code" : "Show code"}</span>
      </button>

      {open ? (
        <div className="board-code-popover-content">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.3em] text-fg-muted">
            Invite code
          </p>
          <div className="board-code-popover-tiles mb-3">
            {code.split("").map((ch, i) => (
              <span key={i} className="board-code-popover-tile">
                {ch}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={
              "flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors " +
              (copied
                ? "border-radium/40 bg-radium/8 text-radium"
                : "border-cherenkov/35 bg-cherenkov/8 text-cherenkov hover:bg-cherenkov/16")
            }
          >
            {copied ? <Check size={11} strokeWidth={3} /> : <Copy size={11} />}
            <span>{copied ? "Copied" : "Copy code"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
