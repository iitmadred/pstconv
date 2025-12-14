// STEMMY DAILY LIFESTYLEOS - CONSTANTS
// ============================================================

import type { NonNegotiable, ProteinTracker, HydrationTracker } from '../types';

// --- Timer Constants ---
export const PREP_TIME = 5; // seconds before exercise starts
export const DEFAULT_WORK_TIME = 45;
export const DEFAULT_REST_TIME = 30;
export const DEFAULT_SETS = 4;

// --- Phase Colors ---
export const PHASE_COLORS = {
  IDLE: {
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    ring: 'ring-slate-600',
    gradient: 'from-slate-800 to-slate-900',
  },
  PREP: {
    bg: 'bg-amber-900',
    text: 'text-amber-300',
    ring: 'ring-amber-500',
    gradient: 'from-amber-800 to-amber-900',
  },
  WORK: {
    bg: 'bg-emerald-900',
    text: 'text-emerald-300',
    ring: 'ring-emerald-500',
    gradient: 'from-emerald-800 to-emerald-900',
  },
  REST: {
    bg: 'bg-sky-900',
    text: 'text-sky-300',
    ring: 'ring-sky-500',
    gradient: 'from-sky-800 to-sky-900',
  },
  COMPLETE: {
    bg: 'bg-violet-900',
    text: 'text-violet-300',
    ring: 'ring-violet-500',
    gradient: 'from-violet-800 to-violet-900',
  },
} as const;

// --- Audio Frequencies ---
export const AUDIO_FREQUENCIES = {
  PREP_START: 440,    // A4 - preparation warning
  WORK_START: 880,    // A5 - work phase starts
  REST_START: 660,    // E5 - rest phase starts
  COMPLETE: 523.25,   // C5 - exercise complete
  WORKOUT_DONE: 1046.5, // C6 - full workout complete
  COUNTDOWN: 440,     // A4 - countdown beeps (3,2,1)
} as const;

// --- Default Tracker Values ---
export const DEFAULT_PROTEIN: ProteinTracker = {
  current: 0,
  goal: 140,
};

export const DEFAULT_HYDRATION: HydrationTracker = {
  glasses: 0,
  goal: 8,
};

export const DEFAULT_NON_NEGOTIABLES: NonNegotiable[] = [
  { id: 'nn-protein', label: 'Hit 140g protein', completed: false },
  { id: 'nn-workout', label: 'Complete workout', completed: false },
  { id: 'nn-water', label: '8 glasses of water', completed: false },
  { id: 'nn-sleep', label: '7+ hours sleep', completed: false },
  { id: 'nn-steps', label: '10k steps', completed: false },
];

// --- Task Type Icons ---
export const TASK_ICONS = {
  meal: 'utensils',
  supplement: 'pill',
  workout: 'dumbbell',
  habit: 'check-circle',
  hydration: 'droplet',
} as const;

// --- Task Type Colors ---
export const TASK_COLORS = {
  meal: 'text-orange-400',
  supplement: 'text-purple-400',
  workout: 'text-emerald-400',
  habit: 'text-blue-400',
  hydration: 'text-cyan-400',
} as const;

// --- Navigation Items ---
export const NAV_ITEMS = [
  { id: 'planner', label: 'Planner', icon: 'calendar' },
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'strategy', label: 'Strategy', icon: 'target' },
] as const;

// --- Local Storage Keys ---
export const STORAGE_KEYS = {
  DAILY_STATE: 'stemmy-daily-state',
  WORKOUT_STATS: 'stemmy-workout-stats',
  APP_SETTINGS: 'stemmy-app-settings',
} as const;

// --- Protein Quick Add Amounts ---
export const PROTEIN_QUICK_ADD = [10, 25, 40] as const;
