'use client';

import { useRef, useCallback } from 'react';

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function useAnimatedCounter() {
  const rafRef = useRef<number>(0);

  const animate = useCallback(
    (
      from: number,
      to: number,
      duration: number,
      onUpdate: (value: number) => void,
      onComplete?: () => void,
    ) => {
      cancelAnimationFrame(rafRef.current);
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = from + (to - from) * eased;

        onUpdate(Math.round(current));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          onUpdate(to);
          onComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  const cancel = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
  }, []);

  return { animate, cancel };
}
