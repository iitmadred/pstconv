import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavBar } from '../layout';
import { useApp } from '../../contexts';
import type { PrayerStatus } from '../../types';


// --- Helpers ---
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const PRAYER_IDS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export function StatsScreen() {
    const navigate = useNavigate();
    const { daily, history } = useApp();
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

    // Create a Map for O(1) history lookups instead of O(n) find() calls
    const historyMap = useMemo(() => {
        const map = new Map<string, typeof history[0]>();
        history.forEach(record => map.set(record.date, record));
        return map;
    }, [history]);

    // --- Data Processing: Weekly (Last 7 Days) ---
    const weeklyData = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const data: { day: string; date: string; score: number }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1]; // Mon-Sun

            let score = 0;
            const isToday = dateStr === todayStr;

            if (isToday) {
                // Calculate from current daily state
                const prayerCount = daily.prayers.length;
                if (prayerCount >= 5) score += 40;
                else score += prayerCount * 8;

                const tasksDone = daily.tasks.filter(t => t.completed).length;
                const totalTasks = daily.tasks.length || 1;
                score += Math.round((tasksDone / totalTasks) * 30);

                if (daily.protein.goal > 0 && daily.protein.current >= daily.protein.goal) {
                    score += 30;
                } else if (daily.protein.goal > 0) {
                    score += Math.round((daily.protein.current / daily.protein.goal) * 30);
                }
            } else {
                const record = historyMap.get(dateStr);
                if (record) {
                    const prayerCount = record.prayers?.completed?.length ?? 0;
                    if (prayerCount >= 5) score += 40;
                    else score += prayerCount * 8;

                    if (record.workout?.count && record.workout.count > 0) score += 30;
                    if (record.nutrition?.protein && record.nutrition.protein >= 140) score += 30;
                }
            }

            data.push({ day: dayName, date: dateStr, score: Math.min(score, 100) });
        }
        return data;
    }, [daily, historyMap]);

    // --- Data Processing: Monthly Calendar ---
    const { calendarData, monthName } = useMemo(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const todayDate = today.getDate();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const daysInMonth = lastDay.getDate();
        const startDayOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon start

        const days: (null | { day: number; date: string; status: 'perfect' | 'good' | 'rest' | 'none'; isToday: boolean })[] = [];

        // Empty slots for start
        for (let i = 0; i < startDayOffset; i++) days.push(null);

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const isToday = i === todayDate;
            const isFuture = i > todayDate;

            let status: 'perfect' | 'good' | 'rest' | 'none' = 'none';

            if (isFuture) {
                status = 'none';
            } else if (isToday) {
                const hasWorkout = daily.tasks.some(t => t.type === 'workout' && t.completed);
                const allPrayers = daily.prayers.length === 5;
                if (allPrayers && hasWorkout) status = 'perfect';
                else if (allPrayers || hasWorkout) status = 'good';
            } else {
                const record = historyMap.get(dateStr);
                if (record) {
                    const hasWorkout = (record.workout?.count ?? 0) > 0;
                    const allPrayers = (record.prayers?.completed?.length ?? 0) === 5;

                    if (allPrayers && hasWorkout) status = 'perfect';
                    else if (allPrayers || hasWorkout) status = 'good';
                    else status = 'rest';
                }
            }

            days.push({ day: i, date: dateStr, status, isToday });
        }

        return { calendarData: days, monthName: MONTHS[month] };
    }, [daily, historyMap]);

    // --- Data Processing: Salah Grid (Last 7 Days) ---
    const salahHistory = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const data: { day: string; prayers: { id: string; done: boolean; jamat: boolean }[] }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = DAYS[d.getDay() === 0 ? 6 : d.getDay() - 1];

            const isToday = dateStr === todayStr;
            let completedIds: string[] = [];
            const isJamatMap: Record<string, boolean> = {};

            if (isToday) {
                daily.prayers.forEach((p: PrayerStatus) => {
                    completedIds.push(p.id);
                    if (p.type === 'jamat') isJamatMap[p.id] = true;
                });
            } else {
                const record = historyMap.get(dateStr);
                if (record?.prayers?.completed) {
                    record.prayers.completed.forEach((p: PrayerStatus | string) => {
                        if (typeof p === 'string') {
                            completedIds.push(p);
                        } else {
                            completedIds.push(p.id);
                            if (p.type === 'jamat') isJamatMap[p.id] = true;
                        }
                    });
                }
            }

            data.push({
                day: dayName.charAt(0),
                prayers: PRAYER_IDS.map(id => ({
                    id,
                    done: completedIds.includes(id),
                    jamat: !!isJamatMap[id]
                }))
            });
        }
        return data;
    }, [daily.prayers, historyMap]);

    // --- Quick Stats (memoized) ---
    const quickStats = useMemo(() => {
        const todayWorkouts = daily.tasks.filter(t => t.type === 'workout' && t.completed).length;
        const historyWorkouts = history.reduce((acc, h) => acc + (h.workout?.count ?? 0), 0);
        const totalWorkouts = todayWorkouts + historyWorkouts;

        const perfectDays = calendarData.filter(d => d?.status === 'perfect').length;

        // Calculate total prayers this month
        const todayPrayers = daily.prayers.length;
        const historyPrayers = history.reduce((acc, h) => acc + (h.prayers?.completed?.length ?? 0), 0);
        const totalPrayers = todayPrayers + historyPrayers;

        return { totalWorkouts, perfectDays, totalPrayers };
    }, [daily, history, calendarData]);

    return (
        <div className="dark bg-black text-white min-h-screen font-sans pb-24">
            {/* Header */}
            <div className="p-6 pt-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                        Insights
                    </h1>
                    <p className="text-sm text-gray-500">Track your consistency</p>
                </div>
                {/* Period Toggle */}
                <div className="flex bg-white/5 rounded-full p-1 gap-1">
                    <button
                        onClick={() => setSelectedPeriod('week')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedPeriod === 'week' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => setSelectedPeriod('month')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedPeriod === 'month' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                    >
                        Month
                    </button>
                </div>
            </div>

            {/* Deep Analytics Button */}
            <div className="px-5 mb-2">
                <button
                    onClick={() => navigate('/analytics')}
                    className="w-full py-4 rounded-2xl bg-[#1C1C1E] border border-emerald-500/20 shadow-lg flex items-center justify-between px-6 group active:scale-[0.98] transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                            <span className="material-icons-round">insights</span>
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">System Analytics</p>
                            <p className="text-xs text-gray-500">View Radar Chart & Heatmap</p>
                        </div>
                    </div>
                    <span className="material-icons-round text-gray-600 group-hover:text-white transition-colors text-sm">arrow_forward_ios</span>
                </button>
            </div>

            <div className="px-5 space-y-6">

                {/* === 1. Weekly Performance Chart === */}
                {selectedPeriod === 'week' ? (
                    <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-white">Activity Score</h2>
                                <p className="text-xs text-gray-500">Based on Salah, Fitness & Nutrition</p>
                            </div>
                            <div className="text-2xl font-bold text-emerald-500">
                                {weeklyData[weeklyData.length - 1]?.score ?? 0}<span className="text-sm text-emerald-500/50">%</span>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="h-40 flex items-end justify-between gap-2">
                            {weeklyData.map((d, i) => (
                                <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative h-full flex items-end rounded-t-lg bg-white/5 overflow-hidden">
                                        <div
                                            className={`w-full transition-all duration-1000 ease-out rounded-t-lg ${d.score === 100 ? 'bg-gradient-to-t from-emerald-600 to-teal-400' : 'bg-gradient-to-t from-emerald-900/50 to-emerald-600/50'}`}
                                            style={{ height: `${Math.max(d.score, 2)}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium ${i === 6 ? 'text-white' : 'text-gray-600'}`}>
                                        {d.day}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* === 2. Monthly Calendar View === */
                    <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-white">{monthName}</h2>
                            <div className="flex gap-3 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-yellow-500" /> Perfect</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Good</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-center">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                <span key={i} className="text-xs font-bold text-gray-600">{d}</span>
                            ))}

                            {calendarData.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                return (
                                    <div key={day.date} className="flex flex-col items-center justify-center relative h-10">
                                        {day.status === 'perfect' && (
                                            <div className="absolute inset-0 border border-yellow-500/50 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.2)]" />
                                        )}

                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                        ${day.isToday ? 'bg-white text-black font-bold' :
                                                day.status === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    day.status === 'perfect' ? 'text-yellow-400' :
                                                        'text-gray-500'}
                                     `}>
                                            {day.day}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* === 3. Salah Consistency Grid === */}
                <div className="bg-[#1C1C1E] rounded-3xl p-6 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                            <span className="material-icons-round text-teal-400">mosque</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Salah Streak</h2>
                            <p className="text-xs text-gray-500">Last 7 Days</p>
                        </div>
                        <div className="ml-auto text-right">
                            <span className="text-lg font-bold text-emerald-500">{quickStats.totalPrayers}</span>
                            <p className="text-[10px] text-gray-500">Total Prayers</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        {salahHistory.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className="flex flex-col gap-1.5">
                                    {day.prayers.map((p, idx) => (
                                        <div
                                            key={p.id}
                                            title={PRAYER_IDS[idx].charAt(0).toUpperCase() + PRAYER_IDS[idx].slice(1)}
                                            className={`w-3 h-3 rounded-full transition-all ${p.done
                                                ? (p.jamat ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'bg-teal-500')
                                                : 'bg-white/5'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{day.day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Salah Legend */}
                    <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-white/5">
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-teal-500" /> Alone
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <div className="w-2 h-2 rounded-full bg-yellow-400" /> Jamat
                        </span>
                    </div>
                </div>

                {/* === 4. Quick Stats Cards === */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Workouts */}
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-5 border border-indigo-500/20">
                        <span className="material-icons-round text-indigo-400 text-2xl mb-2">fitness_center</span>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            {quickStats.totalWorkouts}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">Total Workouts</p>
                    </div>

                    {/* Perfect Days */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl p-5 border border-yellow-500/20">
                        <span className="material-icons-round text-yellow-400 text-2xl mb-2">emoji_events</span>
                        <h3 className="text-2xl font-bold text-white mb-1">
                            {quickStats.perfectDays}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium">Perfect Days</p>
                    </div>
                </div>

            </div>

            <BottomNavBar />
        </div>
    );
}
