import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavBar } from '../layout';
import { useApp } from '../../contexts';
import { useSound, useHaptic } from '../../hooks';

// Prayer time definitions (static - would come from API in production)
const PRAYER_DEFINITIONS = [
    { id: 'fajr', name: 'Fajr', arabic: 'الفجر', hour: 5, minute: 19, icon: 'wb_twilight' },
    { id: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', hour: 12, minute: 19, icon: 'wb_sunny' },
    { id: 'asr', name: 'Asr', arabic: 'العصر', hour: 15, minute: 35, icon: 'wb_sunny' },
    { id: 'maghrib', name: 'Maghrib', arabic: 'المغرب', hour: 18, minute: 4, icon: 'nights_stay' },
    { id: 'isha', name: 'Isha', arabic: 'العشاء', hour: 19, minute: 19, icon: 'dark_mode' },
];

export function DashboardScreen() {
    const { filteredTasks, toggleTask, dailyProgress, daily, markPrayer, availableWorkouts, selectWorkout } = useApp();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const sound = useSound();
    const haptic = useHaptic();

    // Update time every minute for prayer status
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // --- Helpers ---
    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (hour: number, minute: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    };

    // --- Task Progress (from context) ---
    const progress = dailyProgress.overall;
    const completedTasks = filteredTasks.filter(t => t.completed).length;
    const totalTasks = filteredTasks.length;

    // --- Next Task ---
    const nextTask = filteredTasks.find(t => !t.completed);

    // --- Calculate time remaining until next task ---
    const timeUntilNextTask = useMemo(() => {
        if (!nextTask) return null;
        const [hours, minutes] = nextTask.time.split(':').map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);
        const diff = taskTime.getTime() - currentTime.getTime();
        if (diff <= 0) return 'Now!';
        const mins = Math.floor(diff / 60000);
        const hrs = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        if (hrs > 0) return `${hrs}h ${remainingMins}m`;
        return `${remainingMins}m`;
    }, [nextTask, currentTime]);

    // --- Salah Progress ---
    const salahProgress = Math.round((daily.prayers.length / 5) * 100);

    // --- Prayer Status Logic ---
    const prayerTimesWithStatus = useMemo(() => {
        const now = currentTime;
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        return PRAYER_DEFINITIONS.map((prayer, index) => {
            const prayerMinutes = prayer.hour * 60 + prayer.minute;
            const nextPrayerMinutes = PRAYER_DEFINITIONS[index + 1]
                ? PRAYER_DEFINITIONS[index + 1].hour * 60 + PRAYER_DEFINITIONS[index + 1].minute
                : 24 * 60; // End of day for Isha

            const prayerRecord = daily.prayers.find(p => p.id === prayer.id);
            const isCompleted = !!prayerRecord;
            const isJamat = prayerRecord?.type === 'jamat';
            const isPassed = currentMinutes >= nextPrayerMinutes;
            const isCurrent = currentMinutes >= prayerMinutes && currentMinutes < nextPrayerMinutes;

            let status: 'Done' | 'Missed' | 'Next' | '' = '';
            if (isCompleted) {
                status = 'Done';
            } else if (isPassed) {
                status = 'Missed';
            } else if (isCurrent) {
                status = 'Next';
            }

            // Color: jamat = gold, alone = emerald, missed = red
            let color = 'gray';
            if (isCompleted) {
                color = isJamat ? 'gold' : 'emerald';
            } else if (isPassed) {
                color = 'red';
            } else if (isCurrent) {
                color = 'primary';
            }

            return {
                ...prayer,
                time: formatTime(prayer.hour, prayer.minute),
                status,
                active: isCurrent && !isCompleted,
                color,
                isJamat,
            };
        });
    }, [currentTime, daily.prayers]);

    // Count completed prayers
    const prayersCompleted = daily.prayers.length;

    // --- Handlers ---
    const handleToggleTask = (taskId: string) => {
        toggleTask(taskId);
        sound.complete();
        haptic.success();
    };

    // Double-tap detection for jamat prayers
    const lastTapRef = useRef<{ id: string; time: number } | null>(null);
    const DOUBLE_TAP_DELAY = 300; // ms

    const handlePrayerTap = useCallback((prayerId: string) => {
        const now = Date.now();
        const lastTap = lastTapRef.current;

        if (lastTap && lastTap.id === prayerId && now - lastTap.time < DOUBLE_TAP_DELAY) {
            // Double tap detected - mark as jamat
            markPrayer(prayerId, 'jamat');
            sound.jamat();
            haptic.success();
            lastTapRef.current = null;
        } else {
            // Single tap - mark as alone (will upgrade to jamat on double tap)
            lastTapRef.current = { id: prayerId, time: now };
            // Delay the alone marking to allow for double-tap
            setTimeout(() => {
                if (lastTapRef.current?.id === prayerId && lastTapRef.current?.time === now) {
                    markPrayer(prayerId, 'alone');
                    sound.prayer();
                    haptic.tap();
                    lastTapRef.current = null;
                }
            }, DOUBLE_TAP_DELAY);
        }
    }, [markPrayer, sound, haptic]);

    // --- Helper Functions ---
    const getStatusColor = (status: string) => {
        if (status === 'Missed') return 'text-red-400';
        if (status === 'Done') return 'text-emerald-500';
        if (status === 'Next') return 'text-white';
        return 'text-gray-300';
    };

    const getIconBgColor = (color: string) => {
        switch (color) {
            case 'red': return 'bg-red-500/10 text-red-500';
            case 'emerald': return 'bg-emerald-500/10 text-emerald-500';
            case 'gold': return 'bg-yellow-500/10 text-yellow-500';
            case 'primary': return 'bg-emerald-500/20 text-emerald-500';
            default: return 'bg-gray-700/50 text-gray-400';
        }
    };

    return (
        <div className="bg-black text-gray-100 font-sans antialiased min-h-screen pb-24">
            {/* Header */}
            <header className="pt-14 pb-4 px-6 flex justify-between items-center sticky top-0 z-30 bg-black/80 backdrop-blur-md">
                <div className="flex flex-col">
                    <h2 className="text-sm font-medium text-gray-400 font-mono tracking-wide uppercase">
                        {formatDate()}
                    </h2>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { sound.tap(); haptic.tap(); }}
                        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <span className="material-icons-round text-gray-300">notifications</span>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-black"></span>
                    </button>
                    <div
                        onClick={() => { sound.pop(); haptic.tap(); navigate('/profile'); }}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-gray-800 shadow-lg cursor-pointer"
                    ></div>
                </div>
            </header>

            <main className="px-5 space-y-6">
                {/* Daily Progress Section */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="p-6 relative z-10 flex flex-col h-full justify-between gap-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-gray-400 text-sm font-medium mb-1">Daily Progress</h3>
                                <p className="text-emerald-500 font-mono text-xs uppercase tracking-widest">
                                    {progress >= 100 ? 'Completed' : progress > 50 ? 'On Track' : 'Keep Going'}
                                </p>
                            </div>
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <svg className="w-full h-full progress-circle" viewBox="0 0 36 36">
                                    <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                    <path
                                        className="text-emerald-500"
                                        style={{ filter: 'drop-shadow(0 0 10px rgba(16,185,129,0.5))' }}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeDasharray={`${progress}, 100`}
                                        strokeLinecap="round"
                                        strokeWidth="3"
                                    ></path>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-3xl font-bold text-white tracking-tighter">
                                        {progress}<span className="text-sm text-gray-400 font-normal">%</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-2xl font-semibold text-white leading-tight">Keep pushing forward! 💪</p>
                            <p className="text-gray-400 text-sm mt-1">
                                You've completed {completedTasks} of {totalTasks} primary tasks.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Up Next Section */}
                <section>
                    <div className="flex justify-between items-end mb-3 px-1">
                        <h3 className="text-lg font-semibold text-white">Up Next</h3>
                        {timeUntilNextTask && (
                            <span className={`text-xs font-mono ${timeUntilNextTask === 'Now!' ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                                {timeUntilNextTask} {timeUntilNextTask !== 'Now!' && 'Remaining'}
                            </span>
                        )}
                    </div>
                    {nextTask ? (
                        <div className="glass-dark rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden group"
                            style={{ boxShadow: '0 0 20px -5px rgba(239, 68, 68, 0.3)' }}>
                            <div className="absolute left-0 top-0 h-full w-1 bg-red-500" style={{ boxShadow: '0 0 15px rgba(239,68,68,0.6)' }}></div>
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 text-red-500">
                                <span className="material-icons-round text-2xl">alarm</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-base font-semibold text-white leading-snug truncate">{nextTask.title}</h4>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{nextTask.subtitle || `Scheduled for ${nextTask.time}`}</p>
                            </div>
                            <button
                                onClick={() => {
                                    if (nextTask.type === 'workout') {
                                        const workout = availableWorkouts.find(w => w.id === nextTask.meta?.workoutId);
                                        if (workout) {
                                            selectWorkout(workout);
                                            navigate('/workout');
                                        } else {
                                            navigate('/workouts');
                                        }
                                    } else {
                                        handleToggleTask(nextTask.id);
                                    }
                                }}
                                className="w-10 h-10 rounded-full border border-gray-700 hover:bg-emerald-500/20 hover:border-emerald-500 flex items-center justify-center transition-all active:scale-95"
                            >
                                <span className="material-icons-round text-gray-400 group-hover:text-emerald-500">
                                    {nextTask.type === 'workout' ? 'play_arrow' : 'check'}
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="glass-dark rounded-2xl p-5 flex items-center justify-center gap-3 text-emerald-500">
                            <span className="material-icons-round">check_circle</span>
                            <p className="font-medium">All tasks completed!</p>
                        </div>
                    )}
                </section>

                {/* Stats Grid */}
                <section className="grid grid-cols-3 gap-3">
                    {/* Activity */}
                    <div className="glass-dark rounded-2xl p-4 flex flex-col items-center justify-center gap-2 aspect-square relative overflow-hidden">
                        <div className="relative w-12 h-12">
                            <svg className="w-full h-full progress-circle" viewBox="0 0 36 36">
                                <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                <path className="text-rose-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${dailyProgress.activity}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-rose-500">{dailyProgress.activity}%</span>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400">Activity</span>
                    </div>

                    {/* Salah */}
                    <div className="glass-dark rounded-2xl p-4 flex flex-col items-center justify-center gap-2 aspect-square">
                        <div className="relative w-12 h-12">
                            <svg className="w-full h-full progress-circle" viewBox="0 0 36 36">
                                <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                <path className="text-emerald-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${salahProgress}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-emerald-500">{salahProgress}%</span>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400">Salah</span>
                    </div>

                    {/* Deeds/Mindfulness */}
                    <div className="glass-dark rounded-2xl p-4 flex flex-col items-center justify-center gap-2 aspect-square">
                        <div className="relative w-12 h-12">
                            <svg className="w-full h-full progress-circle" viewBox="0 0 36 36">
                                <path className="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                                <path className="text-purple-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${dailyProgress.mindfulness}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-purple-500">{dailyProgress.mindfulness}%</span>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400">Deeds</span>
                    </div>
                </section>

                {/* Prayer Times Section */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-emerald-500 text-lg">mosque</span>
                            <h3 className="text-lg font-semibold text-white">Prayer Times</h3>
                        </div>
                        <span className="text-xs font-mono px-2 py-1 rounded bg-gray-800 text-gray-300">{prayersCompleted}/5</span>
                    </div>
                    <div className="bg-neutral-900 rounded-3xl p-1 overflow-hidden border border-gray-800/50">
                        {prayerTimesWithStatus.map((prayer, index) => (
                            <div key={prayer.id}>
                                <div
                                    onClick={() => handlePrayerTap(prayer.id)}
                                    className={`p-4 rounded-2xl hover:bg-white/5 transition-colors flex items-center justify-between cursor-pointer group ${prayer.active ? 'bg-gray-800/50 border border-gray-700/50 relative overflow-hidden' : ''} ${prayer.color === 'gray' && !prayer.status ? 'opacity-60' : ''}`}
                                >
                                    {prayer.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                                    {prayer.isJamat && <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getIconBgColor(prayer.color)} ${prayer.isJamat ? 'ring-2 ring-yellow-500/50' : ''}`}>
                                            <span className="material-icons-round text-lg">{prayer.icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-medium ${prayer.active ? 'text-white' : 'text-gray-200'}`}>{prayer.name}</h4>
                                                {prayer.isJamat && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-semibold uppercase">Jamat</span>
                                                )}
                                            </div>
                                            <p className={`text-xs ${prayer.active ? 'text-gray-400' : 'text-gray-500'}`}>{prayer.arabic}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <p className={`text-sm font-mono ${getStatusColor(prayer.status)}`}>{prayer.time}</p>
                                            {prayer.status && (
                                                <p className={`text-[10px] uppercase tracking-wide ${prayer.status === 'Missed' ? 'text-red-500/70' :
                                                    prayer.status === 'Done' ? (prayer.isJamat ? 'text-yellow-500' : 'text-emerald-500') :
                                                        'text-gray-400'
                                                    }`}>
                                                    {prayer.status}
                                                </p>
                                            )}
                                        </div>
                                        {prayer.status === 'Done' && (
                                            <span className={`material-icons-round text-lg ${prayer.isJamat ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                                {prayer.isJamat ? 'stars' : 'check_circle'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {index < prayerTimesWithStatus.length - 1 && !prayer.active && !prayerTimesWithStatus[index + 1].active && (
                                    <div className="h-px bg-gray-800 mx-4"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <BottomNavBar />
        </div>
    );
}
