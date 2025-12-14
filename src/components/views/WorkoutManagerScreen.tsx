import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts';
import { useSound, useHaptic } from '../../hooks';
import { WORKOUTS } from '../../data';
import { BottomNavBar } from '../layout';
import type { WorkoutPreset, Exercise } from '../../types';

const WORKOUT_ICONS = ['💪', '🏋️', '🦵', '⚡', '🔥', '💥', '🎯', '🏃', '💫', '⭐'];

export function WorkoutManagerScreen() {
    const navigate = useNavigate();
    const {
        selectWorkout, customWorkouts,
        addWorkout, updateWorkout, deleteWorkout,
        addExercise, updateExercise, deleteExercise
    } = useApp();
    const sound = useSound();
    const haptic = useHaptic();

    // Editor States
    const [showWorkoutEditor, setShowWorkoutEditor] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState<WorkoutPreset | null>(null);
    const [showExerciseEditor, setShowExerciseEditor] = useState(false);
    const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);

    // Form states
    const [workoutName, setWorkoutName] = useState('');
    const [workoutIcon, setWorkoutIcon] = useState('💪');
    const [exerciseName, setExerciseName] = useState('');
    const [exerciseDetail, setExerciseDetail] = useState('');
    const [exerciseSets, setExerciseSets] = useState(3);
    const [exerciseWork, setExerciseWork] = useState(45);
    const [exerciseRest, setExerciseRest] = useState(60);

    const allWorkouts = [...WORKOUTS, ...customWorkouts];
    const isCustomWorkout = (workout: WorkoutPreset) => workout.id.startsWith('custom-');

    const handleStartWorkout = (workout: WorkoutPreset) => {
        selectWorkout(workout);
        sound.complete();
        haptic.success();
        navigate('/workout');
    };

    // Editor Handlers
    const openNewWorkoutEditor = () => {
        setEditingWorkout(null);
        setWorkoutName('');
        setWorkoutIcon('💪');
        setShowWorkoutEditor(true);
    };

    const openEditWorkout = (workout: WorkoutPreset) => {
        if (!isCustomWorkout(workout)) {
            const customCopy: WorkoutPreset = {
                ...workout,
                id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: `${workout.name} (Custom)`,
                exercises: [...workout.exercises],
            };
            addWorkout({ name: customCopy.name, icon: customCopy.icon, exercises: customCopy.exercises });
            setTimeout(() => {
                const newWorkout = customWorkouts.find(w => w.name === customCopy.name);
                if (newWorkout) {
                    setEditingWorkout(newWorkout);
                    setWorkoutName(newWorkout.name);
                    setWorkoutIcon(newWorkout.icon);
                }
            }, 100);
        } else {
            setEditingWorkout(workout);
            setWorkoutName(workout.name);
            setWorkoutIcon(workout.icon);
        }
        setShowWorkoutEditor(true);
    };

    const handleSaveWorkout = () => {
        if (!workoutName.trim()) return;
        if (editingWorkout) {
            updateWorkout(editingWorkout.id, { name: workoutName, icon: workoutIcon });
        } else {
            addWorkout({ name: workoutName, icon: workoutIcon, exercises: [] });
        }
        sound.complete();
        haptic.success();
        setShowWorkoutEditor(false);
    };

    const handleDeleteWorkout = (workoutId: string) => {
        deleteWorkout(workoutId);
        sound.tap();
        haptic.tap();
    };

    // Exercise Handlers
    const openNewExerciseEditor = () => {
        setEditingExerciseIndex(null);
        setExerciseName('');
        setExerciseDetail('');
        setExerciseSets(3);
        setExerciseWork(45);
        setExerciseRest(60);
        setShowExerciseEditor(true);
    };

    const openEditExercise = (index: number, exercise: Exercise) => {
        setEditingExerciseIndex(index);
        setExerciseName(exercise.name);
        setExerciseDetail(exercise.detail);
        setExerciseSets(exercise.sets);
        setExerciseWork(exercise.work);
        setExerciseRest(exercise.rest);
        setShowExerciseEditor(true);
    };

    const handleSaveExercise = () => {
        if (!exerciseName.trim() || !editingWorkout) return;
        const exercise: Exercise = {
            name: exerciseName,
            detail: exerciseDetail,
            sets: exerciseSets,
            work: exerciseWork,
            rest: exerciseRest,
        };
        if (editingExerciseIndex !== null) {
            updateExercise(editingWorkout.id, editingExerciseIndex, exercise);
        } else {
            addExercise(editingWorkout.id, exercise);
        }
        sound.complete();
        haptic.success();
        setShowExerciseEditor(false);
        const updated = customWorkouts.find(w => w.id === editingWorkout.id);
        if (updated) setEditingWorkout(updated);
    };

    const handleDeleteExercise = (index: number) => {
        if (!editingWorkout) return;
        deleteExercise(editingWorkout.id, index);
        sound.tap();
        const updated = customWorkouts.find(w => w.id === editingWorkout.id);
        if (updated) setEditingWorkout(updated);
    };

    return (
        <div className="min-h-screen bg-black pb-32 text-white p-6 relative">
            <header className="flex items-center justify-between mb-8 pt-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        Workouts
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Select or create a routine</p>
                </div>
                <button
                    onClick={openNewWorkoutEditor}
                    className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-emerald-400 hover:bg-white/20 transition-all border border-white/5"
                >
                    <span className="material-icons-round text-2xl">add</span>
                </button>
            </header>

            <div className="space-y-4">
                {allWorkouts.map(workout => (
                    <div
                        key={workout.id}
                        className="w-full flex items-center gap-4 p-4 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 group-hover:to-emerald-500/10 transition-all" />

                        <button
                            onClick={() => handleStartWorkout(workout)}
                            className="flex items-center gap-4 flex-1 z-10"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-2xl shrink-0 border border-white/10 group-hover:border-emerald-500/30 group-hover:scale-105 transition-all">
                                {workout.icon}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <h4 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors truncate">
                                    {workout.name}
                                </h4>
                                <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span className="bg-white/10 px-2 py-0.5 rounded text-[10px]">
                                        {workout.exercises.length} Exercises
                                    </span>
                                </p>
                            </div>
                        </button>

                        <div className="flex gap-2 z-10 pl-2 border-l border-white/10">
                            <button
                                onClick={() => openEditWorkout(workout)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <span className="material-icons-round text-xl">
                                    {isCustomWorkout(workout) ? 'edit' : 'tune'}
                                </span>
                            </button>
                            {isCustomWorkout(workout) && (
                                <button
                                    onClick={() => handleDeleteWorkout(workout.id)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <span className="material-icons-round text-xl">delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Workout Editor Modal */}
            {showWorkoutEditor && !showExerciseEditor && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/80 animate-fade-in" onClick={() => setShowWorkoutEditor(false)} />
                    <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#1C1C1E] rounded-3xl p-5 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {editingWorkout ? 'Edit Workout' : 'New Workout'}
                            </h3>
                            <button onClick={() => setShowWorkoutEditor(false)} className="text-gray-400 hover:text-white">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-gray-400 mb-1 block">Workout Name</label>
                            <input
                                type="text"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                placeholder="e.g. Upper Body"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="text-xs text-gray-400 mb-2 block">Icon</label>
                            <div className="flex flex-wrap gap-2">
                                {WORKOUT_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        onClick={() => setWorkoutIcon(icon)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${workoutIcon === icon
                                            ? 'bg-emerald-500/30 ring-2 ring-emerald-500'
                                            : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {editingWorkout && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs text-gray-400">Exercises</label>
                                    <button
                                        onClick={openNewExerciseEditor}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                    >
                                        <span className="material-icons-round text-sm">add</span>
                                        Add Exercise
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {editingWorkout.exercises.map((ex, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">{ex.name}</p>
                                                <p className="text-xs text-gray-500">{ex.sets} sets • {ex.work}s work • {ex.rest}s rest</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditExercise(idx, ex)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-400"
                                                >
                                                    <span className="material-icons-round text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExercise(idx)}
                                                    className="p-1.5 text-gray-500 hover:text-red-400"
                                                >
                                                    <span className="material-icons-round text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {editingWorkout.exercises.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No exercises yet.</p>}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleSaveWorkout}
                            disabled={!workoutName.trim()}
                            className="w-full py-3 rounded-full bg-emerald-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
                        >
                            {editingWorkout ? 'Save Changes' : 'Create Workout'}
                        </button>
                    </div>
                </>
            )}

            {/* Exercise Editor Modal */}
            {showExerciseEditor && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/80 animate-fade-in" onClick={() => setShowExerciseEditor(false)} />
                    <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-[#1C1C1E] rounded-3xl p-5 border border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {editingExerciseIndex !== null ? 'Edit Exercise' : 'New Exercise'}
                            </h3>
                            <button onClick={() => setShowExerciseEditor(false)} className="text-gray-400 hover:text-white">
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>

                        <div className="mb-3">
                            <label className="text-xs text-gray-400 mb-1 block">Exercise Name</label>
                            <input
                                type="text"
                                value={exerciseName}
                                onChange={(e) => setExerciseName(e.target.value)}
                                placeholder="e.g. Bench Press"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="mb-3">
                            <label className="text-xs text-gray-400 mb-1 block">Details</label>
                            <input
                                type="text"
                                value={exerciseDetail}
                                onChange={(e) => setExerciseDetail(e.target.value)}
                                placeholder="e.g. Chest focus"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block text-center">Sets</label>
                                <div className="flex items-center justify-center gap-1 bg-white/5 rounded-xl p-2">
                                    <button onClick={() => setExerciseSets(Math.max(1, exerciseSets - 1))} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">-</button>
                                    <span className="w-8 text-center text-white font-bold">{exerciseSets}</span>
                                    <button onClick={() => setExerciseSets(exerciseSets + 1)} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block text-center">Work (s)</label>
                                <div className="flex items-center justify-center gap-1 bg-white/5 rounded-xl p-2">
                                    <button onClick={() => setExerciseWork(Math.max(5, exerciseWork - 5))} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">-</button>
                                    <span className="w-8 text-center text-white font-bold text-sm">{exerciseWork}</span>
                                    <button onClick={() => setExerciseWork(exerciseWork + 5)} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block text-center">Rest (s)</label>
                                <div className="flex items-center justify-center gap-1 bg-white/5 rounded-xl p-2">
                                    <button onClick={() => setExerciseRest(Math.max(5, exerciseRest - 5))} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">-</button>
                                    <span className="w-8 text-center text-white font-bold text-sm">{exerciseRest}</span>
                                    <button onClick={() => setExerciseRest(exerciseRest + 5)} className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20">+</button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveExercise}
                            disabled={!exerciseName.trim()}
                            className="w-full py-3 rounded-full bg-emerald-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
                        >
                            {editingExerciseIndex !== null ? 'Save Exercise' : 'Add Exercise'}
                        </button>
                    </div>
                </>
            )}

            <BottomNavBar />
        </div>
    );
}
