// ============================================================
// AuthCallback - Handle Supabase Auth Redirects
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Verifying your authentication...');

    useEffect(() => {
        const handleCallback = async () => {
            if (!supabase) {
                setStatus('error');
                setMessage('Authentication service not available');
                return;
            }

            try {
                // Check if this is a password recovery
                const type = searchParams.get('type');

                // Get the session from URL hash (Supabase puts tokens there)
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');
                const errorDescription = hashParams.get('error_description');

                // Handle errors from Supabase
                if (errorDescription) {
                    setStatus('error');
                    setMessage(decodeURIComponent(errorDescription));
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                // If we have tokens, set the session
                if (accessToken && refreshToken) {
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (error) {
                        setStatus('error');
                        setMessage(error.message);
                        setTimeout(() => navigate('/'), 3000);
                        return;
                    }

                    setStatus('success');

                    if (type === 'recovery') {
                        setMessage('Password reset successful! Redirecting...');
                        // For password recovery, user should update their password
                        setTimeout(() => navigate('/profile'), 1500);
                    } else {
                        setMessage('Email confirmed! Redirecting...');
                        setTimeout(() => navigate('/onboarding-name'), 1500);
                    }
                } else {
                    // Try to get existing session (might already be handled by Supabase)
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session) {
                        setStatus('success');
                        setMessage('Already authenticated! Redirecting...');
                        setTimeout(() => navigate('/dashboard'), 1500);
                    } else {
                        setStatus('error');
                        setMessage('Invalid or expired link. Please try again.');
                        setTimeout(() => navigate('/'), 3000);
                    }
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                setStatus('error');
                setMessage('An unexpected error occurred');
                setTimeout(() => navigate('/'), 3000);
            }
        };

        handleCallback();
    }, [navigate, searchParams]);

    return (
        <div className="dark bg-black min-h-screen flex items-center justify-center p-4">
            <div className="flex flex-col items-center space-y-6 text-center max-w-sm">
                {/* Status Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${status === 'processing' ? 'bg-blue-500/20' :
                        status === 'success' ? 'bg-emerald-500/20' :
                            'bg-red-500/20'
                    }`}>
                    {status === 'processing' ? (
                        <div className="animate-spin w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full" />
                    ) : status === 'success' ? (
                        <span className="material-symbols-outlined text-3xl text-emerald-400">check_circle</span>
                    ) : (
                        <span className="material-symbols-outlined text-3xl text-red-400">error</span>
                    )}
                </div>

                {/* Status Message */}
                <div>
                    <h1 className={`text-xl font-bold ${status === 'processing' ? 'text-white' :
                            status === 'success' ? 'text-emerald-400' :
                                'text-red-400'
                        }`}>
                        {status === 'processing' ? 'Processing...' :
                            status === 'success' ? 'Success!' :
                                'Error'}
                    </h1>
                    <p className="text-gray-400 mt-2">{message}</p>
                </div>

                {/* Manual redirect link */}
                {status !== 'processing' && (
                    <button
                        onClick={() => navigate('/')}
                        className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        Click here if not redirected automatically
                    </button>
                )}
            </div>
        </div>
    );
}
