"use client";

import { X } from "lucide-react";
import type { QueuedInfo } from "@/lib/types";

interface QueueScreenProps {
  info: QueuedInfo | null;
  onCancel: () => void;
}

export function QueueScreen({ info, onCancel }: QueueScreenProps) {
  return (
    <section className="panel queue-panel" aria-labelledby="queue-title">
      <p className="eyebrow">Waiting for players</p>
      <h1 id="queue-title">
        {info ? `${info.position} / ${info.maxPlayers}` : "Joining queue"}
      </h1>
      <button className="secondary-button" type="button" onClick={onCancel}>
        <X size={18} aria-hidden="true" />
        Cancel
      </button>
    </section>
  );
}
