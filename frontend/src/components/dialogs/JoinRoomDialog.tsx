"use client";

import { ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";

interface JoinRoomDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
  onInteract?: () => void;
}

const CODE_LENGTH = 6;
const VALID_CHARS = /^[A-Z0-9]$/;

export function JoinRoomDialog({ open, onClose, onConfirm, onInteract }: JoinRoomDialogProps) {
  const [chars, setChars] = useState<string[]>(() => Array(CODE_LENGTH).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (open) {
      setChars(Array(CODE_LENGTH).fill(""));
      requestAnimationFrame(() => inputRefs.current[0]?.focus());
    }
  }, [open]);

  const code = useMemo(() => chars.join(""), [chars]);
  const complete = code.length === CODE_LENGTH && chars.every((c) => c !== "");

  function setCharAt(index: number, value: string) {
    setChars((current) => {
      const next = [...current];
      next[index] = value;
      return next;
    });
  }

  function handleInput(index: number, raw: string) {
    if (!raw) {
      setCharAt(index, "");
      return;
    }
    const upper = raw.toUpperCase();
    if (!VALID_CHARS.test(upper)) return;
    setCharAt(index, upper);
    onInteract?.();
    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (!chars[index] && index > 0) {
        event.preventDefault();
        inputRefs.current[index - 1]?.focus();
        setCharAt(index - 1, "");
      } else if (chars[index]) {
        setCharAt(index, "");
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (event.key === "Enter" && complete) {
      event.preventDefault();
      handleConfirm();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!pasted) return;
    event.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < Math.min(CODE_LENGTH, pasted.length); i += 1) {
      next[i] = pasted[i];
    }
    setChars(next);
    onInteract?.();
    const focusIdx = Math.min(CODE_LENGTH - 1, pasted.length);
    inputRefs.current[focusIdx]?.focus();
  }

  function handleConfirm() {
    if (!complete) return;
    onInteract?.();
    onConfirm(code);
  }

  return (
    <DialogShell
      open={open}
      onClose={onClose}
      titleId="join-room-title"
      width="md"
      accent="cherenkov"
    >
      <div className="grid min-w-0 gap-4 p-4 sm:gap-6 sm:p-8">
        <header className="grid min-w-0 gap-1.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <h2 id="join-room-title" className="font-display whitespace-nowrap text-[1.4rem] leading-none tracking-tight text-white game-text-shadow sm:text-[2.5rem]">
              JOIN <span className="text-cherenkov">ROOM</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-line text-fg-muted transition-colors hover:border-cherenkov hover:text-cherenkov sm:h-9 sm:w-9"
              aria-label="Close dialog"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
          <p className="font-body text-[12px] leading-snug text-fg-soft sm:text-sm">
            Enter the 6-character code your host shared.
          </p>
        </header>

        <div className="grid min-w-0 gap-2.5">
          <div
            className="flex min-w-0 w-full items-stretch justify-between gap-1 sm:justify-center sm:gap-3"
            onPaste={handlePaste}
          >
            {chars.map((char, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                value={char}
                onChange={(event) => handleInput(idx, event.target.value.slice(-1))}
                onKeyDown={(event) => handleKeyDown(idx, event)}
                onPaste={handlePaste}
                maxLength={1}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                aria-label={`Code position ${idx + 1}`}
                size={1}
                className={
                  "h-12 w-full min-w-0 flex-1 rounded-lg border-2 bg-bg p-0 text-center font-display text-2xl uppercase leading-none text-white transition-all focus:outline-none sm:h-20 sm:w-14 sm:flex-none sm:rounded-xl sm:text-5xl " +
                  (char
                    ? "border-cherenkov bg-cherenkov/10 shadow-cherenkov"
                    : "border-line hover:border-line-2 focus:border-cherenkov")
                }
              />
            ))}
          </div>
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.18em] text-fg-muted sm:text-[10px]">
            Paste a code or type to advance
          </p>
        </div>

        <footer className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-line bg-surface/60 px-3.5 py-2 font-display text-xs text-fg-soft transition-colors hover:border-fg-muted hover:text-fg sm:px-5 sm:py-3 sm:text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!complete}
            className="game-btn-shadow inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-b from-cherenkov to-[#1ba0c4] px-3 py-2.5 font-display text-sm text-white game-text-shadow disabled:opacity-40 sm:rounded-2xl sm:px-6 sm:py-3.5 sm:text-lg sm:min-w-[200px]"
          >
            Enter room
            <ArrowRight size={14} strokeWidth={3} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </DialogShell>
  );
}
