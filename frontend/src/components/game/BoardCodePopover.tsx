import { Check, Copy, UserPlus } from "lucide-react";
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
        aria-label={open ? "Hide invite code" : "Show invite code"}
        title="Invite a player"
        className={
          "inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors " +
          (open
            ? "border-secondary bg-surface text-secondary-deep"
            : "border-white/70 bg-surface/90 text-fg-soft hover:border-secondary hover:text-secondary-deep")
        }
      >
        <UserPlus size={14} aria-hidden="true" />
      </button>

      {open ? (
        <div className="board-code-popover-content">
          <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-fg-muted">
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
              "flex w-full items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors " +
              (copied
                ? "border-success/50 bg-success/10 text-success"
                : "border-secondary/50 bg-secondary/10 text-secondary-deep hover:bg-secondary/20")
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
