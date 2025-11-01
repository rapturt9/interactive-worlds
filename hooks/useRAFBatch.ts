'use client';

import { useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to batch updates using requestAnimationFrame
 * Synchronizes updates with browser's 60fps refresh rate for smooth rendering
 *
 * @param callback - Function to call with batched updates
 * @returns Function to queue updates
 */
export function useRAFBatch<T>(callback: (value: T) => void) {
  const rafIdRef = useRef<number | null>(null);
  const pendingValueRef = useRef<T | null>(null);
  const hasPendingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  return useCallback(
    (value: T) => {
      // Store the latest value
      pendingValueRef.current = value;
      hasPendingRef.current = true;

      // If we already have a frame scheduled, don't schedule another
      if (rafIdRef.current !== null) {
        return;
      }

      // Schedule update for next animation frame
      rafIdRef.current = requestAnimationFrame(() => {
        if (hasPendingRef.current && pendingValueRef.current !== null) {
          callback(pendingValueRef.current);
          hasPendingRef.current = false;
          pendingValueRef.current = null;
        }
        rafIdRef.current = null;
      });
    },
    [callback]
  );
}
