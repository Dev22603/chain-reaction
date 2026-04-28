"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSoundEngine, type SoundName } from "@/lib/sounds";

export function useSounds() {
  const engineRef = useRef<ReturnType<typeof createSoundEngine> | null>(null);
  const [muted, setMutedState] = useState(false);

  if (engineRef.current === null && typeof window !== "undefined") {
    engineRef.current = createSoundEngine();
  }

  useEffect(() => {
    if (engineRef.current) {
      setMutedState(engineRef.current.isMuted());
    }
  }, []);

  const play = useCallback((name: SoundName, options?: { intensity?: number }) => {
    engineRef.current?.play(name, options);
  }, []);

  const toggleMute = useCallback(() => {
    if (!engineRef.current) return;
    const next = !engineRef.current.isMuted();
    engineRef.current.setMuted(next);
    setMutedState(next);
  }, []);

  const resume = useCallback(() => {
    engineRef.current?.resume().catch(() => {});
  }, []);

  return { play, muted, toggleMute, resume };
}
