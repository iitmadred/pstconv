import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, useAuth } from '../../contexts';

type AuthMode = 'login' | 'signup';

export function LoginScreen() {
    const navigate = useNavigate();
    const { user } = useApp();
    const { signIn, signUp, isAuthenticated, isSupabaseEnabled, loading: authLoading } = useAuth();

    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Redirect authenticated users
    useEffect(() => {
        if (isAuthenticated && user.isOnboarded) {
            navigate('/dashboard');
        } else if (isAuthenticated && !user.isOnboarded) {
            navigate('/onboarding-name');
        }
    }, [isAuthenticated, user.isOnboarded, navigate]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        // Validation for signup
        if (mode === 'signup') {
            if (password.length < 6) {
                setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
                return;
            }
            if (password !== confirmPassword) {
                setMessage({ type: 'error', text: 'Passwords do not match' });
                return;
            }
        }

        setLoading(true);
        setMessage(null);

        if (mode === 'login') {
            const { error } = await signIn(email, password);
            if (error) {
                setMessage({ type: 'error', text: error.message });
            }
        } else {
            const { error } = await signUp(email, password);
            if (error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({ type: 'success', text: 'Account created! Please check your email to confirm.' });
            }
        }
        setLoading(false);
    };

    // Toggle between login and signup
    const toggleMode = () => {
        setMode(mode === 'login' ? 'signup' : 'login');
        setMessage(null);
        setPassword('');
        setConfirmPassword('');
    };

    if (authLoading) {
        return (
            <div className="dark bg-black min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
            </div>
        );
    }

    // If Supabase is not configured, show local-only mode
    if (!isSupabaseEnabled) {
        return (
            <div className="dark bg-[#000000] antialiased min-h-screen text-[#F5F5F7]" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
                    <div className="flex w-full max-w-sm flex-col items-center space-y-10">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                                <span className="material-symbols-outlined text-4xl text-[#F5F5F7]">shield</span>
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F7]">Welcome</h1>
                            <p className="text-[#8A8A8E]">Supabase not configured. Running in local mode.</p>
                        </div>
                        <button
                            onClick={() => navigate(user.isOnboarded ? '/dashboard' : '/onboarding-name')}
                            className="glassmorphic button-glow flex h-14 w-full items-center justify-center rounded-xl bg-white/10 text-base font-bold text-[#F5F5F7] transition-all duration-300 hover:bg-white/20 active:scale-95"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                        >
                            {user.isOnboarded ? 'Continue' : 'Get Started'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dark bg-[#000000] antialiased min-h-screen text-[#F5F5F7]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
                <div className="flex w-full max-w-sm flex-col items-center space-y-8">
                    {/* Header */}
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30">
                            <span className="material-symbols-outlined text-4xl text-emerald-400">shield</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F7]">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-[#8A8A8E]">
                            {mode === 'login' ? 'Sign in to continue' : 'Sign up to get started'}
                        </p>
                    </div>

                    {/* Message Display */}
                    {message && (
                        <div className={`w-full p-4 rounded-xl text-sm ${message.type === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        {/* Email Field */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-[#F5F5F7]" htmlFor="email">Email Address</label>
                            <div className="flex h-14 w-full items-center rounded-xl transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <span className="material-symbols-outlined pl-4 pr-3 text-[#8A8A8E]">mail</span>
                                <input
                                    className="h-full flex-1 border-none bg-transparent p-0 text-[#F5F5F7] placeholder-[#8A8A8E] focus:outline-none focus:ring-0"
                                    id="email"
                                    placeholder="your@email.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-[#F5F5F7]" htmlFor="password">Password</label>
                            <div className="flex h-14 w-full items-center rounded-xl transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                <span className="material-symbols-outlined pl-4 pr-3 text-[#8A8A8E]">lock</span>
                                <input
                                    className="h-full flex-1 border-none bg-transparent p-0 text-[#F5F5F7] placeholder-[#8A8A8E] focus:outline-none focus:ring-0"
                                    id="password"
                                    placeholder="••••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field (Signup only) */}
                        {mode === 'signup' && (
                            <div className="flex flex-col space-y-2">
                                <label className="text-sm font-medium text-[#F5F5F7]" htmlFor="confirmPassword">Confirm Password</label>
                                <div className="flex h-14 w-full items-center rounded-xl transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                    <span className="material-symbols-outlined pl-4 pr-3 text-[#8A8A8E]">lock</span>
                                    <input
                                        className="h-full flex-1 border-none bg-transparent p-0 text-[#F5F5F7] placeholder-[#8A8A8E] focus:outline-none focus:ring-0"
                                        id="confirmPassword"
                                        placeholder="••••••••"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-500/20 text-base font-bold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}
                        >
                            {loading ? (
                                <div className="animate-spin w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full" />
                            ) : (
                                <>
                                    <span className="material-symbols-outlined mr-2">
                                        {mode === 'login' ? 'login' : 'person_add'}
                                    </span>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <p className="text-center text-sm text-[#8A8A8E]">
                        {mode === 'login' ? (
                            <>Don't have an account? <button onClick={toggleMode} className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Sign Up</button></>
                        ) : (
                            <>Already have an account? <button onClick={toggleMode} className="font-bold text-emerald-400 hover:text-emerald-300 transition-colors">Sign In</button></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
