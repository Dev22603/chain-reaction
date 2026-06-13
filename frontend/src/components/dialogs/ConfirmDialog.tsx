"use client";

import { DialogShell } from "@/components/dialogs/DialogShell";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Smash-Karts-style blue confirmation modal: orange display title, white
// message, Cancel/OK pills. Replaces window.confirm.
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <DialogShell open={open} onClose={onCancel} titleId="confirm-dialog-title" variant="blue">
      <div className="grid gap-6 p-6 sm:p-7">
        <h2
          id="confirm-dialog-title"
          className="m-0 text-center font-display text-3xl tracking-wide text-[#ffc72e] [text-shadow:0_3px_0_#c96a00,0_6px_12px_rgba(10,40,75,0.4)]"
        >
          {title}
        </h2>

        <p className="m-0 text-center text-base font-bold text-white">{message}</p>

        <div className="mt-1 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary game-btn-shadow px-4 py-2.5 text-base tracking-wide"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-secondary game-btn-shadow px-4 py-2.5 text-base tracking-wide"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </DialogShell>
  );
}
