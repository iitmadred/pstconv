// ============================================================
// Data - Daily Tasks, Workouts & Non-Negotiables
// ============================================================

import type { Task, WorkoutPreset, NonNegotiable } from './types';

// Daily schedule tasks
export const DAILY_TASKS: Task[] = [
  // Morning Routine
  {
    id: 'wake',
    time: '05:00',
    title: 'Wake Up & Hydrate',
    subtitle: '500ml water + movement',
    type: 'habit',
    category: 'morning',
    icon: '☀️',
  },
  {
    id: 'morning-cardio',
    time: '05:30',
    title: 'Fasted Cardio',
    subtitle: '30 min zone 2',
    type: 'cardio',
    category: 'morning',
    icon: '🏃',
  },
  {
    id: 'breakfast',
    time: '06:30',
    title: 'Meal 1: Breakfast',
    subtitle: '40g protein, moderate carbs',
    type: 'meal',
    category: 'morning',
    icon: '🍳',
  },
  
  // Mid-Day
  {
    id: 'lunch',
    time: '12:00',
    title: 'Meal 2: Lunch',
    subtitle: '40g protein, veggies',
    type: 'meal',
    category: 'afternoon',
    icon: '🥗',
  },
  {
    id: 'snack',
    time: '15:00',
    title: 'Meal 3: Snack',
    subtitle: '20g protein',
    type: 'meal',
    category: 'afternoon',
    icon: '🥜',
  },
  
  // Evening Routine A
  {
    id: 'workout-a',
    time: '17:30',
    title: 'Push Day',
    subtitle: 'Chest, shoulders, triceps',
    type: 'workout',
    category: 'evening',
    icon: '💪',
    meta: { routine: 'A', workoutId: 'push' },
  },
  
  // Evening Routine B
  {
    id: 'workout-b',
    time: '17:30',
    title: 'Pull Day',
    subtitle: 'Back, biceps',
    type: 'workout',
    category: 'evening',
    icon: '💪',
    meta: { routine: 'B', workoutId: 'pull' },
  },
  
  // Post Workout
  {
    id: 'dinner',
    time: '19:00',
    title: 'Meal 4: Dinner',
    subtitle: '40g protein, carb reload',
    type: 'meal',
    category: 'evening',
    icon: '🍖',
  },
  {
    id: 'wind-down',
    time: '21:00',
    title: 'Wind Down',
    subtitle: 'No screens, prep for sleep',
    type: 'habit',
    category: 'evening',
    icon: '🌙',
  },
  {
    id: 'sleep',
    time: '22:00',
    title: 'Sleep',
    subtitle: '7-8 hours target',
    type: 'habit',
    category: 'evening',
    icon: '😴',
  },
];

// Workout presets
export const WORKOUTS: WorkoutPreset[] = [
  {
    id: 'push',
    name: 'Push Day',
    icon: '💪',
    routine: 'A',
    exercises: [
      { name: 'Bench Press', detail: 'Chest focus', work: 45, rest: 90, sets: 4 },
      { name: 'Overhead Press', detail: 'Shoulders', work: 40, rest: 90, sets: 4 },
      { name: 'Incline Dumbbell Press', detail: 'Upper chest', work: 40, rest: 60, sets: 3 },
      { name: 'Lateral Raises', detail: 'Side delts', work: 30, rest: 45, sets: 3 },
      { name: 'Tricep Pushdowns', detail: 'Triceps', work: 30, rest: 45, sets: 3 },
      { name: 'Overhead Tricep Ext', detail: 'Long head', work: 30, rest: 45, sets: 3 },
    ],
  },
  {
    id: 'pull',
    name: 'Pull Day',
    icon: '🏋️',
    routine: 'B',
    exercises: [
      { name: 'Deadlift', detail: 'Full back', work: 60, rest: 120, sets: 4 },
      { name: 'Pull-ups', detail: 'Lats width', work: 45, rest: 90, sets: 4 },
      { name: 'Barbell Rows', detail: 'Back thickness', work: 45, rest: 90, sets: 4 },
      { name: 'Face Pulls', detail: 'Rear delts', work: 30, rest: 45, sets: 3 },
      { name: 'Barbell Curls', detail: 'Biceps', work: 30, rest: 45, sets: 3 },
      { name: 'Hammer Curls', detail: 'Brachialis', work: 30, rest: 45, sets: 3 },
    ],
  },
  {
    id: 'legs',
    name: 'Leg Day',
    icon: '🦵',
    exercises: [
      { name: 'Squats', detail: 'Quads focus', work: 60, rest: 120, sets: 4 },
      { name: 'Romanian Deadlift', detail: 'Hamstrings', work: 45, rest: 90, sets: 4 },
      { name: 'Leg Press', detail: 'Volume', work: 45, rest: 90, sets: 3 },
      { name: 'Leg Curls', detail: 'Hamstrings', work: 30, rest: 60, sets: 3 },
      { name: 'Leg Extensions', detail: 'Quads', work: 30, rest: 60, sets: 3 },
      { name: 'Calf Raises', detail: 'Calves', work: 30, rest: 45, sets: 4 },
    ],
  },
  {
    id: 'hiit',
    name: 'HIIT Cardio',
    icon: '⚡',
    exercises: [
      { name: 'Burpees', detail: 'Full body', work: 30, rest: 30, sets: 4 },
      { name: 'Mountain Climbers', detail: 'Core + cardio', work: 30, rest: 30, sets: 4 },
      { name: 'Jump Squats', detail: 'Explosive legs', work: 30, rest: 30, sets: 4 },
      { name: 'High Knees', detail: 'Cardio', work: 30, rest: 30, sets: 4 },
      { name: 'Box Jumps', detail: 'Power', work: 30, rest: 45, sets: 3 },
    ],
  },
];

// Daily non-negotiables
export const NON_NEGOTIABLES: NonNegotiable[] = [
  { id: 'creatine', label: 'Creatine 5g', icon: '💊' },
  { id: 'vitamins', label: 'Vitamins', icon: '🌟' },
  { id: 'steps', label: '10k Steps', icon: '👟' },
  { id: 'sleep', label: '7+ Hours Sleep', icon: '😴' },
  { id: 'no-alcohol', label: 'No Alcohol', icon: '🚫' },
  { id: 'cold-shower', label: 'Cold Shower', icon: '🥶' },
];
