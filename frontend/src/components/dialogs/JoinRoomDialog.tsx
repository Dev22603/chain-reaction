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
      <div className="grid gap-6 p-6 sm:p-8">
        <header className="grid gap-2">
          <div className="flex items-start justify-between gap-3">
            <h2 id="join-room-title" className="font-display text-4xl leading-[0.95] tracking-tight text-white game-text-shadow sm:text-5xl">
              JOIN
              <br />
              <span className="text-cherenkov">A ROOM</span>
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border-2 border-line text-fg-muted transition-colors hover:border-cherenkov hover:text-cherenkov"
              aria-label="Close dialog"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <p className="max-w-md font-body text-sm text-fg-soft sm:text-base">
            Enter the 6-character code your host shared with you.
          </p>
        </header>

        <div className="grid gap-4">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
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
                className={
                  "h-16 w-12 rounded-xl border-2 bg-bg text-center font-display text-4xl uppercase text-white transition-all focus:outline-none sm:h-20 sm:w-14 sm:text-5xl " +
                  (char
                    ? "border-cherenkov bg-cherenkov/10 shadow-cherenkov"
                    : "border-line hover:border-line-2 focus:border-cherenkov")
                }
              />
            ))}
          </div>
          <p className="text-center font-body text-xs text-fg-muted">
            Paste a code or type to advance
          </p>
        </div>

        <footer className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-line bg-surface/60 px-5 py-3 font-display text-sm text-fg-soft transition-colors hover:border-fg-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!complete}
            className="game-btn-shadow inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-cherenkov to-[#1ba0c4] px-6 py-3.5 font-display text-lg text-white game-text-shadow disabled:opacity-40 sm:min-w-[220px]"
          >
            Enter room
            <ArrowRight size={18} strokeWidth={3} aria-hidden="true" />
          </button>
        </footer>
      </div>
    </DialogShell>
  );
}
