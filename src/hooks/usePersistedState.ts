// ============================================================
// usePersistedState - localStorage with Midnight Reset
// ============================================================

import { useState, useEffect, useCallback } from 'react';

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

interface PersistedData<T> {
  date: string;
  value: T;
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  resetAtMidnight: boolean = true,
  onReset?: (staleValue: T, staleDate: string) => void
): [T, (value: T | ((prev: T) => T)) => void, () => void] {

  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const parsed: PersistedData<T> = JSON.parse(stored);

      // Check if data is from today
      if (resetAtMidnight) {
        const today = getTodayDateString();
        if (parsed.date !== today) {
          // Data is stale - reset to default
          // Trigger callback safely after mount using setTimeout to avoid state update during render if needed,
          // but strictly speaking we just want to save data, so direct call is fine as long as it doesn't set state immediately in a way that conflicts.
          // Better: just call it, assuming onReset saves side-effects (like to history).
          if (onReset) {
            try { onReset(parsed.value, parsed.date); } catch (e) { console.error('onReset failed', e); }
          }
          return defaultValue;
        }
      }

      return parsed.value;
    } catch {
      return defaultValue;
    }
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    const data: PersistedData<T> = {
      date: getTodayDateString(),
      value: state,
    };
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, state]);

  // Check for midnight reset periodically
  useEffect(() => {
    if (!resetAtMidnight) return;

    const checkMidnight = () => {
      try {
        const stored = localStorage.getItem(key);
        if (!stored) return;

        const parsed: PersistedData<T> = JSON.parse(stored);
        const today = getTodayDateString();

        if (parsed.date !== today) {
          if (onReset) onReset(parsed.value, parsed.date);
          setState(defaultValue);
        }
      } catch {
        // Ignore parse errors
      }
    };

    // Check every minute
    const interval = setInterval(checkMidnight, 60000);

    // Also check on visibility change (when user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkMidnight();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [key, defaultValue, resetAtMidnight, onReset]);

  const reset = useCallback(() => {
    setState(defaultValue);
  }, [defaultValue]);

  return [state, setState, reset];
}

// Simple persisted state without midnight reset
export function useSimplePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState,] = usePersistedState(key, defaultValue, false);
  return [state, setState];
}
