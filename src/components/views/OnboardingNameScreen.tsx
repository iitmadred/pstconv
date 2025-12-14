import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts';

export function OnboardingNameScreen() {
    const navigate = useNavigate();
    const { updateUser } = useApp();
    const [name, setName] = useState('');

    const handleContinue = () => {
        if (name.trim()) {
            updateUser({ name: name.trim() });
            navigate('/onboarding-goals');
        }
    };

    return (
        <div className="dark bg-black min-h-screen text-[#EAEAEA]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
                <div className="flex-1 flex flex-col justify-start pt-16 sm:pt-24 px-6">
                    <div className="flex w-full flex-row items-center justify-center gap-3 py-5">
                        <div className="h-2 w-2 rounded-full bg-[#D4AF37]"></div>
                        <div className="h-2 w-2 rounded-full bg-white/20"></div>
                        <div className="h-2 w-2 rounded-full bg-white/20"></div>
                        <div className="h-2 w-2 rounded-full bg-white/20"></div>
                    </div>
                    <div className="mt-8 text-center">
                        <h1 className="text-[#EAEAEA] tracking-tight text-3xl font-bold leading-tight">Let's get started. What's your name?</h1>
                        <p className="text-[#A9A9A9] text-base font-normal leading-normal pt-2">This will help us personalize your experience.</p>
                    </div>
                    <div className="flex w-full flex-col items-center mt-12">
                        <label className="flex flex-col w-full max-w-sm">
                            <p className="text-[#A9A9A9] text-base font-medium leading-normal pb-2 px-1">First Name</p>
                            <div className="flex w-full flex-1 items-stretch rounded-xl transition-all duration-300" style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <input
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                                    className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#EAEAEA] focus:outline-none focus:ring-0 border-none bg-transparent h-14 placeholder:text-[#A9A9A9] p-4 text-base font-normal leading-normal"
                                    placeholder="Enter your first name"
                                />
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex px-6 pb-8 pt-3">
                    <button
                        onClick={handleContinue}
                        disabled={!name.trim()}
                        className={`flex min-w-[84px] w-full max-w-sm mx-auto cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 flex-1 text-base font-bold leading-normal tracking-[0.015em] transition-all ${name.trim()
                                ? 'bg-[#D4AF37] text-black'
                                : 'bg-[#D4AF37]/50 text-black/50 cursor-not-allowed'
                            }`}
                    >
                        <span className="truncate">Continue</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
