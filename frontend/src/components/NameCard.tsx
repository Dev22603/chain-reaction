"use client";

import { Check, Pencil, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isValidDisplayName } from "@/lib/guestName";

interface NameCardProps {
  displayName: string;
  canEdit: boolean;
  onSave?: (newName: string) => Promise<void> | void;
  onInteract?: () => void;
}

export function NameCard({ displayName, canEdit, onSave, onInteract }: NameCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing) setDraft(displayName);
  }, [displayName, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEdit() {
    if (!canEdit) return;
    onInteract?.();
    setError(null);
    setDraft(displayName);
    setEditing(true);
  }

  function cancel() {
    onInteract?.();
    setEditing(false);
    setError(null);
    setDraft(displayName);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === displayName) {
      setEditing(false);
      return;
    }
    if (!isValidDisplayName(trimmed)) {
      setError("Letters only, no numbers.");
      return;
    }
    onInteract?.();
    try {
      setSaving(true);
      await onSave?.(trimmed);
      setEditing(false);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save name.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-1">
      <span className="font-display text-[10px] tracking-[0.22em] text-white/85 drop-shadow-[0_1px_0_rgba(24,73,128,0.5)]">
        {canEdit ? "YOUR NAME" : "GUEST"}
      </span>
      {editing ? (
        <div className="flex items-center gap-1.5 rounded-2xl border-2 border-secondary/60 bg-surface px-2 py-1.5">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commit();
              if (e.key === "Escape") cancel();
            }}
            maxLength={30}
            disabled={saving}
            aria-label="Display name"
            className="w-32 bg-transparent font-body text-sm font-semibold text-fg outline-none placeholder:text-fg-muted sm:w-40"
            placeholder="Your name"
          />
          <button
            type="button"
            onClick={() => void commit()}
            disabled={saving}
            aria-label="Save name"
            className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Check size={14} strokeWidth={3} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            aria-label="Cancel"
            className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-surface text-fg-soft transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <X size={14} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={!canEdit}
          aria-label={canEdit ? `Edit name (currently ${displayName})` : `Guest name ${displayName}`}
          className={
            "group flex items-center gap-2 rounded-2xl border-2 px-3 py-1.5 font-body text-sm font-semibold text-fg transition-colors " +
            (canEdit
              ? "border-secondary/50 bg-surface hover:border-secondary hover:bg-surface-2 cursor-pointer"
              : "border-line bg-surface cursor-default")
          }
        >
          <span className="max-w-[160px] truncate">{displayName}</span>
          {canEdit ? (
            <span
              aria-hidden="true"
              className="grid h-6 w-6 place-items-center rounded-md bg-secondary/15 text-secondary transition-colors group-hover:bg-secondary/25"
            >
              <Pencil size={11} strokeWidth={2.5} />
            </span>
          ) : null}
        </button>
      )}
      {error ? (
        <span role="alert" className="font-body text-[11px] text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
