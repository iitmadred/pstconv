import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePuterAI, AIModelId } from '../../hooks/usePuterAI';
import { Task, WorkoutPreset, Exercise } from '../../types';

interface AITaskInputProps {
    // Task operations
    tasks: Task[];
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    deleteTask: (taskId: string) => void;
    toggleTask: (taskId: string) => void;
    // Workout operations (optional)
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

export function AITaskInput({
    tasks, addTask, updateTask, deleteTask, toggleTask,
    workouts, customWorkouts, addWorkout, updateWorkout, deleteWorkout,
    addExercise, updateExercise, deleteExercise, selectWorkout
}: AITaskInputProps) {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const modelPickerRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const { chat, transcribeAudio, isLoading, model, changeModel, models } = usePuterAI({
        tasks, addTask, updateTask, deleteTask, toggleTask,
        workouts, customWorkouts, addWorkout, updateWorkout, deleteWorkout,
        addExercise, updateExercise, deleteExercise, selectWorkout
    });

    // Close model picker on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
                setShowModelPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Clear response after delay
    useEffect(() => {
        if (response && !response.startsWith('Could') && !response.startsWith('AI')) {
            const timer = setTimeout(() => setResponse(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [response]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const result = await chat(input.trim());
        setResponse(result.message);
        setInput('');

        // Navigate to workout screen if AI started a workout
        if (result.action === 'start_workout' && result.data) {
            setTimeout(() => navigate('/workout'), 500);
        }
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setIsRecording(false);
                setResponse('Transcribing audio...');

                const text = await transcribeAudio(blob);
                if (text) {
                    setInput(text);
                    setResponse(null);
                    // focus input
                    inputRef.current?.focus();
                } else {
                    setResponse('Could not understand audio');
                }

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Mic error:', err);
            setResponse('Microphone access denied');
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    const currentModel = models.find(m => m.id === model);

    return (
        <div className="relative">
            {/* Main Input */}
            <form onSubmit={handleSubmit} className="relative">
                <div className={`flex items-center gap-2 p-3 bg-[#1C1C1E] rounded-2xl border transition-colors ${isRecording ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus-within:border-[#2bee79]/50'
                    }`}>
                    {/* AI Icon */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#2bee79] to-[#00FFFF]">
                        <span className="material-symbols-outlined text-black text-lg">auto_awesome</span>
                    </div>

                    {/* Input Field */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={isRecording ? 'Listening...' : input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isRecording ? "" : "Add gym at 5pm, move lunch to 1:30..."}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                        disabled={isLoading || isRecording}
                    />

                    {/* Mic Button */}
                    <button
                        type="button"
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${isRecording
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'hover:bg-white/10 text-gray-400 hover:text-white'
                            }`}
                        title={isRecording ? "Stop Recording" : "Voice Command"}
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isRecording ? 'stop' : 'mic'}
                        </span>
                    </button>

                    {/* Model Selector Button */}
                    <button
                        type="button"
                        onClick={() => setShowModelPicker(!showModelPicker)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-400"
                    >
                        <span className="truncate max-w-[60px]">{currentModel?.name.split(' ')[0]}</span>
                        <span className="material-symbols-outlined text-sm">expand_more</span>
                    </button>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || isRecording}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${input.trim() && !isLoading && !isRecording
                            ? 'bg-[#2bee79] text-black hover:scale-105'
                            : 'bg-white/10 text-gray-500'
                            }`}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-lg">send</span>
                        )}
                    </button>
                </div>
            </form>

            {/* Model Picker Dropdown */}
            {showModelPicker && (
                <div
                    ref={modelPickerRef}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#2C2C2E] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in"
                >
                    <div className="p-2 border-b border-white/10">
                        <p className="text-xs text-gray-400 px-2">Select AI Model</p>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {models.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    changeModel(m.id as AIModelId);
                                    setShowModelPicker(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors ${model === m.id ? 'bg-[#2bee79]/10' : ''
                                    }`}
                            >
                                <div className="text-left">
                                    <p className={`text-sm ${model === m.id ? 'text-[#2bee79]' : 'text-white'}`}>
                                        {m.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{m.provider}</p>
                                </div>
                                {model === m.id && (
                                    <span className="material-symbols-outlined text-[#2bee79] text-lg">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Response Popup - Enhanced Glassmorphism */}
            {response && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                    {/* Backdrop glow */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={`
                            w-64 h-64 rounded-full blur-[100px] opacity-30
                            ${response.startsWith('✓')
                                ? 'bg-emerald-500'
                                : response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone')
                                    ? 'bg-red-500'
                                    : 'bg-cyan-500'
                            }
                        `} />
                    </div>

                    <div
                        className="pointer-events-auto max-w-sm w-full relative overflow-hidden rounded-3xl animate-popup-in"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%)',
                            backdropFilter: 'blur(24px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                            boxShadow: `
                                0 8px 32px rgba(0,0,0,0.3),
                                inset 0 1px 0 rgba(255,255,255,0.1),
                                inset 0 -1px 0 rgba(0,0,0,0.2),
                                0 0 0 1px rgba(255,255,255,0.08)
                            `,
                        }}
                    >
                        {/* Shine effect overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(105deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
                            }}
                        />

                        {/* Colored top border glow */}
                        <div className={`
                            absolute top-0 left-0 right-0 h-[1px]
                            ${response.startsWith('✓')
                                ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent'
                                : response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone')
                                    ? 'bg-gradient-to-r from-transparent via-red-400 to-transparent'
                                    : 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                            }
                        `} />
                        {/* Popup Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center
                                    ${response.startsWith('✓')
                                        ? 'bg-emerald-500/20'
                                        : response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone')
                                            ? 'bg-red-500/20'
                                            : 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20'
                                    }
                                `}>
                                    <span className={`
                                        material-symbols-outlined text-lg
                                        ${response.startsWith('✓')
                                            ? 'text-emerald-400'
                                            : response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone')
                                                ? 'text-red-400'
                                                : 'text-cyan-400'
                                        }
                                    `}>
                                        {response.startsWith('✓') ? 'check_circle' :
                                            response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone') ? 'error' :
                                                'auto_awesome'}
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    {response.startsWith('✓') ? 'Done' :
                                        response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone') ? 'Error' :
                                            'AI Response'}
                                </span>
                            </div>
                            <button
                                onClick={() => setResponse(null)}
                                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        {/* Popup Content */}
                        <div className="px-5 py-4">
                            <p className={`
                                text-base font-normal leading-relaxed
                                ${response.startsWith('✓')
                                    ? 'text-emerald-300'
                                    : response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone')
                                        ? 'text-red-300'
                                        : 'text-gray-200'
                                }
                            `}>
                                {response}
                            </p>
                        </div>

                        {/* Popup Footer with auto-dismiss indicator */}
                        <div className="px-5 pb-4">
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`
                                        h-full rounded-full animate-shrink-bar
                                        ${response.startsWith('✓')
                                            ? 'bg-emerald-500/50'
                                            : response.startsWith('Could not') || response.startsWith('Puter') || response.startsWith('Microphone')
                                                ? 'bg-red-500/50'
                                                : 'bg-cyan-500/50'
                                        }
                                    `}
                                    style={{ animationDuration: '5s' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
                {['Add workout', 'Show tasks', 'What\'s next?'].map((suggestion) => (
                    <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
}
