// ============================================================
// WorkoutEngine - Active Workout Session Component
// State machine timer with PREP → WORK → REST → COMPLETE
// ============================================================

import { useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, X } from 'lucide-react';
import type { WorkoutPreset, TimerPhase, Exercise } from '../../types';
import { CircularTimer } from '../shared';

// --- Timer Props (matches useTimer return type) ---
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

// --- Component Props ---
interface WorkoutEngineProps {
  workout: WorkoutPreset;
  timer: TimerHandle;
  onClose: () => void;
  onComplete: (stats: { duration: number; exercises: number }) => void;
  soundEnabled: boolean;
}

// --- Phase Display Names ---
const PHASE_LABELS: Record<TimerPhase, string> = {
  IDLE: 'Ready',
  PREP: 'Get Ready',
  WORK: 'Work',
  REST: 'Rest',
  COMPLETE: 'Complete!',
};

// --- Helper: Format time ---
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// --- WorkoutEngine Component ---
export function WorkoutEngine({
  workout,
  timer,
  onClose,
  onComplete,
  soundEnabled,
}: WorkoutEngineProps) {
  // Track start time for duration calculation
  const startTimeRef = { current: Date.now() };

  // Handle workout completion
  useEffect(() => {
    if (timer.phase === 'COMPLETE') {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onComplete({
        duration,
        exercises: timer.totalExercises,
      });
    }
  }, [timer.phase, timer.totalExercises, onComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          timer.toggle();
          break;
        case 'Escape':
          onClose();
          break;
        case 'ArrowRight':
          if (timer.currentExerciseIndex < timer.totalExercises - 1) {
            timer.setExercise(timer.currentExerciseIndex + 1);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer, onClose]);

  // Handle skip to next exercise
  const handleSkip = useCallback(() => {
    if (timer.currentExerciseIndex < timer.totalExercises - 1) {
      timer.setExercise(timer.currentExerciseIndex + 1);
      timer.start();
    }
  }, [timer]);

  // Get current exercise info
  const currentExercise = timer.currentExercise;
  const exerciseName = currentExercise?.name || 'Exercise';
  const exerciseDetail = currentExercise?.detail || '';
  const workTime = currentExercise?.work || 45;
  const restTime = currentExercise?.rest || 15;

  // Calculate total time for progress
  const getTotalTimeForPhase = (): number => {
    switch (timer.phase) {
      case 'PREP':
        return 3;
      case 'WORK':
        return workTime;
      case 'REST':
        return restTime;
      default:
        return 1;
    }
  };

  // Use Stemmy colors for phases
  const getPhaseColor = (phase: TimerPhase) => {
    switch (phase) {
      case 'WORK': return 'bg-neon-purple text-black shadow-[0_0_20px_rgba(176,251,93,0.4)]';
      case 'REST': return 'bg-neon-blue text-black shadow-[0_0_20px_rgba(0,243,255,0.4)]';
      case 'PREP': return 'bg-neon-pink text-white shadow-[0_0_20px_rgba(255,0,255,0.4)]';
      case 'COMPLETE': return 'bg-neon-purple text-black';
      default: return 'bg-white/10 text-gray-300';
    }
  };

  const phaseColor = getPhaseColor(timer.phase);

  return (
    <div className="fixed inset-0 z-50 bg-[#0f0c29] flex flex-col">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] opacity-90" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 glass-panel border-b-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/10"
          aria-label="Close workout"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-white drop-shadow-md">{workout.name}</h1>
          <p className="text-xs text-gray-400">
            {timer.currentExerciseIndex + 1} / {timer.totalExercises} exercises
          </p>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          <span className="text-xs text-gray-500">
            {soundEnabled ? '🔊' : '🔇'}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* Phase Indicator */}
        <div
          className={`px-8 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${phaseColor}`}
        >
          {PHASE_LABELS[timer.phase]}
        </div>

        {/* Timer Display */}
        <div className="relative">
          <div className="absolute inset-0 bg-neon-blue/20 blur-3xl rounded-full" />
          <CircularTimer
            timeRemaining={timer.timeRemaining}
            totalTime={getTotalTimeForPhase()}
            phase={timer.phase}
            size="lg"
          />
        </div>

        {/* Time Display */}
        <div className="text-7xl font-mono font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tabular-nums">
          {formatTime(timer.timeRemaining)}
        </div>

        {/* Exercise Info */}
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {exerciseName}
          </h2>
          <p className="text-gray-300 text-lg">{exerciseDetail}</p>
          <p className="text-sm text-gray-500 mt-3 font-medium">
            Set {timer.currentSet} of {timer.totalSets}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8 mt-4">
          {/* Play/Pause Button */}
          <button
            onClick={timer.toggle}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-2xl ${timer.isRunning
              ? 'bg-neon-pink hover:bg-neon-pink/90 text-white shadow-[0_0_30px_rgba(255,0,255,0.4)]'
              : 'bg-neon-purple hover:bg-neon-purple/90 text-black shadow-[0_0_30px_rgba(176,251,93,0.4)]'
              }`}
            aria-label={timer.isRunning ? 'Pause' : timer.phase === 'IDLE' ? 'Start' : 'Resume'}
          >
            {timer.isRunning ? (
              <Pause className="w-10 h-10" />
            ) : (
              <Play className="w-10 h-10 ml-1" />
            )}
          </button>

          {/* Skip Button */}
          {timer.currentExerciseIndex < timer.totalExercises - 1 && (
            <button
              onClick={handleSkip}
              className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10 backdrop-blur-md"
              aria-label="Skip to next exercise"
            >
              <SkipForward className="w-7 h-7 text-white" />
            </button>
          )}
        </div>
      </main>

      {/* Exercise List (Preview) */}
      <footer className="relative z-10 p-4 glass-panel border-t-0">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {workout.exercises.map((exercise, index) => (
            <button
              key={index}
              onClick={() => {
                timer.setExercise(index);
                timer.start();
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm transition-all border ${index === timer.currentExerciseIndex
                ? 'bg-neon-purple text-black font-bold border-neon-purple shadow-[0_0_10px_rgba(176,251,93,0.3)]'
                : index < timer.currentExerciseIndex
                  ? 'bg-white/5 text-gray-500 border-transparent'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border-white/5'
                }`}
            >
              {index + 1}. {exercise.name}
            </button>
          ))}
        </div>
      </footer>

      {/* Completion Overlay */}
      {timer.phase === 'COMPLETE' && (
        <div className="absolute inset-0 z-50 bg-[#0f0c29]/95 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            Workout Complete!
          </h2>
          <p className="text-gray-300 mb-10 text-xl">
            You crushed {timer.totalExercises} exercises!
          </p>
          <button
            onClick={onClose}
            className="px-10 py-4 bg-neon-purple hover:bg-neon-purple/90 rounded-2xl text-black font-bold text-lg transition-all shadow-[0_0_20px_rgba(176,251,93,0.4)] hover:scale-105"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
