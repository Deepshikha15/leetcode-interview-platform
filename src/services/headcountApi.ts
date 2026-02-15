const getApiBaseUrl = (): string => {
    const devFallback = import.meta.env.DEV ? 'http://localhost:3001' : '';
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
    if (!configuredBase) return devFallback;
    return configuredBase.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_HEADCOUNT_TIMEOUT_MS ?? 5000);

const getHeadcountUrl = (): string => `${API_BASE_URL}/api/headcount`;
const getRegisterUrl = (): string => `${API_BASE_URL}/api/headcount/register`;
const getRecordLoginUrl = (): string => `${API_BASE_URL}/api/logins/record`;

const fetchWithTimeout = async (url: string, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

const isCountPayload = (value: unknown): value is { headcount: number } => (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { headcount?: unknown }).headcount === 'number'
);

export const getGlobalHeadcount = async (): Promise<number | null> => {
    try {
        const response = await fetchWithTimeout(getHeadcountUrl());
        if (!response.ok) return null;

        const payload: unknown = await response.json();
        if (!isCountPayload(payload)) return null;

        return payload.headcount;
    } catch {
        return null;
    }
};

export const registerGlobalUser = async (email: string): Promise<number | null> => {
    try {
        const response = await fetchWithTimeout(getRegisterUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) return null;

        const payload: unknown = await response.json();
        if (!isCountPayload(payload)) return null;

        return payload.headcount;
    } catch {
        return null;
    }
};

const getDeviceHint = (): string => {
    if (typeof navigator === 'undefined') return '';

    const platform = navigator.platform?.trim() ?? '';
    const language = navigator.language?.trim() ?? '';

    if (!platform && !language) return '';
    return [platform, language].filter(Boolean).join(' | ');
};

export const recordGlobalLogin = async (email: string): Promise<boolean> => {
    try {
        const userAgent = typeof navigator === 'undefined' ? '' : (navigator.userAgent ?? '');
        const device = getDeviceHint();
        const response = await fetchWithTimeout(getRecordLoginUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, userAgent, device })
        });

        return response.ok;
    } catch {
        return false;
    }
};
