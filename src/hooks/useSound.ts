import { useCallback, useRef, useState } from 'react';

// Sound effect types
type SoundType = 'tap' | 'drop' | 'complete' | 'prayer' | 'jamat' | 'error' | 'pop';

// Custom hook for sound effects using Web Audio API synthesis
export function useSound() {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
        try {
            const stored = localStorage.getItem('stemmy-sounds-enabled');
            if (stored) return JSON.parse(stored);

            // Migration attempt from old key
            const oldStored = localStorage.getItem('titan-sounds-enabled');
            if (oldStored) {
                const val = JSON.parse(oldStored);
                localStorage.setItem('stemmy-sounds-enabled', oldStored);
                return val;
            }

            return true; // Default to true
        } catch {
            return true;
        }
    });

    // Get or create AudioContext (must be called from user gesture on mobile)
    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    audioContextRef.current = new AudioContextClass();
                }
            } catch {
                console.warn('Web Audio API not supported');
                return null;
            }
        }

        // Resume if suspended (required for mobile)
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        return audioContextRef.current;
    }, []);

    // Synthesize sounds using Web Audio API
    const playSound = useCallback((type: SoundType, volume: number = 0.3) => {
        if (!soundEnabled) return;

        const ctx = getAudioContext();
        if (!ctx) return;

        const now = ctx.currentTime;

        try {
            switch (type) {
                case 'tap': {
                    // Soft click sound
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
                    gain.gain.setValueAtTime(volume * 0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.06);
                    break;
                }

                case 'drop': {
                    // Water drop sound - descending tone
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(1200, now);
                    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);
                    gain.gain.setValueAtTime(volume * 0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.22);

                    // Second harmonic for richness
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(600, now + 0.02);
                    osc2.frequency.exponentialRampToValueAtTime(100, now + 0.18);
                    gain2.gain.setValueAtTime(volume * 0.3, now + 0.02);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.start(now + 0.02);
                    osc2.stop(now + 0.27);
                    break;
                }

                case 'pop': {
                    // Bubble pop sound
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(400, now);
                    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                    gain.gain.setValueAtTime(volume * 0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.12);
                    break;
                }

                case 'complete': {
                    // Satisfying completion sound - rising arpeggio
                    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
                    notes.forEach((freq, i) => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, now + i * 0.08);
                        gain.gain.setValueAtTime(0, now + i * 0.08);
                        gain.gain.linearRampToValueAtTime(volume * 0.4, now + i * 0.08 + 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.start(now + i * 0.08);
                        osc.stop(now + i * 0.08 + 0.22);
                    });
                    break;
                }

                case 'prayer': {
                    // Gentle bell/chime for prayer
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(698.46, now); // F5
                    gain.gain.setValueAtTime(volume * 0.4, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.52);

                    // Harmonic
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(1046.50, now); // C6
                    gain2.gain.setValueAtTime(volume * 0.25, now);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.start(now);
                    osc2.stop(now + 0.42);
                    break;
                }

                case 'jamat': {
                    // Special celebratory double-chime for jamat (congregation prayer)
                    // First chime
                    const osc1 = ctx.createOscillator();
                    const gain1 = ctx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(880, now); // A5
                    gain1.gain.setValueAtTime(volume * 0.45, now);
                    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                    osc1.connect(gain1);
                    gain1.connect(ctx.destination);
                    osc1.start(now);
                    osc1.stop(now + 0.37);

                    // Second chime (higher, delayed)
                    const osc2 = ctx.createOscillator();
                    const gain2 = ctx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(1174.66, now + 0.12); // D6
                    gain2.gain.setValueAtTime(0, now);
                    gain2.gain.linearRampToValueAtTime(volume * 0.5, now + 0.12);
                    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.start(now + 0.12);
                    osc2.stop(now + 0.52);

                    // Third harmonic for richness
                    const osc3 = ctx.createOscillator();
                    const gain3 = ctx.createGain();
                    osc3.type = 'sine';
                    osc3.frequency.setValueAtTime(1318.51, now + 0.15); // E6
                    gain3.gain.setValueAtTime(0, now);
                    gain3.gain.linearRampToValueAtTime(volume * 0.35, now + 0.15);
                    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
                    osc3.connect(gain3);
                    gain3.connect(ctx.destination);
                    osc3.start(now + 0.15);
                    osc3.stop(now + 0.62);
                    break;
                }

                case 'error': {
                    // Subtle error buzz
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(150, now);
                    gain.gain.setValueAtTime(volume * 0.2, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now);
                    osc.stop(now + 0.17);
                    break;
                }
            }
        } catch (e) {
            console.warn('Sound playback failed:', e);
        }
    }, [soundEnabled, getAudioContext]);

    // Toggle sounds - this creates AudioContext on first enable (user gesture required)
    const toggleSounds = useCallback((enabled: boolean) => {
        setSoundEnabledState(enabled);
        localStorage.setItem('stemmy-sounds-enabled', JSON.stringify(enabled));

        // Initialize audio context on first enable (must be from user gesture)
        if (enabled) {
            getAudioContext();
        }
    }, [getAudioContext]);

    // Check if sounds are enabled
    const isSoundEnabled = useCallback(() => {
        return soundEnabled;
    }, [soundEnabled]);

    return {
        playSound,
        toggleSounds,
        isSoundEnabled,
        // Convenience methods - call getAudioContext first for mobile
        tap: useCallback(() => { getAudioContext(); playSound('tap', 0.2); }, [playSound, getAudioContext]),
        drop: useCallback(() => { getAudioContext(); playSound('drop', 0.35); }, [playSound, getAudioContext]),
        pop: useCallback(() => { getAudioContext(); playSound('pop', 0.3); }, [playSound, getAudioContext]),
        complete: useCallback(() => { getAudioContext(); playSound('complete', 0.35); }, [playSound, getAudioContext]),
        prayer: useCallback(() => { getAudioContext(); playSound('prayer', 0.4); }, [playSound, getAudioContext]),
        jamat: useCallback(() => { getAudioContext(); playSound('jamat', 0.45); }, [playSound, getAudioContext]),
        error: useCallback(() => { getAudioContext(); playSound('error', 0.2); }, [playSound, getAudioContext]),
    };
}

// Haptic feedback (for supported devices)
export function useHaptic() {
    const vibrate = useCallback((pattern: number | number[] = 10) => {
        if ('vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch {
                // Silently fail
            }
        }
    }, []);

    return {
        tap: useCallback(() => vibrate(10), [vibrate]),
        success: useCallback(() => vibrate([10, 50, 10]), [vibrate]),
        error: useCallback(() => vibrate([50, 30, 50]), [vibrate]),
    };
}
