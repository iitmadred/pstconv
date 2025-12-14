import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../contexts';

export function LoginScreen() {
    const navigate = useNavigate();
    const { user } = useApp();

    // If already onboarded, redirect to dashboard
    const handleLogin = () => {
        if (user.isOnboarded) {
            navigate('/dashboard');
        } else {
            navigate('/onboarding-name');
        }
    };

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
                            {user.isOnboarded ? 'Continue your journey' : 'Log in to your Stemmy'}
                        </p>
                    </div>
                    <div className="w-full space-y-6">
                        {!user.isOnboarded && (
                            <>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium text-[#F5F5F7]" htmlFor="email">Email Address</label>
                                    <div className="glassmorphic focus-glow flex h-14 w-full items-center rounded-xl transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <span className="material-symbols-outlined pl-4 pr-3 text-[#8A8A8E]">mail</span>
                                        <input className="form-input h-full flex-1 border-none bg-transparent p-0 text-[#F5F5F7] placeholder-[#8A8A8E] focus:outline-none focus:ring-0" id="email" placeholder="your@email.com" type="email" />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-medium text-[#F5F5F7]" htmlFor="password">Password</label>
                                    <div className="glassmorphic focus-glow flex h-14 w-full items-center rounded-xl transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <span className="material-symbols-outlined pl-4 pr-3 text-[#8A8A8E]">lock</span>
                                        <input className="form-input h-full flex-1 border-none bg-transparent p-0 text-[#F5F5F7] placeholder-[#8A8A8E] focus:outline-none focus:ring-0" id="password" placeholder="••••••••" type="password" />
                                        <button aria-label="Toggle password visibility" className="flex h-full items-center justify-center px-4 text-[#8A8A8E]">
                                            <span className="material-symbols-outlined">visibility_off</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <a className="text-sm font-medium text-[#8A8A8E] transition-colors hover:text-[#F5F5F7]" href="#">Forgot Password?</a>
                                </div>
                            </>
                        )}
                        <button onClick={handleLogin} className="glassmorphic button-glow flex h-14 w-full items-center justify-center rounded-xl bg-white/10 text-base font-bold text-[#F5F5F7] transition-all duration-300 hover:bg-white/20 active:scale-95" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            {user.isOnboarded ? 'Continue' : 'Log In'}
                        </button>
                    </div>
                    {!user.isOnboarded && (
                        <>
                            <div className="flex w-full items-center gap-4">
                                <div className="h-px flex-1 bg-white/10"></div>
                                <span className="text-sm text-[#8A8A8E]">OR</span>
                                <div className="h-px flex-1 bg-white/10"></div>
                            </div>
                            <button className="glassmorphic flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-white/5 text-base font-medium text-[#F5F5F7] transition-all duration-300 hover:bg-white/10 active:scale-95" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.5714 12.2727C22.5714 11.4545 22.5 10.6364 22.3571 9.81818H12V14.4545H18.0714C17.7857 16.0909 16.7143 17.5455 15.0714 18.5455V21.1818H18.8571C21.0714 19.1818 22.5714 16.0 22.5714 12.2727Z" fill="#4285F4"></path><path d="M12 23C14.9286 23 17.4286 22.0909 19.3571 20.2727L15.5714 17.6364C14.5714 18.3636 13.3571 18.8182 12 18.8182C9.42857 18.8182 7.21429 17.1818 6.35714 15H2.42857V17.7273C4.35714 20.8182 7.92857 23 12 23Z" fill="#34A853"></path><path d="M6.35714 15C6.14286 14.3636 6 13.6364 6 13C6 12.3636 6.14286 11.6364 6.35714 11V8.27273H2.42857C1.5 10 1 11.5 1 13C1 14.5 1.5 16 2.42857 17.7273L6.35714 15Z" fill="#FBBC05"></path><path d="M12 7.18182C13.5714 7.18182 14.9286 7.63636 16.0714 8.63636L19.4286 5.27273C17.4286 3.36364 14.9286 2 12 2C7.92857 2 4.35714 4.18182 2.42857 7.27273L6.35714 10C7.21429 7.81818 9.42857 6.18182 12 6.18182V7.18182Z" fill="#EA4335"></path></svg>
                                Continue with Google
                            </button>
                            <p className="text-center text-sm text-[#8A8A8E]">
                                Don't have an account? <Link to="/onboarding-name" className="font-bold text-[#F5F5F7] transition-colors hover:text-white">Sign Up</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
