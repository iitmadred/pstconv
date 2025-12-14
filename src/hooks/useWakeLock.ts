// ============================================================
// useWakeLock - Keep Screen On During Workouts
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';

interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
  removeEventListener(type: 'release', listener: () => void): void;
}

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Check support on mount
  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isSupported) {
      console.warn('Wake Lock API not supported');
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const wakeLock = (navigator as any).wakeLock;
      wakeLockRef.current = await wakeLock.request('screen');
      setIsActive(true);

      // Listen for release
      if (wakeLockRef.current) {
        wakeLockRef.current.addEventListener('release', () => {
          setIsActive(false);
          wakeLockRef.current = null;
        });
      }

      return true;
    } catch (error) {
      console.warn('Wake Lock request failed:', error);
      setIsActive(false);
      return false;
    }
  }, [isSupported]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      } catch (error) {
        console.warn('Wake Lock release failed:', error);
      }
    }
  }, []);

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, requestWakeLock]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  return {
    isActive,
    isSupported,
    requestWakeLock,
    releaseWakeLock,
  };
}
