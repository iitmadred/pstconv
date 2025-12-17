// ============================================================
// AuthContext - Supabase Authentication State Management
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
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

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sign up with email and password
    const signUp = useCallback(async (email: string, password: string) => {
        if (!supabase) {
            return { error: new Error('Supabase not configured') };
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        return { error: error as Error | null };
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
