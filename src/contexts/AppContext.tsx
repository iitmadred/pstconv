// ============================================================
// AppContext - Unified State Management for Stemmy
// Centralizes user profile, daily tracking, and workout stats
// ============================================================

import { createContext, useContext, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { usePersistedState, useSimplePersistedState } from '../hooks/usePersistedState';
import { DAILY_TASKS, NON_NEGOTIABLES, WORKOUTS } from '../data';
import type {
    Task,
    WorkoutPreset,
    WorkoutStats,
    HistoryRecord,
    DailyState,

    Exercise,
} from '../types';

// ============================================================
// User Profile Type
// ============================================================
export interface UserProfile {
    name: string;
    email: string;
    goal: 'lose' | 'maintain' | 'gain';
    routine: 'A' | 'B';
    weight: number;
    height: number;
    age: number;
    isOnboarded: boolean;
}

const DEFAULT_USER: UserProfile = {
    name: '',
    email: '',
    goal: 'maintain',
    routine: 'A',
    weight: 70,
    height: 175,
    age: 25,
    isOnboarded: false,
};

// ============================================================
// Daily State Defaults
// ============================================================
const DEFAULT_DAILY: DailyState = {
    date: new Date().toISOString().split('T')[0],
    tasks: [],
    protein: { current: 0, goal: 140 },
    hydration: { glasses: 0, goal: 8 },
    nonNegotiables: NON_NEGOTIABLES.map(n => ({ ...n, completed: false })),
    mindfulness: { minutes: 0, goal: 30 }, // Fixed structure to match type
    activeRoutine: 'A',
    prayers: [],
};

// ============================================================
// Workout Stats Default
// ============================================================
const DEFAULT_STATS: WorkoutStats = {
    streak: 0,
    totalWorkouts: 0,
    totalTime: 0,
    lastWorkout: null,
    history: [],
};

// ============================================================
// Context Type
// ============================================================
interface AppContextType {
    // User Profile
    user: UserProfile;
    updateUser: (updates: Partial<UserProfile>) => void;

    // Daily State
    daily: DailyState;
    updateProtein: (delta: number) => void;
    updateHydration: (delta: number) => void;
    updateMindfulness: (delta: number) => void;
    toggleTask: (taskId: string) => void;
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    toggleNonNegotiable: (id: string) => void;
    markPrayer: (id: string, type: 'alone' | 'jamat') => void;

    // History
    history: HistoryRecord[];

    // Notifications
    notificationsEnabled: boolean;
    voiceEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    setVoiceEnabled: (enabled: boolean) => void;
    scheduleTaskNotification: (task: Task) => void;

    // Workout Stats
    stats: WorkoutStats;
    recordWorkout: (workout: { workoutId: string; duration: number; exercises: number }) => void;
    resetStats: () => void;

    // Active Workout
    activeWorkout: WorkoutPreset | null;
    selectWorkout: (workout: WorkoutPreset | null) => void;

    // Custom Workouts (CRUD)
    customWorkouts: WorkoutPreset[];
    addWorkout: (workout: Omit<WorkoutPreset, 'id'>) => void;
    updateWorkout: (workoutId: string, updates: Partial<WorkoutPreset>) => void;
    deleteWorkout: (workoutId: string) => void;
    addExercise: (workoutId: string, exercise: Exercise) => void;
    updateExercise: (workoutId: string, exerciseIndex: number, updates: Partial<Exercise>) => void;
    deleteExercise: (workoutId: string, exerciseIndex: number) => void;

    // Computed Values
    dailyProgress: {
        activity: number;
        nutrition: number;
        mindfulness: number;
        overall: number;
    };

    // Available Workouts (default + custom)
    availableWorkouts: WorkoutPreset[];
    filteredTasks: Task[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================================
// Provider Component
// ============================================================
export function AppProvider({ children }: { children: ReactNode }) {
    // --- Persisted State (permanent) ---
    const [user, setUser] = useSimplePersistedState<UserProfile>('stemmy-user', DEFAULT_USER);
    const [stats, setStats] = useSimplePersistedState<WorkoutStats>('stemmy-stats', DEFAULT_STATS);
    const [history, setHistory] = useSimplePersistedState<HistoryRecord[]>('stemmy-history', []);

    // --- Save Daily Progress Logic ---
    const saveDailyProgress = useCallback((staleDaily: DailyState, staleDate: string) => {
        // Calculate daily stats to save
        const dayWorkouts = stats.history.filter(w => w.date.startsWith(staleDate));

        const record: HistoryRecord = {
            date: staleDate,
            workout: {
                count: dayWorkouts.length,
                duration: dayWorkouts.reduce((acc, w) => acc + w.duration, 0),
                calories: Math.round(dayWorkouts.reduce((acc, w) => acc + w.duration, 0) / 60 * 10),
            },
            nutrition: {
                protein: staleDaily.protein.current,
                water: staleDaily.hydration.glasses,
            },
            mindfulness: {
                minutes: staleDaily.mindfulness.minutes,
            },
            prayers: {
                completed: staleDaily.prayers,
                total: 5,
            },
        };

        setHistory(prev => {
            // Avoid duplicates
            if (prev.some(h => h.date === staleDate)) return prev;
            return [...prev, record].sort((a, b) => b.date.localeCompare(a.date));
        });
    }, [stats.history, setHistory]);

    // --- Persisted State (daily reset) ---
    const [daily, setDaily] = usePersistedState<DailyState>(
        'stemmy-daily',
        DEFAULT_DAILY,
        true,
        saveDailyProgress // <--- Callback on reset
    );

    // --- Active Workout (session only) ---
    const [activeWorkout, setActiveWorkout] = useSimplePersistedState<WorkoutPreset | null>('stemmy-active', null);

    // --- Custom Workouts (permanent) ---
    const [customWorkouts, setCustomWorkouts] = useSimplePersistedState<WorkoutPreset[]>('stemmy-custom-workouts', []);

    // --- Initialize tasks based on user routine ---
    useEffect(() => {
        if (user.isOnboarded && daily.tasks.length === 0) {
            const filteredTasks = DAILY_TASKS.filter(task => {
                if (task.meta?.routine) {
                    return task.meta.routine === user.routine;
                }
                return true;
            }).map(task => ({ ...task, completed: false }));

            setDaily(prev => ({ ...prev, tasks: filteredTasks }));
        }
    }, [user.isOnboarded, user.routine, daily.tasks.length, setDaily]);

    // --- User Actions ---
    const updateUser = useCallback((updates: Partial<UserProfile>) => {
        setUser(prev => ({ ...prev, ...updates }));
    }, [setUser]);

    // --- Daily Actions ---
    const updateProtein = useCallback((delta: number) => {
        setDaily(prev => ({
            ...prev,
            protein: { ...prev.protein, current: Math.max(0, prev.protein.current + delta) }
        }));
    }, [setDaily]);

    const updateHydration = useCallback((delta: number) => {
        setDaily(prev => ({
            ...prev,
            hydration: { ...prev.hydration, glasses: Math.max(0, prev.hydration.glasses + delta) }
        }));
    }, [setDaily]);

    const updateMindfulness = useCallback((delta: number) => {
        setDaily(prev => ({
            ...prev,
            mindfulness: { ...prev.mindfulness, minutes: Math.max(0, prev.mindfulness.minutes + delta) }
        }));
    }, [setDaily]);

    const toggleTask = useCallback((taskId: string) => {
        setDaily(prev => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            )
        }));
    }, [setDaily]);

    const markPrayer = useCallback((id: string, type: 'alone' | 'jamat') => {
        setDaily(prev => {
            const existing = prev.prayers.find(p => p.id === id);
            let newPrayers = [...prev.prayers];

            if (existing) {
                if (existing.type === type) {
                    // Toggle off if same type
                    newPrayers = newPrayers.filter(p => p.id !== id);
                } else {
                    // Update type if different (e.g., Alone -> Jamat)
                    newPrayers = newPrayers.map(p => p.id === id ? { ...p, type } : p);
                }
            } else {
                // Add new
                newPrayers.push({ id, type, completedAt: new Date().toISOString() });
            }

            return { ...prev, prayers: newPrayers };
        });
    }, [setDaily]);

    // --- Task CRUD ---
    const addTask = useCallback((task: Omit<Task, 'id'>) => {
        const newTask: Task = {
            ...task,
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setDaily(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask].sort((a, b) => a.time.localeCompare(b.time))
        }));
    }, [setDaily]);

    const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
        setDaily(prev => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.id === taskId ? { ...task, ...updates } : task
            ).sort((a, b) => a.time.localeCompare(b.time))
        }));
    }, [setDaily]);

    const deleteTask = useCallback((taskId: string) => {
        setDaily(prev => ({
            ...prev,
            tasks: prev.tasks.filter(task => task.id !== taskId)
        }));
    }, [setDaily]);

    const toggleNonNegotiable = useCallback((id: string) => {
        setDaily(prev => ({
            ...prev,
            nonNegotiables: prev.nonNegotiables.map(item =>
                item.id === id ? { ...item, completed: !item.completed } : item
            )
        }));
    }, [setDaily]);

    // --- Notification State ---
    const [notificationsEnabled, setNotificationsEnabled] = useSimplePersistedState('stemmy-notifications', false);
    const [voiceEnabled, setVoiceEnabled] = useSimplePersistedState('stemmy-voice', true);

    // --- Notification Functions ---
    const scheduleTaskNotification = useCallback((task: Task) => {
        if (!notificationsEnabled) return;

        // Parse task time
        const [hours, minutes] = task.time.split(':').map(Number);
        const now = new Date();
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);

        // Calculate delay (5 minutes before task)
        const notifyTime = new Date(taskTime.getTime() - 5 * 60 * 1000);
        const delay = notifyTime.getTime() - now.getTime();

        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
            setTimeout(() => {
                // Browser Notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`⏰ ${task.title}`, {
                        body: task.subtitle || `Scheduled for ${task.time}`,
                        icon: '/favicon.ico',
                        tag: task.id,
                    });
                }

                // Voice announcement
                if (voiceEnabled && 'speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(
                        `Reminder: ${task.title} in 5 minutes`
                    );
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    speechSynthesis.speak(utterance);
                }
            }, delay);
        }
    }, [notificationsEnabled, voiceEnabled]);

    // --- Workout Actions ---
    const selectWorkout = useCallback((workout: WorkoutPreset | null) => {
        setActiveWorkout(workout);
    }, [setActiveWorkout]);

    const recordWorkout = useCallback((workout: { workoutId: string; duration: number; exercises: number }) => {
        const today = new Date().toISOString().split('T')[0];

        setStats(prev => {
            let newStreak = prev.streak;
            const lastDate = prev.lastWorkout;

            if (lastDate === today) {
                newStreak = Math.max(1, prev.streak);
            } else if (lastDate) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                newStreak = lastDate === yesterday ? prev.streak + 1 : 1;
            } else {
                newStreak = 1;
            }

            return {
                totalWorkouts: prev.totalWorkouts + 1,
                totalTime: prev.totalTime + workout.duration,
                lastWorkout: today,
                streak: newStreak,
                history: [
                    ...prev.history,
                    {
                        date: new Date().toISOString(),
                        workoutId: workout.workoutId,
                        duration: workout.duration,
                        exercisesCompleted: workout.exercises,
                    }
                ],
            };
        });

        // Mark workout task as completed
        setDaily(prev => ({
            ...prev,
            tasks: prev.tasks.map(task =>
                task.type === 'workout' ? { ...task, completed: true } : task
            )
        }));

        // Clear active workout
        setActiveWorkout(null);
    }, [setStats, setDaily, setActiveWorkout]);

    const resetStats = useCallback(() => {
        setStats(DEFAULT_STATS);
        setHistory([]); // Also reset history
    }, [setStats, setHistory]);

    // --- Computed Values ---
    // --- Cleanup & Migration Effect ---
    useEffect(() => {
        // Fix for "7/5" prayers issue (deduplication & type migration)
        if (daily.prayers.length > 0) {
            const uniquePrayers = new Map();
            let hasChanges = false;

            daily.prayers.forEach((p: any) => {
                // Handle legacy string format
                if (typeof p === 'string') {
                    if (!uniquePrayers.has(p)) {
                        uniquePrayers.set(p, { id: p, type: 'alone', completedAt: new Date().toISOString() });
                        hasChanges = true; // Changed from string -> object
                    }
                }
                // Handle new object format
                else if (p && p.id) {
                    if (!uniquePrayers.has(p.id)) {
                        uniquePrayers.set(p.id, p);
                    } else {
                        hasChanges = true; // Duplicate found and removed
                    }
                }
            });

            // If we have mixed types or duplicates that we cleaned up, save it.
            // Also explicit check: if length differs, we definitely removed duplicates.
            if (hasChanges || uniquePrayers.size !== daily.prayers.length || daily.prayers.some(p => typeof p === 'string')) {
                setDaily(prev => ({ ...prev, prayers: Array.from(uniquePrayers.values()) }));
            }
        }
    }, [daily.prayers, setDaily]);

    // --- Computed Values ---
    const dailyProgress = useMemo(() => {
        const completedTasks = daily.tasks.filter(t => t.completed).length;
        const totalTasks = daily.tasks.length || 1;
        const activity = Math.round((completedTasks / totalTasks) * 100) || 0;

        const proteinGoal = daily.protein.goal || 140;
        const nutrition = Math.min(100, Math.round((daily.protein.current / proteinGoal) * 100)) || 0;

        const mindfulnessGoal = daily.mindfulness.goal || 30;
        const mindfulness = Math.min(100, Math.round((daily.mindfulness.minutes / mindfulnessGoal) * 100)) || 0;

        const overall = Math.round((activity + nutrition + mindfulness) / 3) || 0;

        return { activity, nutrition, mindfulness, overall };
    }, [daily]);

    // --- Workout CRUD ---
    const addWorkout = useCallback((workout: Omit<WorkoutPreset, 'id'>) => {
        const newWorkout: WorkoutPreset = {
            ...workout,
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };
        setCustomWorkouts(prev => [...prev, newWorkout]);
    }, [setCustomWorkouts]);

    const updateWorkout = useCallback((workoutId: string, updates: Partial<WorkoutPreset>) => {
        setCustomWorkouts(prev => prev.map(w =>
            w.id === workoutId ? { ...w, ...updates } : w
        ));
    }, [setCustomWorkouts]);

    const deleteWorkout = useCallback((workoutId: string) => {
        setCustomWorkouts(prev => prev.filter(w => w.id !== workoutId));
    }, [setCustomWorkouts]);

    const addExercise = useCallback((workoutId: string, exercise: Exercise) => {
        setCustomWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, exercises: [...w.exercises, exercise] }
                : w
        ));
    }, [setCustomWorkouts]);

    const updateExercise = useCallback((workoutId: string, exerciseIndex: number, updates: Partial<Exercise>) => {
        setCustomWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? {
                    ...w,
                    exercises: w.exercises.map((e, i) =>
                        i === exerciseIndex ? { ...e, ...updates } : e
                    )
                }
                : w
        ));
    }, [setCustomWorkouts]);

    const deleteExercise = useCallback((workoutId: string, exerciseIndex: number) => {
        setCustomWorkouts(prev => prev.map(w =>
            w.id === workoutId
                ? { ...w, exercises: w.exercises.filter((_, i) => i !== exerciseIndex) }
                : w
        ));
    }, [setCustomWorkouts]);

    // --- Available Workouts (default + custom) ---
    const availableWorkouts = useMemo(() => {
        const defaultWorkouts = WORKOUTS.filter(w => !w.routine || w.routine === user.routine);
        return [...defaultWorkouts, ...customWorkouts];
    }, [user.routine, customWorkouts]);

    const filteredTasks = useMemo(() => {
        // Combine DAILY_TASKS with custom tasks from daily.tasks
        const baseTasks = DAILY_TASKS.filter(task => {
            if (task.meta?.routine) {
                return task.meta.routine === user.routine;
            }
            return true;
        });

        // Merge with daily.tasks (which may have custom tasks and completion states)
        return daily.tasks.length > 0 ? daily.tasks : baseTasks.map(t => ({ ...t, completed: false }));
    }, [user.routine, daily.tasks]);

    // --- Context Value ---
    const value: AppContextType = {
        user,
        updateUser,
        daily,
        updateProtein,
        updateHydration,
        updateMindfulness,
        toggleTask,
        addTask,
        updateTask,
        deleteTask,
        toggleNonNegotiable,
        markPrayer,
        history,
        notificationsEnabled,
        voiceEnabled,
        setNotificationsEnabled,
        setVoiceEnabled,
        scheduleTaskNotification,
        stats,
        recordWorkout,
        resetStats,
        activeWorkout,
        selectWorkout,
        customWorkouts,
        addWorkout,
        updateWorkout,
        deleteWorkout,
        addExercise,
        updateExercise,
        deleteExercise,
        dailyProgress,
        availableWorkouts,
        filteredTasks,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// ============================================================
// Hook
// ============================================================
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
