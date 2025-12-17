import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavBar } from '../layout';
import { useApp } from '../../contexts';
import { useTheme } from '../../contexts/ThemeContext';
import { useSound } from '../../hooks';

type ModalType = 'none' | 'account' | 'settings' | 'notifications' | 'help' | 'avatar';

const AVATAR_COLORS = [
    { from: '#FF7F50', to: '#FF5F6D' },  // Coral
    { from: '#667eea', to: '#764ba2' },  // Purple
    { from: '#00b09b', to: '#96c93d' },  // Green
    { from: '#00FFFF', to: '#00b09b' },  // Cyan
    { from: '#f093fb', to: '#f5576c' },  // Pink
    { from: '#4facfe', to: '#00f2fe' },  // Blue
    { from: '#fa709a', to: '#fee140' },  // Sunset
    { from: '#a8edea', to: '#fed6e3' },  // Pastel
];

const FAQ_ITEMS = [
    { q: 'How do I add a workout?', a: 'Go to the Planner tab and tap the green + button to add a new activity.' },
    { q: 'How do streaks work?', a: 'Complete at least one workout per day to maintain your streak. Missing a day resets it.' },
    { q: 'Can I change my routine?', a: 'Yes! Go to Account settings and select a different routine option.' },
    { q: 'How do notifications work?', a: 'Enable notifications to get reminders 5 minutes before each task.' },
];

export function ProfileScreen() {
    const navigate = useNavigate();
    const {
        user,
        updateUser,
        stats,
        daily,
        notificationsEnabled,
        voiceEnabled,
        setNotificationsEnabled,
        setVoiceEnabled,
    } = useApp();
    const { theme, toggleTheme } = useTheme();
    const sound = useSound();

    const [activeModal, setActiveModal] = useState<ModalType>('none');
    const [editedUser, setEditedUser] = useState(user);
    const [avatarColor, setAvatarColor] = useLocalStorage('stemmy-avatar-color', AVATAR_COLORS[0]);
    const [reminderTime, setReminderTime] = useLocalStorage('stemmy-reminder-time', 5);
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [soundEnabled, setSoundEnabled] = useState(sound.isSoundEnabled());

    // Daily goals editing
    const [proteinGoal, setProteinGoal] = useState(daily.protein.goal);
    const [waterGoal, setWaterGoal] = useState(daily.hydration.goal);
    const [mindfulnessGoal, setMindfulnessGoal] = useState(daily.mindfulness.goal);

    const modalRef = useRef<HTMLDivElement>(null);

    // Sync edited user when user changes
    useEffect(() => {
        setEditedUser(user);
    }, [user]);

    // Close modal on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setActiveModal('none');
            }
        };
        if (activeModal !== 'none') {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeModal]);

    const showToastMessage = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
    };

    const handleSaveAccount = () => {
        updateUser(editedUser);
        setActiveModal('none');
        showToastMessage('Account updated!');
    };

    const handleSaveSettings = () => {
        // Update daily goals - would need to add this to context
        // For now, just show confirmation
        setActiveModal('none');
        showToastMessage('Settings saved!');
    };

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            // Check if Notification API is supported
            if (!('Notification' in window)) {
                showToastMessage('Notifications not supported on this browser. Try adding to home screen (PWA).');
                return;
            }

            // Check current permission state
            if (Notification.permission === 'denied') {
                showToastMessage('Notifications blocked. Please enable in browser settings.');
                return;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                    showToastMessage('Notifications enabled!');
                    // Send a test notification
                    new Notification('Stemmy', {
                        body: 'Notifications are now active! 🔔',
                        icon: '/icon-192.png'
                    });
                } else if (permission === 'denied') {
                    showToastMessage('Permission denied. Enable in browser settings.');
                } else {
                    showToastMessage('Please allow notifications when prompted.');
                }
            } catch (error) {
                showToastMessage('Could not request permission. Try again.');
            }
        } else {
            setNotificationsEnabled(false);
            showToastMessage('Notifications disabled');
        }
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to log out?')) {
            updateUser({
                name: '',
                email: '',
                goal: 'maintain',
                routine: 'A',
                weight: 70,
                height: 175,
                age: 25,
                isOnboarded: false,
            });
            navigate('/');
        }
    };

    const handleDeleteAccount = () => {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            localStorage.clear();
            navigate('/');
            window.location.reload();
        }
    };

    const goalLabels = {
        'lose': 'Lose Weight',
        'maintain': 'Maintain Weight',
        'gain': 'Gain Muscle',
    };

    const profileOptions = [
        { icon: 'account_circle', text: 'Account', action: () => setActiveModal('account') },
        { icon: 'settings', text: 'Settings', action: () => setActiveModal('settings') },
        { icon: 'notifications', text: 'Notifications', action: () => setActiveModal('notifications') },
        { icon: 'help', text: 'Help Center', action: () => setActiveModal('help') }
    ];

    return (
        <div className="dark bg-black text-white min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="relative flex min-h-screen w-full flex-col overflow-y-auto pb-32">
                {/* Header */}
                <header className="flex items-center justify-between p-4 pt-6">
                    <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
                    <button
                        onClick={() => setActiveModal('account')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-2xl">edit</span>
                    </button>
                </header>

                {/* Avatar Section */}
                <div className="flex flex-col items-center p-4">
                    <div className="relative">
                        <div
                            className="h-28 w-28 rounded-full flex items-center justify-center text-white font-bold text-4xl border-4 border-gray-700 cursor-pointer hover:scale-105 transition-transform"
                            style={{ background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})` }}
                            onClick={() => setActiveModal('avatar')}
                        >
                            {user.name.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <button
                            onClick={() => setActiveModal('avatar')}
                            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 border-2 border-black hover:scale-110 transition-transform"
                        >
                            <span className="material-symbols-outlined text-lg">palette</span>
                        </button>
                    </div>

                    <h2 className="mt-4 text-2xl font-bold">{user.name || 'User'}</h2>
                    <p className="text-[#FF7F50]">{goalLabels[user.goal]}</p>
                    <p className="text-gray-500 text-sm">Routine {user.routine}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 p-4 text-center">
                    <div className="rounded-2xl bg-[#1C1C1E] p-4 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setActiveModal('account')}>
                        <p className="text-2xl font-bold">{user.weight}<span className="text-base font-normal text-gray-400">kg</span></p>
                        <p className="text-sm text-gray-400">Weight</p>
                    </div>
                    <div className="rounded-2xl bg-[#1C1C1E] p-4 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setActiveModal('account')}>
                        <p className="text-2xl font-bold">{user.height}<span className="text-base font-normal text-gray-400">cm</span></p>
                        <p className="text-sm text-gray-400">Height</p>
                    </div>
                    <div className="rounded-2xl bg-[#1C1C1E] p-4 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setActiveModal('account')}>
                        <p className="text-2xl font-bold">{user.age}<span className="text-base font-normal text-gray-400">yrs</span></p>
                        <p className="text-sm text-gray-400">Age</p>
                    </div>
                </div>

                {/* Workout Stats */}
                <div className="px-4 mb-4">
                    <div className="rounded-2xl bg-[#1C1C1E] p-4">
                        <h3 className="text-lg font-bold mb-3">Your Journey</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-[#FF7F50]">{stats.totalWorkouts}</p>
                                <p className="text-xs text-gray-400">Workouts</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#00FFFF]">{stats.streak}</p>
                                <p className="text-xs text-gray-400">Day Streak</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[#2bee79]">{Math.floor(stats.totalTime / 60)}</p>
                                <p className="text-xs text-gray-400">Total Mins</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu Options */}
                <div className="flex flex-col gap-3 px-4 mt-2">
                    {profileOptions.map(item => (
                        <button
                            key={item.text}
                            onClick={item.action}
                            className="flex items-center justify-between rounded-2xl bg-[#1C1C1E] p-4 active:bg-white/10 hover:bg-white/5 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-gray-400">{item.icon}</span>
                                <span className="font-semibold">{item.text}</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                        </button>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-between rounded-2xl bg-[#1C1C1E] p-4 mt-4 w-full active:bg-white/10 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-red-500">logout</span>
                            <span className="font-semibold text-red-500">Log Out</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in">
                    <div className="bg-[#2bee79] text-black px-6 py-3 rounded-full font-semibold shadow-lg">
                        {toastMessage}
                    </div>
                </div>
            )}

            {/* ==================== MODALS ==================== */}

            {/* Avatar Color Picker Modal */}
            {activeModal === 'avatar' && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
                    <div ref={modalRef} className="w-full max-w-md bg-[#1C1C1E] rounded-3xl p-6 animate-slide-up-fade">
                        <h2 className="text-xl font-bold mb-4">Choose Avatar Color</h2>
                        <div className="grid grid-cols-4 gap-4">
                            {AVATAR_COLORS.map((color, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setAvatarColor(color);
                                        setActiveModal('none');
                                        showToastMessage('Avatar updated!');
                                    }}
                                    className={`h-16 w-16 rounded-full border-4 transition-transform hover:scale-110 ${avatarColor.from === color.from ? 'border-white scale-110' : 'border-transparent'
                                        }`}
                                    style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={() => setActiveModal('none')}
                            className="w-full mt-6 py-3 rounded-xl bg-white/10 font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Account Modal */}
            {activeModal === 'account' && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
                    <div ref={modalRef} className="w-full max-w-md bg-[#1C1C1E] rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up-fade">
                        <h2 className="text-xl font-bold mb-4">Account Settings</h2>

                        {/* Name */}
                        <div className="mb-4">
                            <label className="text-sm text-gray-400 block mb-2">Name</label>
                            <input
                                value={editedUser.name}
                                onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                                placeholder="Your name"
                            />
                        </div>

                        {/* Email */}
                        <div className="mb-4">
                            <label className="text-sm text-gray-400 block mb-2">Email</label>
                            <input
                                type="email"
                                value={editedUser.email}
                                onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full bg-white/10 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#FF7F50]"
                                placeholder="your@email.com"
                            />
                        </div>

                        {/* Goal */}
                        <div className="mb-4">
                            <label className="text-sm text-gray-400 block mb-2">Fitness Goal</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(['lose', 'maintain', 'gain'] as const).map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => setEditedUser(prev => ({ ...prev, goal }))}
                                        className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${editedUser.goal === goal
                                            ? 'bg-[#FF7F50] text-black'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {goal === 'lose' ? 'Lose' : goal === 'maintain' ? 'Maintain' : 'Gain'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Routine */}
                        <div className="mb-4">
                            <label className="text-sm text-gray-400 block mb-2">Workout Routine</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['A', 'B'] as const).map(routine => (
                                    <button
                                        key={routine}
                                        onClick={() => setEditedUser(prev => ({ ...prev, routine }))}
                                        className={`py-2 px-3 rounded-xl text-sm font-semibold transition-all ${editedUser.routine === routine
                                            ? 'bg-[#00FFFF] text-black'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        Routine {routine}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Body Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Weight (kg)</label>
                                <input
                                    type="number"
                                    value={editedUser.weight}
                                    onChange={(e) => setEditedUser(prev => ({ ...prev, weight: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white/10 rounded-xl p-2 text-center focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Height (cm)</label>
                                <input
                                    type="number"
                                    value={editedUser.height}
                                    onChange={(e) => setEditedUser(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white/10 rounded-xl p-2 text-center focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Age</label>
                                <input
                                    type="number"
                                    value={editedUser.age}
                                    onChange={(e) => setEditedUser(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                                    className="w-full bg-white/10 rounded-xl p-2 text-center focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <button
                            onClick={handleSaveAccount}
                            className="w-full py-3 rounded-xl bg-[#2bee79] text-black font-bold mb-3"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => setActiveModal('none')}
                            className="w-full py-3 rounded-xl bg-white/10 font-semibold mb-3"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full py-3 rounded-xl text-red-500 font-semibold"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {activeModal === 'settings' && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
                    <div ref={modalRef} className="w-full max-w-md bg-[#1C1C1E] rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up-fade">
                        <h2 className="text-xl font-bold mb-4">Settings</h2>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-yellow-400">
                                    {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                </span>
                                <span>Dark Mode</span>
                            </div>
                            <button
                                onClick={toggleTheme}
                                className={`w-12 h-7 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-[#2bee79]' : 'bg-gray-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Sound Effects Toggle */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-4">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#00FFFF]">volume_up</span>
                                <div>
                                    <span>Sound Effects</span>
                                    <p className="text-xs text-gray-400">Water drop & chime sounds</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    const newState = !soundEnabled;
                                    setSoundEnabled(newState);
                                    sound.toggleSounds(newState);
                                    if (newState) sound.drop();
                                }}
                                className={`w-12 h-7 rounded-full p-1 transition-colors ${soundEnabled ? 'bg-[#2bee79]' : 'bg-gray-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>
                        <h3 className="text-sm text-gray-400 mb-3 mt-6">Daily Goals</h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#FF5F6D]">egg_alt</span>
                                    <span>Protein Target</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setProteinGoal(prev => Math.max(50, prev - 10))}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                    >-</button>
                                    <span className="w-16 text-center font-bold">{proteinGoal}g</span>
                                    <button
                                        onClick={() => setProteinGoal(prev => Math.min(300, prev + 10))}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#00FFFF]">water_drop</span>
                                    <span>Water Target</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setWaterGoal(prev => Math.max(4, prev - 1))}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                    >-</button>
                                    <span className="w-16 text-center font-bold">{waterGoal} 🥛</span>
                                    <button
                                        onClick={() => setWaterGoal(prev => Math.min(16, prev + 1))}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                    >+</button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[#ee9d2b]">self_improvement</span>
                                    <span>Mindfulness</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setMindfulnessGoal(prev => Math.max(5, prev - 5))}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                    >-</button>
                                    <span className="w-16 text-center font-bold">{mindfulnessGoal}m</span>
                                    <button
                                        onClick={() => setMindfulnessGoal(prev => Math.min(60, prev + 5))}
                                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
                                    >+</button>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveSettings}
                            className="w-full mt-6 py-3 rounded-xl bg-[#2bee79] text-black font-bold"
                        >
                            Save Settings
                        </button>
                        <button
                            onClick={() => setActiveModal('none')}
                            className="w-full mt-3 py-3 rounded-xl bg-white/10 font-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {activeModal === 'notifications' && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
                    <div ref={modalRef} className="w-full max-w-md bg-[#1C1C1E] rounded-3xl p-6 animate-slide-up-fade">
                        <h2 className="text-xl font-bold mb-4">Notifications</h2>

                        {/* Browser Notifications */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#2bee79]">notifications_active</span>
                                <div>
                                    <span className="block">Push Notifications</span>
                                    <span className="text-xs text-gray-400">Get reminders before tasks</span>
                                </div>
                            </div>
                            <button
                                onClick={handleNotificationToggle}
                                className={`w-12 h-7 rounded-full p-1 transition-colors ${notificationsEnabled ? 'bg-[#2bee79]' : 'bg-gray-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Voice Announcements */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-3">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#00FFFF]">record_voice_over</span>
                                <div>
                                    <span className="block">Voice Announcements</span>
                                    <span className="text-xs text-gray-400">Speak reminder aloud</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setVoiceEnabled(!voiceEnabled)}
                                className={`w-12 h-7 rounded-full p-1 transition-colors ${voiceEnabled ? 'bg-[#2bee79]' : 'bg-gray-600'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${voiceEnabled ? 'translate-x-5' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {/* Reminder Time */}
                        <div className="p-4 bg-white/5 rounded-xl mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="material-symbols-outlined text-[#FF7F50]">schedule</span>
                                <span>Remind me before</span>
                            </div>
                            <div className="flex gap-2">
                                {[5, 10, 15, 30].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => setReminderTime(mins)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${reminderTime === mins
                                            ? 'bg-[#FF7F50] text-black'
                                            : 'bg-white/10 hover:bg-white/20'
                                            }`}
                                    >
                                        {mins}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setActiveModal('none');
                                showToastMessage('Notification settings saved!');
                            }}
                            className="w-full py-3 rounded-xl bg-[#2bee79] text-black font-bold"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Help Center Modal */}
            {activeModal === 'help' && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 animate-fade-in">
                    <div ref={modalRef} className="w-full max-w-md bg-[#1C1C1E] rounded-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up-fade">
                        <h2 className="text-xl font-bold mb-4">Help Center</h2>

                        <div className="space-y-2">
                            {FAQ_ITEMS.map((item, idx) => (
                                <div key={idx} className="bg-white/5 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                                        className="w-full p-4 flex items-center justify-between text-left"
                                    >
                                        <span className="font-semibold">{item.q}</span>
                                        <span className={`material-symbols-outlined transition-transform ${expandedFaq === idx ? 'rotate-180' : ''
                                            }`}>expand_more</span>
                                    </button>
                                    {expandedFaq === idx && (
                                        <div className="px-4 pb-4 text-gray-400 text-sm animate-fade-in">
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-white/5 rounded-xl text-center">
                            <p className="text-gray-400 text-sm mb-2">Need more help?</p>
                            <button className="text-[#00FFFF] font-semibold">Contact Support</button>
                        </div>

                        <button
                            onClick={() => setActiveModal('none')}
                            className="w-full mt-4 py-3 rounded-xl bg-white/10 font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <BottomNavBar />
        </div>
    );
}

// Simple localStorage hook for settings
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
    };

    return [storedValue, setValue];
}
