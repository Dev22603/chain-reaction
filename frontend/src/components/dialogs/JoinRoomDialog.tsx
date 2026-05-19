"use client";

import { ArrowRight, KeyRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DialogShell } from "@/components/dialogs/DialogShell";
import { Button } from "@/components/ui/button";

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
      <div className="grid gap-7 p-6 sm:p-8">
        <header className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-cherenkov">
              <KeyRound size={11} aria-hidden="true" />
              // friend lobby
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center border border-line text-fg-muted hover:border-cherenkov hover:text-cherenkov"
              aria-label="Close dialog"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
          <h2 id="join-room-title" className="font-display text-5xl font-black uppercase leading-[0.85] tracking-tight text-fg sm:text-6xl">
            Drop
            <br />
            <span className="text-cherenkov">the code</span>
          </h2>
          <p className="max-w-md font-editorial text-base italic text-fg-soft">
            6 characters. Letters or digits. Your host knows the rest.
          </p>
        </header>

        <div className="grid gap-5">
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
                  "h-16 w-12 border bg-bg text-center font-display text-4xl font-black uppercase text-fg transition-all focus:outline-none sm:h-20 sm:w-14 sm:text-5xl " +
                  (char
                    ? "border-cherenkov bg-cherenkov/10 shadow-cherenkov"
                    : "border-line hover:border-line-2 focus:border-cherenkov focus:shadow-cherenkov")
                }
              />
            ))}
          </div>
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.32em] text-fg-muted">
            paste supported · type to advance
          </p>
        </div>

        <footer className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirm}
            disabled={!complete}
            className="sm:min-w-[220px]"
          >
            Enter lobby
            <ArrowRight size={16} strokeWidth={2.5} aria-hidden="true" />
          </Button>
        </footer>
      </div>
    </DialogShell>
  );
}
