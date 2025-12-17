// ============================================================
// AuthContext - Supabase Authentication State Management
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null; needsConfirmation?: boolean }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: Error | null }>;
    isAuthenticated: boolean;
    isSupabaseEnabled: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes with proper event handling
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
            console.log('Auth event:', event);

            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Handle specific events
            if (event === 'SIGNED_OUT') {
                // Clear any cached data
                setSession(null);
                setUser(null);
            } else if (event === 'TOKEN_REFRESHED') {
                console.log('Token refreshed successfully');
            } else if (event === 'USER_UPDATED') {
                console.log('User profile updated');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sign up with email and password - includes redirect URL
    const signUp = useCallback(async (email: string, password: string) => {
        if (!supabase) {
            return { error: new Error('Supabase not configured'), needsConfirmation: false };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });

        // Check if email confirmation is required
        const needsConfirmation = !!(data?.user && !data?.session);

        return { error: error as Error | null, needsConfirmation };
    }, []);

    // Sign in with email and password
    const signIn = useCallback(async (email: string, password: string) => {
        if (!supabase) {
            return { error: new Error('Supabase not configured') };
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        return { error: error as Error | null };
    }, []);

    // Password reset
    const resetPassword = useCallback(async (email: string) => {
        if (!supabase) {
            return { error: new Error('Supabase not configured') };
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`
        });

        return { error: error as Error | null };
    }, []);

    const signOut = useCallback(async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    }, []);

    const value: AuthContextType = {
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        isAuthenticated: !!session,
        isSupabaseEnabled: isSupabaseConfigured,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
