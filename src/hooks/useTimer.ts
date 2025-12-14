// ============================================================
// useTimer - State Machine Timer for Workout Engine
// IDLE → PREP → WORK → REST → (repeat) → COMPLETE
// ============================================================

import { useReducer, useCallback, useEffect, useRef } from 'react';
import type { TimerState, TimerPhase, Exercise } from '../types';
import { PREP_TIME } from '../constants';

// --- Actions ---
type TimerAction =
  | { type: 'INIT'; exercises: Exercise[] }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'TICK' }
  | { type: 'NEXT_PHASE' }
  | { type: 'NEXT_SET' }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'SET_EXERCISE'; exercise: Exercise; index: number; totalExercises: number }
  | { type: 'RESET' }
  | { type: 'COMPLETE' };

// --- Initial State ---
const initialState: TimerState = {
  phase: 'IDLE',
  timeRemaining: 0,
  currentSet: 0,
  totalSets: 0,
  currentExerciseIndex: 0,
  totalExercises: 0,
  workTime: 0,
  restTime: 0,
  isRunning: false,
};

// --- Reducer ---
function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'INIT': {
      const exercises = action.exercises;
      if (exercises.length === 0) return initialState;

      const firstExercise = exercises[0];
      return {
        ...initialState,
        phase: 'IDLE',
        totalExercises: exercises.length,
        currentExerciseIndex: 0,
        currentSet: 1,
        totalSets: firstExercise.sets,
        workTime: firstExercise.work,
        restTime: firstExercise.rest,
        timeRemaining: PREP_TIME,
      };
    }

    case 'START':
      return {
        ...state,
        phase: 'PREP',
        timeRemaining: PREP_TIME,
        isRunning: true,
      };

    case 'PAUSE':
      return {
        ...state,
        isRunning: false,
      };

    case 'RESUME':
      return {
        ...state,
        isRunning: true,
      };

    case 'TICK':
      if (!state.isRunning) return state;
      return {
        ...state,
        timeRemaining: Math.max(0, state.timeRemaining - 1),
      };

    case 'NEXT_PHASE': {
      const { phase, currentSet, totalSets, workTime, restTime } = state;

      switch (phase) {
        case 'PREP':
          return {
            ...state,
            phase: 'WORK',
            timeRemaining: workTime,
          };

        case 'WORK':
          // Check if more sets remaining
          if (currentSet < totalSets) {
            return {
              ...state,
              phase: 'REST',
              timeRemaining: restTime,
            };
          }
          // Last set - go to complete or next exercise
          return {
            ...state,
            phase: 'REST',
            timeRemaining: restTime,
          };

        case 'REST':
          return state; // Handled by NEXT_SET or NEXT_EXERCISE

        default:
          return state;
      }
    }

    case 'NEXT_SET':
      return {
        ...state,
        phase: 'WORK',
        currentSet: state.currentSet + 1,
        timeRemaining: state.workTime,
      };

    case 'NEXT_EXERCISE':
      // This will be properly set by the hook when it dispatches with exercise data
      return state;

    case 'SET_EXERCISE': {
      // Set up for the next exercise with fresh state
      return {
        phase: 'PREP',
        timeRemaining: PREP_TIME,
        currentExerciseIndex: action.index,
        totalExercises: action.totalExercises,
        currentSet: 1,
        totalSets: action.exercise.sets,
        workTime: action.exercise.work,
        restTime: action.exercise.rest,
        isRunning: true,
      };
    }

    case 'RESET':
      return initialState;

    case 'COMPLETE':
      return {
        ...state,
        phase: 'COMPLETE',
        isRunning: false,
      };

    default:
      return state;
  }
}

// --- Hook Options ---
interface UseTimerOptions {
  onPhaseChange?: (phase: TimerPhase, prevPhase: TimerPhase) => void;
  onExerciseComplete?: (exerciseIndex: number) => void;
  onWorkoutComplete?: () => void;
  onTick?: (timeRemaining: number, phase: TimerPhase) => void;
}

// --- Hook ---
export function useTimer(exercises: Exercise[], options: UseTimerOptions = {}) {
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const intervalRef = useRef<number | null>(null);
  const exercisesRef = useRef(exercises);
  const prevPhaseRef = useRef<TimerPhase>('IDLE');

  // Update exercises ref
  useEffect(() => {
    exercisesRef.current = exercises;
    dispatch({ type: 'INIT', exercises });
  }, [exercises]);

  // Main timer interval
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning]);

  // Handle phase transitions
  useEffect(() => {
    if (state.timeRemaining === 0 && state.isRunning) {
      const { phase, currentSet, totalSets, currentExerciseIndex, totalExercises } = state;

      switch (phase) {
        case 'PREP':
          dispatch({ type: 'NEXT_PHASE' });
          break;

        case 'WORK':
          if (currentSet < totalSets) {
            dispatch({ type: 'NEXT_PHASE' }); // Go to REST
          } else if (currentExerciseIndex < totalExercises - 1) {
            // Last set of current exercise - move to next exercise after rest
            dispatch({ type: 'NEXT_PHASE' }); // Go to REST first
          } else {
            // Last set of last exercise - workout complete
            dispatch({ type: 'COMPLETE' });
            options.onWorkoutComplete?.();
          }
          break;

        case 'REST':
          if (currentSet < totalSets) {
            dispatch({ type: 'NEXT_SET' });
          } else if (currentExerciseIndex < totalExercises - 1) {
            // Move to next exercise after rest
            const nextIndex = currentExerciseIndex + 1;
            const nextExercise = exercisesRef.current[nextIndex];
            options.onExerciseComplete?.(currentExerciseIndex);
            dispatch({
              type: 'SET_EXERCISE',
              exercise: nextExercise,
              index: nextIndex,
              totalExercises: exercisesRef.current.length,
            });
          } else {
            dispatch({ type: 'COMPLETE' });
            options.onWorkoutComplete?.();
          }
          break;
      }
    }
  }, [state.timeRemaining, state.isRunning, state, options]);

  // Notify phase changes
  useEffect(() => {
    if (state.phase !== prevPhaseRef.current) {
      options.onPhaseChange?.(state.phase, prevPhaseRef.current);
      prevPhaseRef.current = state.phase;
    }
  }, [state.phase, options]);

  // Notify ticks
  useEffect(() => {
    if (state.isRunning) {
      options.onTick?.(state.timeRemaining, state.phase);
    }
  }, [state.timeRemaining, state.phase, state.isRunning, options]);

  // --- Actions ---
  const start = useCallback(() => {
    dispatch({ type: 'START' });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    dispatch({ type: 'INIT', exercises: exercisesRef.current });
  }, []);

  const toggle = useCallback(() => {
    if (state.phase === 'IDLE') {
      start();
    } else if (state.isRunning) {
      pause();
    } else {
      resume();
    }
  }, [state.phase, state.isRunning, start, pause, resume]);

  // Set current exercise (for navigation)
  const setExercise = useCallback((index: number) => {
    if (index >= 0 && index < exercisesRef.current.length) {
      dispatch({ type: 'RESET' });
      dispatch({
        type: 'INIT',
        exercises: exercisesRef.current.slice(index),
      });
    }
  }, []);

  return {
    // State
    phase: state.phase,
    timeRemaining: state.timeRemaining,
    currentSet: state.currentSet,
    totalSets: state.totalSets,
    currentExerciseIndex: state.currentExerciseIndex,
    totalExercises: state.totalExercises,
    isRunning: state.isRunning,

    // Current exercise
    currentExercise: exercisesRef.current[state.currentExerciseIndex] || null,

    // Actions
    start,
    pause,
    resume,
    toggle,
    reset,
    setExercise,
  };
}
