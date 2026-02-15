import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getGlobalHeadcount, recordGlobalLogin, registerGlobalUser } from '../services/headcountApi';

interface StoredUser {
    email: string;
    password: string;
    createdAt: string;
}

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
    login: (email: string, password: string) => AuthResult;
    register: (email: string, password: string) => AuthResult;
    resetPassword: (email: string, newPassword: string) => AuthResult;
    logout: () => void;
}

const USERS_STORAGE_KEY = 'leetcodepro.auth.users';
const SESSION_STORAGE_KEY = 'leetcodepro.auth.currentUser';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const hasWindow = () => typeof window !== 'undefined';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toStoredUser = (rawUser: unknown): { user: StoredUser | null; wasNormalized: boolean } => {
    if (typeof rawUser !== 'object' || rawUser === null) {
        return { user: null, wasNormalized: true };
    }

    const candidate = rawUser as Partial<StoredUser>;
    if (typeof candidate.email !== 'string' || typeof candidate.password !== 'string') {
        return { user: null, wasNormalized: true };
    }

    const normalizedEmail = normalizeEmail(candidate.email);
    const normalizedPassword = candidate.password.trim();
    if (!normalizedEmail || !normalizedPassword) {
        return { user: null, wasNormalized: true };
    }

    const rawCreatedAt = typeof candidate.createdAt === 'string' ? candidate.createdAt.trim() : '';
    const hasCreatedAt = rawCreatedAt.length > 0;
    const normalizedCreatedAt = hasCreatedAt ? rawCreatedAt : new Date().toISOString();
    return {
        user: {
            email: normalizedEmail,
            password: normalizedPassword,
            createdAt: normalizedCreatedAt
        },
        wasNormalized: (
            normalizedEmail !== candidate.email ||
            normalizedPassword !== candidate.password ||
            !hasCreatedAt
        )
    };
};

const parseUsersFromStorage = (): { users: StoredUser[]; didMigrate: boolean } => {
    if (!hasWindow()) return { users: [], didMigrate: false };

    try {
        const rawValue = window.localStorage.getItem(USERS_STORAGE_KEY);
        const parsed: unknown = rawValue ? JSON.parse(rawValue) : [];

        if (!Array.isArray(parsed)) return { users: [], didMigrate: false };

        let didMigrate = false;
        const dedupedUsers = new Map<string, StoredUser>();

        parsed.forEach((rawUser) => {
            const { user, wasNormalized } = toStoredUser(rawUser);
            if (!user) {
                if (wasNormalized) {
                    didMigrate = true;
                }
                return;
            }

            if (wasNormalized || dedupedUsers.has(user.email)) {
                didMigrate = true;
            }

            dedupedUsers.set(user.email, user);
        });

        return { users: Array.from(dedupedUsers.values()), didMigrate };
    } catch {
        return { users: [], didMigrate: false };
    }
};

const readUsersFromStorage = (): StoredUser[] => parseUsersFromStorage().users;

const writeUsersToStorage = (users: StoredUser[]): void => {
    if (!hasWindow()) return;
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const readSessionEmail = (): string | null => {
    if (!hasWindow()) return null;

    const email = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!email) return null;
    return normalizeEmail(email);
};

const writeSessionEmail = (email: string): void => {
    if (!hasWindow()) return;
    window.localStorage.setItem(SESSION_STORAGE_KEY, normalizeEmail(email));
};

const clearSessionEmail = (): void => {
    if (!hasWindow()) return;
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
};

const getInitialUser = (): AuthUser | null => {
    const sessionEmail = readSessionEmail();
    if (!sessionEmail) return null;

    const users = readUsersFromStorage();
    const matchingUser = users.find(user => user.email === sessionEmail);

    return matchingUser ? { email: matchingUser.email } : null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(getInitialUser);
    const [headcount, setHeadcount] = useState<number>(() => readUsersFromStorage().length);

    useEffect(() => {
        const { users, didMigrate } = parseUsersFromStorage();
        if (didMigrate) {
            writeUsersToStorage(users);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const syncHeadcount = async () => {
            const globalCount = await getGlobalHeadcount();
            if (isMounted && globalCount !== null) {
                setHeadcount(globalCount);
            }
        };

        void syncHeadcount();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = (email: string, password: string): AuthResult => {
        const normalizedEmail = normalizeEmail(email);
        const trimmedPassword = password.trim();
        const users = readUsersFromStorage();
        const matchingUser = users.find(existingUser => existingUser.email === normalizedEmail);

        if (!matchingUser) {
            return { success: false, message: 'No account found with this email. Please register first.' };
        }

        if (matchingUser.password !== trimmedPassword) {
            return { success: false, message: 'Incorrect password.' };
        }

        writeSessionEmail(matchingUser.email);
        setUser({ email: matchingUser.email });
        void recordGlobalLogin(matchingUser.email);
        void getGlobalHeadcount().then((globalCount) => {
            if (globalCount !== null) {
                setHeadcount(globalCount);
            }
        });

        return { success: true };
    };

    const register = (email: string, password: string): AuthResult => {
        const normalizedEmail = normalizeEmail(email);
        const trimmedPassword = password.trim();
        const users = readUsersFromStorage();

        if (!normalizedEmail) {
            return { success: false, message: 'Email is required.' };
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return { success: false, message: 'Enter a valid email address.' };
        }

        if (trimmedPassword.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }

        const alreadyExists = users.some(existingUser => existingUser.email === normalizedEmail);
        if (alreadyExists) {
            return { success: false, message: 'Account already exists. Please sign in.' };
        }

        const nextUsers: StoredUser[] = [
            ...users,
            {
                email: normalizedEmail,
                password: trimmedPassword,
                createdAt: new Date().toISOString()
            }
        ];

        writeUsersToStorage(nextUsers);
        writeSessionEmail(normalizedEmail);
        setUser({ email: normalizedEmail });
        setHeadcount(nextUsers.length); // Local fallback while global sync is in flight.

        void registerGlobalUser(normalizedEmail).then((globalCount) => {
            if (globalCount !== null) {
                setHeadcount(globalCount);
            }
        });

        return { success: true };
    };

    const resetPassword = (email: string, newPassword: string): AuthResult => {
        const normalizedEmail = normalizeEmail(email);
        const trimmedPassword = newPassword.trim();
        const users = readUsersFromStorage();

        if (!normalizedEmail) {
            return { success: false, message: 'Email is required.' };
        }

        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return { success: false, message: 'Enter a valid email address.' };
        }

        if (trimmedPassword.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }

        const userIndex = users.findIndex(existingUser => existingUser.email === normalizedEmail);
        if (userIndex < 0) {
            return { success: false, message: 'No account found with this email.' };
        }

        const updatedUsers = [...users];
        updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            password: trimmedPassword
        };
        writeUsersToStorage(updatedUsers);

        return { success: true, message: 'Password reset successful.' };
    };

    const logout = (): void => {
        clearSessionEmail();
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
