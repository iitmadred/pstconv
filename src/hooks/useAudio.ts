// ============================================================
// useAudio - Audio Feedback Hook with User Interaction Init
// ============================================================

import { useCallback, useRef, useState } from 'react';
import { AUDIO_FREQUENCIES } from '../constants';

type SoundType = keyof typeof AUDIO_FREQUENCIES;

export function useAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  // Initialize AudioContext on user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setIsInitialized(true);
    }
    
    // Resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  // Play a tone with specific frequency and duration
  const playTone = useCallback((frequency: number, duration: number = 0.15, type: OscillatorType = 'sine') => {
    if (!isEnabled) return;
    
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, [isEnabled]);

  // Play a predefined sound
  const playSound = useCallback((soundType: SoundType) => {
    const frequency = AUDIO_FREQUENCIES[soundType];
    
    switch (soundType) {
      case 'WORKOUT_DONE':
        // Victory sound - ascending tones
        playTone(frequency, 0.2);
        setTimeout(() => playTone(frequency * 1.25, 0.2), 150);
        setTimeout(() => playTone(frequency * 1.5, 0.3), 300);
        break;
      case 'COUNTDOWN':
        playTone(frequency, 0.1, 'square');
        break;
      default:
        playTone(frequency, 0.15);
    }
  }, [playTone]);

  // Play countdown beeps (3, 2, 1)
  const playCountdown = useCallback((secondsLeft: number) => {
    if (secondsLeft <= 3 && secondsLeft > 0) {
      playSound('COUNTDOWN');
    }
  }, [playSound]);

  const toggleSound = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  return {
    initAudio,
    playSound,
    playTone,
    playCountdown,
    isInitialized,
    isEnabled,
    toggleSound,
  };
}
