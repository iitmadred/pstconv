import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TimerPhase, WorkoutPreset, Exercise } from '../../types';

// Matches TimerHandle from App.tsx
interface TimerHandle {
    phase: TimerPhase;
    timeRemaining: number;
    currentSet: number;
    totalSets: number;
    currentExerciseIndex: number;
    totalExercises: number;
    isRunning: boolean;
    currentExercise: Exercise | null;
    start: () => void;
    pause: () => void;
    resume: () => void;
    toggle: () => void;
    reset: () => void;
    setExercise: (index: number) => void;
}

interface WorkoutScreenProps {
    workout: WorkoutPreset | null; // Can be null if accessed directly
    timer: TimerHandle;
    onClose: () => void;
    onComplete: (stats: { duration: number; exercises: number }) => void;
}

export function WorkoutScreen({ workout, timer, onClose, onComplete }: WorkoutScreenProps) {
    const navigate = useNavigate();

    // Redirect if no workout selected
    useEffect(() => {
        if (!workout) {
            navigate('/planner');
        }
    }, [workout, navigate]);

    // Track start time for duration - use useRef to persist across renders
    const startTimeRef = useRef(Date.now());

    // Reset start time when workout starts
    useEffect(() => {
        if (timer.phase === 'PREP' && timer.isRunning) {
            startTimeRef.current = Date.now();
        }
    }, [timer.phase, timer.isRunning]);

    // Completion check
    useEffect(() => {
        if (timer.phase === 'COMPLETE') {
            const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
            onComplete({
                duration,
                exercises: timer.totalExercises,
            });
            navigate('/dashboard');
        }
    }, [timer.phase, onComplete, navigate, timer.totalExercises]);


    if (!workout) return null;

    // Data prep
    const currentName = timer.currentExercise?.name || "Prepare";
    const nextIndex = timer.currentExerciseIndex + 1;
    const nextExercise = nextIndex < workout.exercises.length ? workout.exercises[nextIndex].name : "Finish";

    // Format time 00:00
    const mins = Math.floor(timer.timeRemaining / 60);
    const secs = timer.timeRemaining % 60;
    const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Color logic (matches design neon green/white)
    const isWork = timer.phase === 'WORK';
    const accentColor = isWork ? '#00FF85' : '#00FFFF'; // Green for work, Blue for rest

    return (
        <div className="bg-[#000000] antialiased h-screen w-full" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="relative flex h-full w-full flex-col text-[#F5F5F5] overflow-hidden">
                {/* Background Glow */}
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <div
                        className="h-[400px] w-[400px] rounded-full blur-[120px] transition-colors duration-500"
                        style={{ backgroundColor: `${accentColor}30` }}
                    ></div>
                </div>

                <div className="relative z-10 flex h-full flex-col p-6">
                    <header className="flex w-full items-center justify-between">
                        <div className="flex size-12 shrink-0 items-center">
                            {/* Optional: Sound toggle or back */}
                        </div>
                        <div className="flex w-12 items-center justify-end">
                            <button onClick={() => { timer.reset(); onClose(); }} className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-[#F5F5F5]">
                                <span className="material-symbols-outlined text-3xl">close</span>
                            </button>
                        </div>
                    </header>

                    <main className="flex flex-1 flex-col items-center justify-center text-center">
                        <div className="flex flex-col items-center justify-center rounded-xl bg-white/5 p-8 backdrop-blur-lg ring-1 ring-inset ring-white/10 w-full max-w-sm">
                            <p
                                className="text-base font-bold uppercase tracking-[0.2em] transition-colors duration-300"
                                style={{ color: accentColor }}
                            >
                                {timer.phase === 'PREP' ? 'GET READY' : timer.phase}
                            </p>

                            <div className="my-4 cursor-pointer" onClick={timer.toggle}>
                                <p className="text-8xl font-bold leading-none tracking-tighter text-[#F5F5F5]" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                                    {timeString}
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <h1 className="text-[32px] font-bold leading-tight tracking-tight text-white mb-1">
                                    {currentName}
                                </h1>
                                <p className="text-base font-normal leading-normal text-white/70">
                                    Set {timer.currentSet} of {timer.totalSets}
                                </p>
                                <p className="mt-2 text-sm font-normal leading-normal text-white/50">
                                    Next: {nextExercise}
                                </p>
                            </div>
                        </div>
                    </main>

                    <footer className="w-full pb-6 pt-4">
                        <button
                            onClick={timer.isRunning ? timer.pause : timer.start}
                            className="h-16 w-full rounded-full text-black text-lg font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                            style={{ backgroundColor: accentColor, boxShadow: `0 10px 30px -10px ${accentColor}60` }}
                        >
                            {timer.isRunning ? 'Pause Workout' : 'Start Workout'}
                        </button>
                    </footer>
                </div>
            </div>
        </div>
    );
}
