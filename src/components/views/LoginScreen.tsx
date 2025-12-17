import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp, useAuth } from '../../contexts';

export function LoginScreen() {
    const navigate = useNavigate();
    const { user } = useApp();
    const { signInWithEmail, isAuthenticated, isSupabaseEnabled, loading: authLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Check URL params for magic link callback
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('token_hash')) {
            // Token is handled by AuthContext, just show loading
            setMessage({ type: 'success', text: 'Verifying your login...' });
        }
    }, []);

    // Redirect authenticated users
    useEffect(() => {
        if (isAuthenticated && user.isOnboarded) {
            navigate('/dashboard');
        } else if (isAuthenticated && !user.isOnboarded) {
            navigate('/onboarding-name');
        }
    }, [isAuthenticated, user.isOnboarded, navigate]);

    // Handle magic link login
    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        setMessage(null);

        const { error } = await signInWithEmail(email);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Check your email for the magic link!' });
        }
        setLoading(false);
    };

    // Local-only mode (when Supabase is not configured)
    const handleLocalLogin = () => {
        if (user.isOnboarded) {
            navigate('/dashboard');
        } else {
            navigate('/onboarding-name');
        }
    };

    if (authLoading) {
        return (
            <div className="dark bg-black min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
            </div>
        );
    }

    return (
        <div className="dark bg-[#000000] antialiased min-h-screen text-[#F5F5F7]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4">
                <div className="flex w-full max-w-sm flex-col items-center space-y-10">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                            <span className="material-symbols-outlined text-4xl text-[#F5F5F7]">shield</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-[#F5F5F7]">
                            {user.isOnboarded ? `Welcome Back, ${user.name}` : 'Welcome'}
                        </h1>
                        <p className="text-[#8A8A8E]">
                            {isSupabaseEnabled
                                ? 'Sign in with your email'
                                : user.isOnboarded ? 'Continue your journey' : 'Get started with Stemmy'}
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

                    <div className="w-full space-y-6">
                        {isSupabaseEnabled ? (
                            /* Supabase Magic Link Login */
                            <form onSubmit={handleMagicLink} className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium text-[#F5F5F7]" htmlFor="email">Email Address</label>
                                    <div className="glassmorphic focus-glow flex h-14 w-full items-center rounded-xl transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <span className="material-symbols-outlined pl-4 pr-3 text-[#8A8A8E]">mail</span>
                                        <input
                                            className="form-input h-full flex-1 border-none bg-transparent p-0 text-[#F5F5F7] placeholder-[#8A8A8E] focus:outline-none focus:ring-0"
                                            id="email"
                                            placeholder="your@email.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="glassmorphic button-glow flex h-14 w-full items-center justify-center rounded-xl bg-emerald-500/20 text-base font-bold text-emerald-400 transition-all duration-300 hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}
                                >
                                    {loading ? (
                                        <div className="animate-spin w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full" />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined mr-2">magic_button</span>
                                            Send Magic Link
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* Local-only mode */
                            <button
                                onClick={handleLocalLogin}
                                className="glassmorphic button-glow flex h-14 w-full items-center justify-center rounded-xl bg-white/10 text-base font-bold text-[#F5F5F7] transition-all duration-300 hover:bg-white/20 active:scale-95"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                            >
                                {user.isOnboarded ? 'Continue' : 'Get Started'}
                            </button>
                        )}
                    </div>

                    {!user.isOnboarded && (
                        <p className="text-center text-sm text-[#8A8A8E]">
                            {isSupabaseEnabled ? (
                                <>No password needed. We'll send you a magic link.</>
                            ) : (
                                <>New here? <Link to="/onboarding-name" className="font-bold text-[#F5F5F7] transition-colors hover:text-white">Sign Up</Link></>
                            )}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

