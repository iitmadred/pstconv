import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../contexts';
import { useSound, useHaptic } from '../../hooks';

export function BottomNavBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { updateProtein, markPrayer, daily } = useApp();
    const sound = useSound();
    const haptic = useHaptic();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isActive = (path: string) => location.pathname === path;

    const handleQuickAction = () => {
        sound.pop();
        haptic.tap();
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const handleStartWorkoutNav = () => {
        sound.tap();
        closeMenu();
        navigate('/workouts');
    };

    const handleQuickProtein = () => {
        updateProtein(25);
        sound.drop();
        haptic.success();
        closeMenu();
    };

    const handleQuickPrayer = () => {
        const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const completedIds = daily.prayers.map(p => p.id);
        const nextPrayer = PRAYER_ORDER.find(id => !completedIds.includes(id));

        if (nextPrayer) {
            markPrayer(nextPrayer, 'alone');
            sound.prayer();
            haptic.success();
        } else {
            sound.complete();
        }
        closeMenu();
    };

    const handleAddTask = () => {
        sound.tap();
        closeMenu();
        navigate('/planner?addTask=true');
    };

    return (
        <>
            {/* Backdrop */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
                    onClick={closeMenu}
                />
            )}

            {/* Quick Action Menu */}
            {isMenuOpen && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-slide-up">
                    <button
                        onClick={handleStartWorkoutNav}
                        className="flex items-center gap-3 px-5 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded-full transition-all"
                    >
                        <span className="material-icons-round text-orange-400">fitness_center</span>
                        <span className="text-sm font-medium text-white">Start Workout</span>
                    </button>

                    <button
                        onClick={handleAddTask}
                        className="flex items-center gap-3 px-5 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-full transition-all"
                    >
                        <span className="material-icons-round text-blue-400">add_task</span>
                        <span className="text-sm font-medium text-white">Add Task</span>
                    </button>

                    <button
                        onClick={handleQuickPrayer}
                        className="flex items-center gap-3 px-5 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-full transition-all"
                    >
                        <span className="material-icons-round text-emerald-400">mosque</span>
                        <span className="text-sm font-medium text-white">Quick Prayer</span>
                    </button>

                    <button
                        onClick={handleQuickProtein}
                        className="flex items-center gap-3 px-5 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-full transition-all"
                    >
                        <span className="material-icons-round text-purple-400">egg_alt</span>
                        <span className="text-sm font-medium text-white">+25g Protein</span>
                    </button>
                </div>
            )}

            {/* Navigation Bar */}
            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md nav-glass rounded-full px-2 py-2 flex justify-between items-center z-50 shadow-2xl border border-white/5">
                <button
                    onClick={() => { sound.tap(); navigate('/dashboard'); }}
                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all ${isActive('/dashboard')
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <span className="material-icons-round text-2xl">home</span>
                </button>

                <button
                    onClick={() => { sound.tap(); navigate('/planner'); }}
                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all ${isActive('/planner')
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <span className="material-icons-round text-2xl">calendar_today</span>
                    {!isActive('/planner') && <span className="text-[9px] font-medium mt-0.5">Planner</span>}
                </button>

                {/* FAB - Quick Action Button */}
                <button
                    onClick={handleQuickAction}
                    className={`w-14 h-14 rounded-full flex items-center justify-center -mt-8 shadow-lg transition-all duration-300 ${isMenuOpen
                        ? 'bg-red-500 rotate-45 scale-110'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-105'
                        }`}
                    style={{ boxShadow: isMenuOpen ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 20px rgba(16,185,129,0.4)' }}
                >
                    <span className="material-icons-round text-2xl text-white">add</span>
                </button>

                <button
                    onClick={() => { sound.tap(); navigate('/stats'); }}
                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all ${isActive('/stats')
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <span className="material-icons-round text-2xl">bar_chart</span>
                    {!isActive('/stats') && <span className="text-[9px] font-medium mt-0.5">Stats</span>}
                </button>

                <button
                    onClick={() => { sound.tap(); navigate('/profile'); }}
                    className={`flex flex-col items-center justify-center w-16 h-14 rounded-full transition-all ${isActive('/profile')
                        ? 'bg-primary text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    <span className="material-icons-round text-2xl">person</span>
                    {!isActive('/profile') && <span className="text-[9px] font-medium mt-0.5">Profile</span>}
                </button>
            </nav>
        </>
    );
}
