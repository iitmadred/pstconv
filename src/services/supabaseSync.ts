// ============================================================
// Supabase Data Sync Service
// Handles syncing app data to/from Supabase
// ============================================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { HistoryRecord, DailyState, WorkoutStats } from '../types';

// Types for database records
interface ProfileRow {
    id: string;
    name: string | null;
    email: string | null;
    goal: string;
    routine: string;
    weight: number;
    height: number;
    age: number;
}

interface DailyStateRow {
    user_id: string;
    date: string;
    tasks: unknown;
    protein_current: number;
    protein_goal: number;
    hydration_glasses: number;
    hydration_goal: number;
    mindfulness_minutes: number;
    mindfulness_goal: number;
    non_negotiables: unknown;
    prayers: unknown;
    active_routine: string;
}

interface HistoryRow {
    user_id: string;
    date: string;
    workout: unknown;
    nutrition: unknown;
    mindfulness: unknown;
    prayers: unknown;
}

interface WorkoutStatsRow {
    user_id: string;
    total_workouts: number;
    total_time: number;
    streak: number;
    last_workout: string | null;
}

// ============================================================
// Profile Sync
// ============================================================
export async function syncProfile(userId: string, profile: {
    name: string;
    email: string;
    goal: string;
    routine: string;
    weight: number;
    height: number;
    age: number;
}): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            name: profile.name,
            email: profile.email,
            goal: profile.goal,
            routine: profile.routine,
            weight: profile.weight,
            height: profile.height,
            age: profile.age,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

    if (error) console.error('Profile sync error:', error);
}

export async function loadProfile(userId: string): Promise<ProfileRow | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Profile load error:', error);
        return null;
    }
    return data;
}

// ============================================================
// Daily State Sync
// ============================================================
export async function syncDailyState(userId: string, daily: DailyState): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
        .from('daily_state')
        .upsert({
            user_id: userId,
            date: today,
            tasks: daily.tasks,
            protein_current: daily.protein.current,
            protein_goal: daily.protein.goal,
            hydration_glasses: daily.hydration.glasses,
            hydration_goal: daily.hydration.goal,
            mindfulness_minutes: daily.mindfulness.minutes,
            mindfulness_goal: daily.mindfulness.goal,
            non_negotiables: daily.nonNegotiables,
            prayers: daily.prayers,
            active_routine: daily.activeRoutine,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,date' });

    if (error) console.error('Daily state sync error:', error);
}

export async function loadDailyState(userId: string): Promise<DailyState | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('daily_state')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

    if (error || !data) return null;

    const row = data as DailyStateRow;
    return {
        date: row.date,
        tasks: row.tasks as DailyState['tasks'],
        protein: { current: row.protein_current, goal: row.protein_goal },
        hydration: { glasses: row.hydration_glasses, goal: row.hydration_goal },
        mindfulness: { minutes: row.mindfulness_minutes, goal: row.mindfulness_goal },
        nonNegotiables: row.non_negotiables as DailyState['nonNegotiables'],
        prayers: row.prayers as DailyState['prayers'],
        activeRoutine: row.active_routine as 'A' | 'B',
    };
}

// ============================================================
// History Sync
// ============================================================
export async function syncHistory(userId: string, records: HistoryRecord[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase || records.length === 0) return;

    const rows = records.map(record => ({
        user_id: userId,
        date: record.date,
        workout: record.workout,
        nutrition: record.nutrition,
        mindfulness: record.mindfulness,
        prayers: record.prayers,
    }));

    const { error } = await supabase
        .from('history')
        .upsert(rows, { onConflict: 'user_id,date' });

    if (error) console.error('History sync error:', error);
}

export async function loadHistory(userId: string): Promise<HistoryRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
        .from('history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('History load error:', error);
        return [];
    }

    return (data as HistoryRow[]).map(row => ({
        date: row.date,
        workout: row.workout as HistoryRecord['workout'],
        nutrition: row.nutrition as HistoryRecord['nutrition'],
        mindfulness: row.mindfulness as HistoryRecord['mindfulness'],
        prayers: row.prayers as HistoryRecord['prayers'],
    }));
}

// ============================================================
// Workout Stats Sync
// ============================================================
export async function syncWorkoutStats(userId: string, stats: WorkoutStats): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { error } = await supabase
        .from('workout_stats')
        .upsert({
            user_id: userId,
            total_workouts: stats.totalWorkouts,
            total_time: stats.totalTime,
            streak: stats.streak,
            last_workout: stats.lastWorkout,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

    if (error) console.error('Workout stats sync error:', error);
}

export async function loadWorkoutStats(userId: string): Promise<Partial<WorkoutStats> | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
        .from('workout_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    const row = data as WorkoutStatsRow;
    return {
        totalWorkouts: row.total_workouts,
        totalTime: row.total_time,
        streak: row.streak,
        lastWorkout: row.last_workout,
    };
}

// ============================================================
// Custom Workouts Sync
// ============================================================
export async function syncCustomWorkouts(userId: string, workouts: any[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    if (workouts.length === 0) return;

    const rows = workouts.map(w => ({
        id: w.id,
        user_id: userId,
        name: w.name,
        icon: w.icon,
        exercises: w.exercises,
        routine: w.routine,
        updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
        .from('custom_workouts')
        .upsert(rows, { onConflict: 'id' });

    if (error) console.error('Custom workouts sync error:', error);
}

export async function loadCustomWorkouts(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
        .from('custom_workouts')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Custom workouts load error:', error);
        return [];
    }

    return data.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        exercises: row.exercises,
        routine: row.routine,
    }));
}

// ============================================================
// Detailed Workout History Sync (from stats.history)
// ============================================================
export async function syncWorkoutHistoryItems(userId: string, historyItems: any[]): Promise<void> {
    if (!isSupabaseConfigured || !supabase || historyItems.length === 0) return;

    const rows = historyItems.map(item => ({
        user_id: userId,
        workout_id: item.workoutId,
        date: item.date,
        duration: item.duration,
        exercises_completed: item.exercisesCompleted,
    }));

    const { error } = await supabase
        .from('workout_history')
        .upsert(rows, { onConflict: 'user_id,date' });

    if (error) console.error('Detailed workout history sync error:', error);
}

export async function loadWorkoutHistoryItems(userId: string): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
        .from('workout_history')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Detailed workout history load error:', error);
        return [];
    }

    return data.map(row => ({
        date: row.date,
        workoutId: row.workout_id,
        duration: row.duration,
        exercisesCompleted: row.exercises_completed,
    }));
}

// ============================================================
// Load All User Data
// ============================================================
export async function loadAllUserData(userId: string) {
    const [profile, daily, history, stats, customWorkouts, workoutHistory] = await Promise.all([
        loadProfile(userId),
        loadDailyState(userId),
        loadHistory(userId),
        loadWorkoutStats(userId),
        loadCustomWorkouts(userId),
        loadWorkoutHistoryItems(userId),
    ]);

    return { profile, daily, history, stats, customWorkouts, workoutHistory };
}

// ============================================================
// Debounced Sync Helper
// ============================================================
const syncTimers: Map<string, NodeJS.Timeout> = new Map();

export function debouncedSync<T>(
    key: string,
    syncFn: () => Promise<T>,
    delay: number = 500
): void {
    const existingTimer = syncTimers.get(key);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
        try {
            await syncFn();
        } catch (e) {
            console.error(`Sync error for ${key}:`, e);
        }
        syncTimers.delete(key);
    }, delay);

    syncTimers.set(key, timer);
}
