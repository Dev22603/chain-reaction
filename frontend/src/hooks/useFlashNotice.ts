"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NOTICE_DURATION_MS } from "@/lib/constants";

export function useFlashNotice(duration = NOTICE_DURATION_MS) {
  const [notice, setNotice] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(
    (message: string) => {
      setNotice(message);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setNotice(null), duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { notice, flash };
}
