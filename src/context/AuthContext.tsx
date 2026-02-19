import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getGlobalHeadcount } from '../services/headcountApi';
import { User } from '@supabase/supabase-js';

interface AuthUser {
    email: string;
}

interface AuthResult {
    success: boolean;
    message?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    headcount: number;
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (email: string, password: string) => Promise<AuthResult>;
    resetPassword: (email: string) => Promise<AuthResult>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [headcount, setHeadcount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial session check
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser({ email: session.user.email || '' });
            }
            setLoading(false);
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({ email: session.user.email || '' });
            } else {
                setUser(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncHeadcount = async () => {
            const globalCount = await getGlobalHeadcount();
            if (isMounted && globalCount !== null) {
                setHeadcount(globalCount);
            }
        };

        // Initial sync
        void syncHeadcount();

        // Periodic sync every 60 seconds for global accuracy across devices
        const interval = setInterval(syncHeadcount, 60000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { success: false, message: error.message };
            }

            // Immediately refresh headcount after login
            void getGlobalHeadcount().then((count) => {
                if (count !== null) setHeadcount(count);
            });

            return { success: true };
        } catch (error: any) {
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const register = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                return { success: false, message: error.message };
            }

            // Immediately refresh headcount after registration
            void getGlobalHeadcount().then((count) => {
                if (count !== null) setHeadcount(count);
            });

            return { success: true, message: 'Check your email for the confirmation link!' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Registration failed' };
        }
    };

    const resetPassword = async (email: string): Promise<AuthResult> => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) return { success: false, message: error.message };
            return { success: true, message: 'Password reset link sent to your email.' };
        } catch (error: any) {
            return { success: false, message: error.message || 'Reset failed' };
        }
    };

    const logout = async (): Promise<void> => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated: Boolean(user),
        headcount,
        login,
        register,
        resetPassword,
        logout
    }), [headcount, user]);

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider.');
    }

    return context;
};
