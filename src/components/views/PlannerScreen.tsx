import { useState, useEffect } from 'react';
import { BottomNavBar } from '../layout';
import { Task, WorkoutPreset, TaskType, TaskCategory } from '../../types';
import { useApp } from '../../contexts';
import { AITaskInput } from '../shared/AITaskInput';
import { useSound } from '../../hooks';

interface PlannerScreenProps {
    tasks: Task[];
    onTaskToggle: (id: string) => void;
    onWorkoutSelect: (workoutId: string) => void;
    availableWorkouts: WorkoutPreset[];
}

// Helper: Convert 24h time to 12h format
const formatTime12h = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// ============================================================
// Add/Edit Task Modal
// ============================================================
interface TaskModalProps {
    isOpen: boolean;
    task?: Task;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id'>) => void;
    onDelete?: () => void;
}

const TASK_TYPES: { value: TaskType; label: string; icon: string }[] = [
    { value: 'meal', label: 'Meal', icon: '🍽️' },
    { value: 'workout', label: 'Workout', icon: '💪' },
    { value: 'habit', label: 'Habit', icon: '✨' },
    { value: 'cardio', label: 'Cardio', icon: '🏃' },
    { value: 'hydration', label: 'Hydration', icon: '💧' },
    { value: 'supplement', label: 'Supplement', icon: '💊' },
];

const CATEGORIES: { value: TaskCategory; label: string }[] = [
    { value: 'morning', label: 'Morning' },
    { value: 'afternoon', label: 'Afternoon' },
    { value: 'evening', label: 'Evening' },
];

function TaskModal({ isOpen, task, onClose, onSave, onDelete }: TaskModalProps) {
    const [title, setTitle] = useState(task?.title || '');
    const [subtitle, setSubtitle] = useState(task?.subtitle || '');
    const [time, setTime] = useState(task?.time || '09:00');
    const [type, setType] = useState<TaskType>(task?.type || 'habit');
    const [category, setCategory] = useState<TaskCategory>(task?.category || 'morning');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setSubtitle(task.subtitle || '');
            setTime(task.time);
            setType(task.type);
            setCategory(task.category || 'morning');
        } else {
            setTitle('');
            setSubtitle('');
            setTime('09:00');
            setType('habit');
            setCategory('morning');
        }
    }, [task, isOpen]);

    const handleSave = () => {
        if (!title.trim()) return;

        const selectedType = TASK_TYPES.find(t => t.value === type);
        onSave({
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            time,
            type,
            category,
            icon: selectedType?.icon,
            completed: task?.completed || false,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up-fade max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {task ? 'Edit Activity' : 'Add Activity'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="What's the activity?"
                            className="w-full bg-[#2C2C2E] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#2bee79] focus:outline-none"
                        />
                    </div>

                    {/* Subtitle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Description (optional)</label>
                        <input
                            type="text"
                            value={subtitle}
                            onChange={e => setSubtitle(e.target.value)}
                            placeholder="Add details..."
                            className="w-full bg-[#2C2C2E] border-0 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#2bee79] focus:outline-none"
                        />
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Time</label>
                        <input
                            type="time"
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="w-full bg-[#2C2C2E] border-0 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#2bee79] focus:outline-none"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                        <div className="grid grid-cols-3 gap-2">
                            {TASK_TYPES.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setType(t.value)}
                                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${type === t.value
                                        ? 'bg-[#2bee79]/20 ring-2 ring-[#2bee79]'
                                        : 'bg-[#2C2C2E] hover:bg-[#3C3C3E]'
                                        }`}
                                >
                                    <span className="text-xl">{t.icon}</span>
                                    <span className="text-xs text-gray-300">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Time of Day</label>
                        <div className="flex gap-2">
                            {CATEGORIES.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setCategory(c.value)}
                                    className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${category === c.value
                                        ? 'bg-[#2bee79] text-black'
                                        : 'bg-[#2C2C2E] text-gray-300 hover:bg-[#3C3C3E]'
                                        }`}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    {task && onDelete && (
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-all"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${title.trim()
                            ? 'bg-[#2bee79] text-black hover:bg-[#2bee79]/90'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {task ? 'Save Changes' : 'Add Activity'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Task Item Component
// ============================================================
const TaskItem = ({ task, onToggle, onEdit, onWorkoutClick }: {
    task: Task;
    onToggle: () => void;
    onEdit: () => void;
    onWorkoutClick?: () => void;
}) => {
    const isWorkout = task.type === 'workout';

    const categoryColors: Record<string, string> = {
        meal: 'bg-green-500',
        supplement: 'bg-purple-500',
        workout: 'bg-orange-500',
        habit: 'bg-blue-500',
        hydration: 'bg-cyan-500',
        cardio: 'bg-pink-500',
    };

    return (
        <div
            className={`flex min-h-[72px] items-center justify-between gap-4 rounded-xl bg-[#191919] p-4 transition-all group ${task.completed ? 'opacity-50' : ''}`}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                    className="flex size-7 items-center justify-center cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                >
                    <input
                        checked={task.completed || false}
                        onChange={() => { }}
                        className="h-5 w-5 rounded-md border-2 border-[#3b5445] bg-transparent text-[#2bee79] checked:border-[#2bee79] checked:bg-[#2bee79] focus:ring-0 cursor-pointer"
                        type="checkbox"
                    />
                </div>
                <div
                    className={`flex flex-col justify-center flex-1 min-w-0 ${isWorkout && !task.completed ? 'cursor-pointer' : ''}`}
                    onClick={isWorkout && !task.completed ? onWorkoutClick : undefined}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg shrink-0">{task.icon}</span>
                        <p className={`text-base font-medium leading-normal text-white truncate ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                        </p>
                    </div>
                    <p className={`text-sm font-normal leading-normal text-gray-400 truncate ${task.completed ? 'line-through' : ''}`}>
                        {task.subtitle || formatTime12h(task.time)}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">{formatTime12h(task.time)}</span>
                <div className={`h-3 w-3 rounded-full ${categoryColors[task.type] || 'bg-gray-500'}`}></div>
                <button
                    onClick={onEdit}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-gray-400 hover:text-white"
                >
                    <span className="material-symbols-outlined text-xl">edit</span>
                </button>
            </div>
        </div>
    );
};

// ============================================================
// Settings Modal
// ============================================================
function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { notificationsEnabled, voiceEnabled, setNotificationsEnabled, setVoiceEnabled } = useApp();

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotificationsEnabled(true);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="w-full max-w-sm bg-[#1C1C1E] rounded-3xl p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Notification Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-xl">
                        <div>
                            <p className="text-white font-medium">Notifications</p>
                            <p className="text-sm text-gray-400">Get reminders 5 min before</p>
                        </div>
                        <button
                            onClick={() => notificationsEnabled ? setNotificationsEnabled(false) : requestNotificationPermission()}
                            className={`w-12 h-7 rounded-full transition-colors ${notificationsEnabled ? 'bg-[#2bee79]' : 'bg-gray-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${notificationsEnabled ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#2C2C2E] rounded-xl">
                        <div>
                            <p className="text-white font-medium">Voice Announcements</p>
                            <p className="text-sm text-gray-400">Speak reminders aloud</p>
                        </div>
                        <button
                            onClick={() => setVoiceEnabled(!voiceEnabled)}
                            className={`w-12 h-7 rounded-full transition-colors ${voiceEnabled ? 'bg-[#2bee79]' : 'bg-gray-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${voiceEnabled ? 'translate-x-5' : ''}`}></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Main Planner Screen
// ============================================================
export function PlannerScreen({ tasks, onTaskToggle, onWorkoutSelect, availableWorkouts }: PlannerScreenProps) {
    const {
        addTask, updateTask, deleteTask, scheduleTaskNotification,
        customWorkouts, selectWorkout,
        addWorkout, updateWorkout, deleteWorkout,
        addExercise, updateExercise, deleteExercise
    } = useApp();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>();
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Sound effects - Added
    const sound = useSound();

    // Wrap toggle with sound - Added
    const handleToggleWithSound = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task && !task.completed) {
            sound.complete();
        } else {
            sound.pop();
        }
        onTaskToggle(id);
    };

    // Schedule notifications for tasks on mount
    useEffect(() => {
        tasks.forEach(task => {
            if (!task.completed) {
                scheduleTaskNotification(task);
            }
        });
    }, [tasks, scheduleTaskNotification]);

    const handleWorkoutClick = (task: Task) => {
        const workoutId = task.meta?.workoutId;
        if (workoutId) {
            onWorkoutSelect(workoutId);
        } else if (availableWorkouts.length > 0) {
            onWorkoutSelect(availableWorkouts[0].id);
        }
    };

    const handleAddTask = (taskData: Omit<Task, 'id'>) => {
        addTask(taskData);
    };

    const handleUpdateTask = (taskData: Omit<Task, 'id'>) => {
        if (editingTask) {
            updateTask(editingTask.id, taskData);
        }
    };

    const handleDeleteTask = () => {
        if (editingTask) {
            deleteTask(editingTask.id);
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setModalOpen(true);
    };

    const openAddModal = () => {
        setEditingTask(undefined);
        setModalOpen(true);
    };

    // Group tasks by category
    const morningTasks = tasks.filter(t => t.category === 'morning');
    const afternoonTasks = tasks.filter(t => t.category === 'afternoon');
    const eveningTasks = tasks.filter(t => t.category === 'evening');

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="dark bg-black min-h-screen" style={{ fontFamily: "'Manrope', sans-serif" }}>
            <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
                <div className="flex-grow pb-32">
                    <header className="flex shrink-0 items-center justify-between p-4 pb-2">
                        <div className="flex size-12 items-center justify-start">
                            <span className="material-symbols-outlined text-white text-3xl">calendar_month</span>
                        </div>
                        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-[-0.015em] text-gray-200">
                            {formatDate()}
                        </h1>
                        <div className="flex w-12 items-center justify-end">
                            <button
                                onClick={() => setSettingsOpen(true)}
                                className="flex h-12 cursor-pointer items-center justify-center rounded-lg bg-transparent text-white"
                            >
                                <span className="material-symbols-outlined text-2xl text-gray-400">settings</span>
                            </button>
                        </div>
                    </header>

                    {/* AI Task Input */}
                    <div className="px-4 py-3">
                        <AITaskInput
                            tasks={tasks}
                            addTask={handleAddTask}
                            updateTask={updateTask}
                            deleteTask={deleteTask}
                            toggleTask={onTaskToggle}
                            workouts={availableWorkouts}
                            customWorkouts={customWorkouts}
                            addWorkout={addWorkout}
                            updateWorkout={updateWorkout}
                            deleteWorkout={deleteWorkout}
                            addExercise={addExercise}
                            updateExercise={updateExercise}
                            deleteExercise={deleteExercise}
                            selectWorkout={selectWorkout}
                        />
                    </div>

                    <main className="flex-1 overflow-y-auto px-4 pt-4">
                        {/* Morning Section */}
                        {morningTasks.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">light_mode</span>
                                    Morning
                                </h2>
                                <div className="flex flex-col gap-2">
                                    {morningTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={() => handleToggleWithSound(task.id)}
                                            onEdit={() => openEditModal(task)}
                                            onWorkoutClick={() => handleWorkoutClick(task)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Afternoon Section */}
                        {afternoonTasks.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">wb_twilight</span>
                                    Afternoon
                                </h2>
                                <div className="flex flex-col gap-2">
                                    {afternoonTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={() => handleToggleWithSound(task.id)}
                                            onEdit={() => openEditModal(task)}
                                            onWorkoutClick={() => handleWorkoutClick(task)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Evening Section */}
                        {eveningTasks.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">nightlight</span>
                                    Evening
                                </h2>
                                <div className="flex flex-col gap-2">
                                    {eveningTasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={() => handleToggleWithSound(task.id)}
                                            onEdit={() => openEditModal(task)}
                                            onWorkoutClick={() => handleWorkoutClick(task)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">event_available</span>
                                <p className="text-gray-400 text-lg">No activities for today</p>
                                <p className="text-gray-500 text-sm mt-2">Tap the + button to add your first activity</p>
                            </div>
                        )}
                    </main>
                </div>

                {/* FAB - Add Task */}
                <button
                    onClick={openAddModal}
                    className="fixed bottom-28 right-6 z-20 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[#2bee79] text-black shadow-lg shadow-[#2bee79]/30 transition-all hover:scale-110 active:scale-95"
                >
                    <span className="material-symbols-outlined text-4xl">add</span>
                </button>

                <BottomNavBar />
            </div>

            {/* Task Modal */}
            <TaskModal
                isOpen={modalOpen}
                task={editingTask}
                onClose={() => { setModalOpen(false); setEditingTask(undefined); }}
                onSave={editingTask ? handleUpdateTask : handleAddTask}
                onDelete={editingTask ? handleDeleteTask : undefined}
            />

            {/* Settings Modal */}
            <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </div>
    );
}
