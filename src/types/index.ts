// ============================================================
// STEMMY DAILY LIFESTYLEOS - TYPE DEFINITIONS
// Body Recomposition Operating System
// ============================================================

// --- Navigation & Views ---
export type ViewType = 'planner' | 'dashboard' | 'strategy';

// --- Timer State Machine ---
export type TimerPhase = 'IDLE' | 'PREP' | 'WORK' | 'REST' | 'COMPLETE';

// --- Task Types for Planner ---
export type TaskType = 'meal' | 'supplement' | 'workout' | 'habit' | 'hydration' | 'cardio';
export type TaskCategory = 'morning' | 'afternoon' | 'evening';

export interface TaskMeta {
  protein?: number;
  calories?: number;
  workoutId?: string;
  routine?: 'A' | 'B';
}

export interface Task {
  id: string;
  title: string;
  subtitle?: string;
  time: string; // "HH:MM" format
  type: TaskType;
  icon?: string;
  category?: TaskCategory;
  completed?: boolean;
  meta?: TaskMeta;
}

// --- Workout Engine ---
export interface Exercise {
  name: string;
  detail: string;
  sets: number;
  work: number; // seconds
  rest: number; // seconds
}

export interface WorkoutPreset {
  id: string;
  name: string;
  icon: string;
  exercises: Exercise[];
  routine?: 'A' | 'B';
}

// --- Timer State ---
export interface TimerState {
  phase: TimerPhase;
  timeRemaining: number;
  currentSet: number;
  totalSets: number;
  currentExerciseIndex: number;
  totalExercises: number;
  workTime: number;
  restTime: number;
  isRunning: boolean;
}

// --- Dashboard Trackers ---
export interface ProteinTracker {
  current: number;
  goal: number; // default 140g
}

export interface HydrationTracker {
  glasses: number;
  goal: number; // default 8
}

export interface NonNegotiable {
  id: string;
  label: string;
  icon?: string;
  completed?: boolean;
}

// --- Daily State (persisted with midnight reset) ---
// --- Daily State (persisted with midnight reset) ---
export interface PrayerStatus {
  id: string;
  type: 'alone' | 'jamat';
  completedAt: string;
}

export interface DailyState {
  date: string; // "YYYY-MM-DD"
  tasks: Task[];
  protein: ProteinTracker;
  hydration: HydrationTracker;
  nonNegotiables: NonNegotiable[];
  activeRoutine: 'A' | 'B';
  mindfulness: {
    minutes: number;
    goal: number;
  };
  prayers: PrayerStatus[];
}

// --- Workout Stats ---
export interface WorkoutHistoryItem {
  date: string;
  workoutId: string;
  duration: number;
  exercisesCompleted: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalTime: number;
  lastWorkout: string | null;
  streak: number;
  history: WorkoutHistoryItem[];
}

// --- Unified History (Stats Overhaul) ---
export interface HistoryRecord {
  date: string; // YYYY-MM-DD
  workout: {
    count: number;
    duration: number; // minutes
    calories: number;
  };
  nutrition: {
    protein: number;
    water: number;
    calories?: number;
  };
  mindfulness: {
    minutes: number;
  };
  prayers: {
    completed: PrayerStatus[];
    total: number; // 5
  };
}

// --- App Settings ---
export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'dark' | 'light';
  wakeLockEnabled: boolean;
}

// --- Active Workout Session ---
export interface WorkoutSession {
  workout: WorkoutPreset;
  timer: TimerState;
  startedAt: number;
  isPaused: boolean;
}
