import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts';

export function OnboardingGoalsScreen() {
    const navigate = useNavigate();
    const { user, updateUser } = useApp();
    const [selectedGoal, setSelectedGoal] = useState<'lose' | 'maintain' | 'gain'>(user.goal);
    const [selectedRoutine, setSelectedRoutine] = useState<'A' | 'B'>(user.routine);

    const goals = [
        { id: 'lose', label: 'Lose Weight', icon: 'trending_down' },
        { id: 'maintain', label: 'Maintain Weight', icon: 'horizontal_rule' },
        { id: 'gain', label: 'Gain Muscle', icon: 'trending_up' },
    ] as const;

    const glassmorphism = { background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' };
    const glassmorphismActive = { background: 'rgba(255, 127, 80, 0.2)', backdropFilter: 'blur(12px)', border: '1px solid #FF7F50' };

    const handleContinue = () => {
        updateUser({
            goal: selectedGoal,
            routine: selectedRoutine,
            isOnboarded: true
        });
        navigate('/dashboard');
    };

    return (
        <div className="dark bg-black text-[#F5F5F5] min-h-screen" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            <div className="relative flex min-h-screen w-full flex-col">
                <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
                    <div className="flex items-center p-4">
                        <Link to="/onboarding-name" className="flex size-11 shrink-0 items-center justify-center">
                            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                        </Link>
                        <div className="flex-1 text-center">
                            <span className="text-sm text-gray-400">Hi, {user.name}!</span>
                        </div>
                        <div className="w-11"></div>
                    </div>
                    <div className="flex w-full flex-row items-center justify-center gap-2 px-4 pb-4">
                        <div className="h-1 flex-1 rounded-full bg-[#FF7F50]"></div>
                        <div className="h-1 flex-1 rounded-full bg-[#FF7F50]"></div>
                        <div className="h-1 flex-1 rounded-full bg-[#FF7F50]/30"></div>
                        <div className="h-1 flex-1 rounded-full bg-[#FF7F50]/30"></div>
                    </div>
                </div>
                <div className="flex flex-1 flex-col px-4">
                    <h1 className="text-[#F5F5F5] tracking-tight text-[32px] font-bold leading-tight pt-2">What's Your Primary Goal?</h1>
                    <div className="pt-8">
                        <h3 className="text-[#F5F5F5] text-lg font-bold leading-tight tracking-[-0.015em] pb-3">Select your weight goal</h3>
                        <div className="flex flex-col gap-3">
                            {goals.map((goal) => (
                                <div
                                    key={goal.id}
                                    onClick={() => setSelectedGoal(goal.id)}
                                    style={selectedGoal === goal.id ? glassmorphismActive : glassmorphism}
                                    className="flex h-[72px] items-center gap-4 rounded-xl p-4 cursor-pointer transition-all"
                                >
                                    <span className={`material-symbols-outlined text-3xl ${selectedGoal === goal.id ? 'text-[#FF7F50]' : 'text-white'}`}>
                                        {goal.icon}
                                    </span>
                                    <p className="text-base font-medium leading-normal text-white">{goal.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-8 pb-32">
                        <h3 className="text-[#F5F5F5] text-lg font-bold leading-tight tracking-[-0.015em] pb-3">Choose your starting routine</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div
                                onClick={() => setSelectedRoutine('A')}
                                className="flex cursor-pointer flex-col gap-3 rounded-xl p-4 transition-all"
                                style={selectedRoutine === 'A' ? glassmorphismActive : glassmorphism}
                            >
                                <div className="flex flex-col gap-2">
                                    <h4 className={`text-base font-bold ${selectedRoutine === 'A' ? 'text-[#FF7F50]' : 'text-white'}`}>Routine A</h4>
                                    <p className="text-sm font-normal text-white/70">Push Day Focus</p>
                                </div>
                            </div>
                            <div
                                onClick={() => setSelectedRoutine('B')}
                                className="flex cursor-pointer flex-col gap-3 rounded-xl p-4 transition-all"
                                style={selectedRoutine === 'B' ? glassmorphismActive : glassmorphism}
                            >
                                <div className="flex flex-col gap-2">
                                    <h4 className={`text-base font-bold ${selectedRoutine === 'B' ? 'text-[#FF7F50]' : 'text-white'}`}>Routine B</h4>
                                    <p className="text-sm font-normal text-white/70">Pull Day Focus</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-black to-transparent p-4 pb-6">
                    <button
                        onClick={handleContinue}
                        className="flex h-14 w-full items-center justify-center rounded-xl bg-[#FF7F50] text-center text-base font-bold text-black transition-all hover:bg-[#FF7F50]/90 active:scale-[0.98]"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
