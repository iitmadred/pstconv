import { useState, useCallback, useEffect } from 'react';
import { Task, TaskType, WorkoutPreset, Exercise } from '../types';

// Available AI models
export const AI_MODELS = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
    { id: 'claude-sonnet-4', name: 'Claude Sonnet', provider: 'Anthropic' },
    { id: 'gemini-1.5-flash', name: 'Gemini Flash', provider: 'Google' },
    { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral' },
] as const;

export type AIModelId = typeof AI_MODELS[number]['id'];

// System prompt template with workout support
const SYSTEM_PROMPT_TEMPLATE = `You are a smart task and workout scheduler. Parse the user request and respond with JSON.

Context:
- Current Date: {DATE}
- Existing Tasks: {TASK_LIST}
- Available Workouts: {WORKOUT_LIST}

Format: {"action": "ACTION", ...params}

TASK Actions:
- create: {"action":"create","title":"Task Name","time":"HH:MM","type":"workout|meal|habit|cardio"}
- update: {"action":"update","taskName":"EXACT NAME","newTime":"HH:MM"}
- delete: {"action":"delete","taskName":"EXACT NAME"}
- complete: {"action":"complete","taskName":"EXACT NAME"}
- list: {"action":"list"}

WORKOUT Actions:
- create_workout: {"action":"create_workout","name":"Workout Name","icon":"💪"}
- add_exercise: {"action":"add_exercise","workoutName":"EXACT WORKOUT","exercise":{"name":"Exercise Name","detail":"Description","sets":3,"work":45,"rest":60}}
- update_workout: {"action":"update_workout","workoutName":"EXACT WORKOUT","newName":"New Name","newIcon":"🏋️"}
- update_exercise: {"action":"update_exercise","workoutName":"EXACT WORKOUT","exerciseName":"EXACT EXERCISE","sets":4,"work":60,"rest":90}
- delete_workout: {"action":"delete_workout","workoutName":"EXACT WORKOUT"}
- delete_exercise: {"action":"delete_exercise","workoutName":"EXACT WORKOUT","exerciseName":"EXACT EXERCISE"}
- list_workouts: {"action":"list_workouts"}
- start_workout: {"action":"start_workout","workoutName":"EXACT WORKOUT"}

- chat: {"action":"chat","message":"response text"}

Rules:
1. Fuzzy Matching: If user makes typos, find closest match in existing items.
2. Time: Convert to 24h format (5pm = 17:00).
3. Default exercise values: sets=3, work=45, rest=60 if not specified.
4. For workouts, icon should be an emoji like 💪, 🏋️, 🦵, ⚡, 🔥

Examples:
User: "create a new chest workout" -> {"action":"create_workout","name":"Chest Day","icon":"💪"}
User: "add bench press to push day" -> {"action":"add_exercise","workoutName":"Push Day","exercise":{"name":"Bench Press","detail":"Chest focus","sets":3,"work":45,"rest":60}}
User: "change rest time for bench press in push day to 90 seconds" -> {"action":"update_exercise","workoutName":"Push Day","exerciseName":"Bench Press","rest":90}
User: "delete leg day workout" -> {"action":"delete_workout","workoutName":"Leg Day"}
User: "start hiit cardio" -> {"action":"start_workout","workoutName":"HIIT Cardio"}`;

interface AIResponse {
    success: boolean;
    message: string;
    action?: string;
    data?: any;
}

interface UsePuterAIOptions {
    // Task operations
    tasks: Task[];
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    toggleTask: (taskId: string) => void;
    // Workout operations
    workouts?: WorkoutPreset[];
    customWorkouts?: WorkoutPreset[];
    addWorkout?: (workout: Omit<WorkoutPreset, 'id'>) => void;
    updateWorkout?: (workoutId: string, updates: Partial<WorkoutPreset>) => void;
    deleteWorkout?: (workoutId: string) => void;
    addExercise?: (workoutId: string, exercise: Exercise) => void;
    updateExercise?: (workoutId: string, exerciseIndex: number, updates: Partial<Exercise>) => void;
    deleteExercise?: (workoutId: string, exerciseIndex: number) => void;
    selectWorkout?: (workout: WorkoutPreset) => void;
}

export function usePuterAI(options: UsePuterAIOptions) {
    const {
        tasks, addTask, updateTask, deleteTask, toggleTask,
        workouts = [], customWorkouts = [],
        addWorkout, updateWorkout, deleteWorkout: deleteWorkoutFn,
        addExercise, updateExercise, deleteExercise,
        selectWorkout
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [model, setModel] = useState<AIModelId>('gpt-4o-mini');

    // Load saved model
    useEffect(() => {
        const saved = localStorage.getItem('stemmy-ai-model') as AIModelId;
        if (saved && AI_MODELS.some(m => m.id === saved)) {
            setModel(saved);
        }
    }, []);

    // All available workouts (default + custom)
    const allWorkouts = [...workouts, ...customWorkouts];

    // Find task by name
    const findTask = useCallback((name: string): Task | undefined => {
        const lower = name.toLowerCase();
        const exact = tasks.find(t => t.title.toLowerCase() === lower);
        if (exact) return exact;
        return tasks.find(t => t.title.toLowerCase().includes(lower));
    }, [tasks]);

    // Find workout by name
    const findWorkout = useCallback((name: string): WorkoutPreset | undefined => {
        const lower = name.toLowerCase();
        const exact = allWorkouts.find(w => w.name.toLowerCase() === lower);
        if (exact) return exact;
        return allWorkouts.find(w => w.name.toLowerCase().includes(lower));
    }, [allWorkouts]);

    // Find exercise in workout
    const findExercise = useCallback((workout: WorkoutPreset, name: string): { exercise: Exercise; index: number } | undefined => {
        const lower = name.toLowerCase();
        const index = workout.exercises.findIndex(e =>
            e.name.toLowerCase() === lower || e.name.toLowerCase().includes(lower)
        );
        if (index >= 0) return { exercise: workout.exercises[index], index };
        return undefined;
    }, []);

    // Execute parsed action
    const executeAction = useCallback((parsed: any): AIResponse => {
        const icons: Record<TaskType, string> = {
            meal: '🍽️', workout: '💪', habit: '✨',
            cardio: '🏃', hydration: '💧', supplement: '💊'
        };

        const getValidTime = (t: any) => {
            if (typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t)) return t;
            return '12:00';
        };

        const getValidTitle = (t: any) => {
            if (typeof t === 'string' && t.trim().length > 0) return t.trim();
            return 'New Activity';
        };

        switch (parsed.action) {
            // ==================== TASK ACTIONS ====================
            case 'create': {
                const title = getValidTitle(parsed.title || parsed.taskName || parsed.name);
                const time = getValidTime(parsed.time);
                let type: TaskType = 'habit';
                if (parsed.type && icons[parsed.type as TaskType]) {
                    type = parsed.type as TaskType;
                }
                const hour = parseInt(time.split(':')[0]);
                addTask({
                    title, time, type,
                    icon: icons[type],
                    category: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
                    completed: false
                });
                const h = hour % 12 || 12;
                const ampm = hour >= 12 ? 'PM' : 'AM';
                return { success: true, message: `✓ Added "${title}" at ${h}:00 ${ampm}` };
            }

            case 'update': {
                const targetName = parsed.taskName || parsed.title || parsed.name;
                if (!targetName) return { success: false, message: 'I need a task name to update' };
                const task = findTask(targetName);
                if (!task) return { success: false, message: `Cannot find "${targetName}"` };
                const updates: Partial<Task> = {};
                if (parsed.newTime) updates.time = getValidTime(parsed.newTime);
                if (parsed.newTitle) updates.title = parsed.newTitle;
                updateTask(task.id, updates);
                return { success: true, message: `✓ Updated "${task.title}"` };
            }

            case 'delete': {
                const targetName = parsed.taskName || parsed.title || parsed.name;
                const task = findTask(targetName);
                if (!task) return { success: false, message: `Cannot find "${targetName}"` };
                deleteTask(task.id);
                return { success: true, message: `✓ Deleted "${task.title}"` };
            }

            case 'complete': {
                const targetName = parsed.taskName || parsed.title || parsed.name;
                const task = findTask(targetName);
                if (!task) return { success: false, message: `Cannot find "${targetName}"` };
                if (!task.completed) toggleTask(task.id);
                return { success: true, message: `✓ Done: "${task.title}"` };
            }

            case 'list': {
                const pending = tasks.filter(t => !t.completed).slice(0, 3);
                return { success: true, message: pending.map(t => `${t.time} ${t.title}`).join(', ') || 'No tasks' };
            }

            // ==================== WORKOUT ACTIONS ====================
            case 'create_workout': {
                if (!addWorkout) return { success: false, message: 'Workout creation not available' };
                const name = getValidTitle(parsed.name || parsed.workoutName);
                const icon = parsed.icon || '💪';
                addWorkout({ name, icon, exercises: [] });
                return { success: true, message: `✓ Created workout "${name}" ${icon}` };
            }

            case 'add_exercise': {
                if (!addExercise) return { success: false, message: 'Exercise addition not available' };
                const workoutName = parsed.workoutName || parsed.workout;
                if (!workoutName) return { success: false, message: 'Please specify which workout to add the exercise to' };

                const workout = findWorkout(workoutName);
                if (!workout) {
                    // Suggest creating it first
                    const availableNames = allWorkouts.slice(0, 3).map(w => w.name).join(', ');
                    return {
                        success: false,
                        message: `Cannot find "${workoutName}". Available: ${availableNames}. Say "create ${workoutName} workout" first.`
                    };
                }
                if (!workout.id.startsWith('custom-')) {
                    return { success: false, message: `Cannot modify "${workout.name}" (default). Say "create a custom ${workout.name}" to make an editable copy.` };
                }
                const ex = parsed.exercise || {};
                const exercise: Exercise = {
                    name: getValidTitle(ex.name || parsed.exerciseName || parsed.name),
                    detail: ex.detail || ex.description || '',
                    sets: typeof ex.sets === 'number' ? ex.sets : 3,
                    work: typeof ex.work === 'number' ? ex.work : 45,
                    rest: typeof ex.rest === 'number' ? ex.rest : 60,
                };
                addExercise(workout.id, exercise);
                return { success: true, message: `✓ Added "${exercise.name}" to ${workout.name} (${exercise.sets} sets, ${exercise.work}s work, ${exercise.rest}s rest)` };
            }

            case 'update_workout': {
                if (!updateWorkout) return { success: false, message: 'Workout update not available' };
                const workoutName = parsed.workoutName || parsed.workout;
                const workout = findWorkout(workoutName);
                if (!workout) return { success: false, message: `Cannot find workout "${workoutName}"` };
                if (!workout.id.startsWith('custom-')) {
                    return { success: false, message: `Cannot modify default workout "${workout.name}". Create a custom copy first.` };
                }
                const updates: Partial<WorkoutPreset> = {};
                if (parsed.newName) updates.name = parsed.newName;
                if (parsed.newIcon) updates.icon = parsed.newIcon;
                updateWorkout(workout.id, updates);
                return { success: true, message: `✓ Updated workout "${workout.name}"` };
            }

            case 'update_exercise': {
                if (!updateExercise) return { success: false, message: 'Exercise update not available' };
                const workoutName = parsed.workoutName || parsed.workout;
                const workout = findWorkout(workoutName);
                if (!workout) return { success: false, message: `Cannot find workout "${workoutName}"` };
                if (!workout.id.startsWith('custom-')) {
                    return { success: false, message: `Cannot modify default workout "${workout.name}". Create a custom copy first.` };
                }
                const exerciseName = parsed.exerciseName || parsed.exercise;
                const exerciseData = findExercise(workout, exerciseName);
                if (!exerciseData) return { success: false, message: `Cannot find exercise "${exerciseName}" in ${workout.name}` };

                const updates: Partial<Exercise> = {};
                if (parsed.sets !== undefined) updates.sets = parsed.sets;
                if (parsed.work !== undefined) updates.work = parsed.work;
                if (parsed.rest !== undefined) updates.rest = parsed.rest;
                if (parsed.newName) updates.name = parsed.newName;
                if (parsed.detail) updates.detail = parsed.detail;

                updateExercise(workout.id, exerciseData.index, updates);
                return { success: true, message: `✓ Updated "${exerciseData.exercise.name}" in ${workout.name}` };
            }

            case 'delete_workout': {
                if (!deleteWorkoutFn) return { success: false, message: 'Workout deletion not available' };
                const workoutName = parsed.workoutName || parsed.workout || parsed.name;
                const workout = findWorkout(workoutName);
                if (!workout) return { success: false, message: `Cannot find workout "${workoutName}"` };
                if (!workout.id.startsWith('custom-')) {
                    return { success: false, message: `Cannot delete default workout "${workout.name}". You can only delete custom workouts.` };
                }
                deleteWorkoutFn(workout.id);
                return { success: true, message: `✓ Deleted workout "${workout.name}"` };
            }

            case 'delete_exercise': {
                if (!deleteExercise) return { success: false, message: 'Exercise deletion not available' };
                const workoutName = parsed.workoutName || parsed.workout;
                const workout = findWorkout(workoutName);
                if (!workout) return { success: false, message: `Cannot find workout "${workoutName}"` };
                if (!workout.id.startsWith('custom-')) {
                    return { success: false, message: `Cannot modify default workout "${workout.name}". Create a custom copy first.` };
                }
                const exerciseName = parsed.exerciseName || parsed.exercise;
                const exerciseData = findExercise(workout, exerciseName);
                if (!exerciseData) return { success: false, message: `Cannot find exercise "${exerciseName}" in ${workout.name}` };
                deleteExercise(workout.id, exerciseData.index);
                return { success: true, message: `✓ Removed "${exerciseData.exercise.name}" from ${workout.name}` };
            }

            case 'list_workouts': {
                const workoutList = allWorkouts.map(w => `${w.icon} ${w.name} (${w.exercises.length} exercises)`).join(', ');
                return { success: true, message: workoutList || 'No workouts available' };
            }

            case 'start_workout': {
                if (!selectWorkout) return { success: false, message: 'Workout start not available' };
                const workoutName = parsed.workoutName || parsed.workout || parsed.name;
                const workout = findWorkout(workoutName);
                if (!workout) return { success: false, message: `Cannot find workout "${workoutName}"` };
                selectWorkout(workout);
                return { success: true, message: `✓ Starting "${workout.name}"`, action: 'start_workout', data: workout };
            }

            case 'chat':
                return { success: true, message: parsed.message || 'I see.' };

            default:
                return { success: false, message: 'I understood the words, but not the command.' };
        }
    }, [
        tasks, addTask, updateTask, deleteTask, toggleTask, findTask,
        allWorkouts, addWorkout, updateWorkout, deleteWorkoutFn,
        addExercise, updateExercise, deleteExercise, selectWorkout,
        findWorkout, findExercise
    ]);

    // Main chat function
    const chat = useCallback(async (userMessage: string): Promise<AIResponse> => {
        const puter = (window as any).puter;
        if (!puter?.ai?.chat) {
            return { success: false, message: 'Please sign in to Puter (popup should appear)' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const taskListProto = tasks.map(t => t.title).join(', ');
            const workoutListProto = allWorkouts.map(w => `${w.name} (${w.id.startsWith('custom-') ? 'custom' : 'default'})`).join(', ');

            const systemPrompt = SYSTEM_PROMPT_TEMPLATE
                .replace('{DATE}', new Date().toLocaleDateString())
                .replace('{TASK_LIST}', `[${taskListProto}]`)
                .replace('{WORKOUT_LIST}', `[${workoutListProto}]`);

            const prompt = `${systemPrompt}\n\nUser: ${userMessage}\nJSON:`;

            const response = await puter.ai.chat(prompt, { model });

            console.log('Puter raw response:', response);

            let text = '';
            if (!response) {
                text = 'No response from AI';
            } else if (typeof response === 'string') {
                text = response;
            } else if (typeof response === 'object') {
                const r = response as any;
                if (r?.message?.content && typeof r.message.content === 'string') {
                    text = r.message.content;
                } else if (typeof r.text === 'string') {
                    text = r.text;
                } else if (typeof r.content === 'string') {
                    text = r.content;
                } else if (Array.isArray(r) && r[0]?.text && typeof r[0].text === 'string') {
                    text = r[0].text;
                } else {
                    try {
                        text = JSON.stringify(r, null, 2);
                    } catch (e) {
                        text = '[Complex Object - parsing failed]';
                    }
                }
            } else {
                text = String(response);
            }

            console.log('Extracted text:', text);

            // Extract JSON - handle nested objects properly
            let parsed = null;

            // Try to find a complete JSON object (handles nested braces)
            const extractJSON = (str: string): string | null => {
                const start = str.indexOf('{');
                if (start === -1) return null;

                let depth = 0;
                let inString = false;
                let escaped = false;

                for (let i = start; i < str.length; i++) {
                    const char = str[i];

                    if (escaped) {
                        escaped = false;
                        continue;
                    }

                    if (char === '\\') {
                        escaped = true;
                        continue;
                    }

                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }

                    if (!inString) {
                        if (char === '{') depth++;
                        if (char === '}') depth--;

                        if (depth === 0) {
                            return str.slice(start, i + 1);
                        }
                    }
                }
                return null;
            };

            const jsonStr = extractJSON(text);
            if (jsonStr) {
                try {
                    parsed = JSON.parse(jsonStr);
                    console.log('Parsed JSON:', parsed);
                } catch (e) {
                    console.log('JSON parse error:', e);
                }
            }

            if (parsed && parsed.action) {
                setIsLoading(false);
                return executeAction(parsed);
            }

            setIsLoading(false);
            return { success: true, message: text.slice(0, 100) || 'No response' };

        } catch (err: any) {
            console.error('Puter error:', err);
            setIsLoading(false);
            setError(err.message);

            if (err.message?.includes('auth') || err.message?.includes('sign')) {
                return { success: false, message: 'Please sign in to Puter first' };
            }

            return { success: false, message: err.message || 'AI error - try again' };
        }
    }, [model, executeAction, tasks, allWorkouts]);

    // Transcribe audio
    const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
        const puter = (window as any).puter;
        if (!puter?.ai?.speech2txt) {
            console.error('Puter speech2txt not available');
            return null;
        }

        setIsLoading(true);
        try {
            const transcript = await puter.ai.speech2txt(audioBlob, { language: 'en' });
            setIsLoading(false);
            if (typeof transcript === 'string') return transcript;
            if (transcript?.text) return transcript.text;
            return String(transcript);
        } catch (err: any) {
            console.error('Transcription error:', err);
            setError(err.message || 'Failed to transcribe audio');
            setIsLoading(false);
            return null;
        }
    }, []);

    // Change model
    const changeModel = useCallback((m: AIModelId) => {
        setModel(m);
        localStorage.setItem('stemmy-ai-model', m);
    }, []);

    return { chat, transcribeAudio, isLoading, error, model, changeModel, models: AI_MODELS };
}
