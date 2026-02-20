const getApiBaseUrl = (): string => {
    const devFallback = import.meta.env.DEV ? 'http://localhost:3001' : '';
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';
    if (!configuredBase) return devFallback;
    return configuredBase.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();
const REQUEST_TIMEOUT_MS = 15000;

const fetchWithTimeout = async (url: string, init?: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

export interface LeetCodeProblemSummary {
    titleSlug: string;
    title: string;
    difficulty: string;
    acRate: number;
    frontendQuestionId: string;
    paidOnly: boolean;
    topicTags: { name: string; slug: string }[];
}

export interface LeetCodeProblemsResponse {
    total: number;
    questions: LeetCodeProblemSummary[];
}

export interface LeetCodeCodeSnippet {
    lang: string;
    langSlug: string;
    code: string;
}

export interface LeetCodeProblemDetail {
    questionId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    content: string;
    acRate: number;
    likes: number;
    dislikes: number;
    topicTags: { name: string; slug: string }[];
    codeSnippets: LeetCodeCodeSnippet[];
    sampleTestCase: string;
    hints: string[];
    exampleTestcaseList: string[];
    brute_time_complexity?: string;
    brute_space_complexity?: string;
    optimized_time_complexity?: string;
    optimized_space_complexity?: string;
    test_cases?: { input: string; expected: string }[];
}

export interface LeetCodeDailyChallenge {
    date: string;
    link: string;
    question: {
        questionId: string;
        title: string;
        titleSlug: string;
        difficulty: string;
        acRate: number;
        topicTags: { name: string; slug: string }[];
        content: string;
        codeSnippets: LeetCodeCodeSnippet[];
        hints: string[];
    };
}

export const fetchProblems = async (params: {
    difficulty?: string;
    tags?: string;
    limit?: number;
    skip?: number;
    category?: string;
} = {}): Promise<LeetCodeProblemsResponse | null> => {
    try {
        const searchParams = new URLSearchParams();
        if (params.difficulty) searchParams.set('difficulty', params.difficulty);
        if (params.tags) searchParams.set('tags', params.tags);
        if (params.limit) searchParams.set('limit', String(params.limit));
        if (params.skip) searchParams.set('skip', String(params.skip));
        if (params.category) searchParams.set('category', params.category);

        const qs = searchParams.toString();
        const url = `${API_BASE_URL}/api/leetcode/problems${qs ? `?${qs}` : ''}`;
        const res = await fetchWithTimeout(url);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

export const fetchProblemDetail = async (slug: string): Promise<LeetCodeProblemDetail | null> => {
    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/leetcode/problem/${slug}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

export const fetchRandomProblem = async (difficulty?: string): Promise<LeetCodeProblemDetail | null> => {
    try {
        const params = difficulty ? `?difficulty=${encodeURIComponent(difficulty)}` : '';
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/leetcode/random${params}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};

export const fetchDailyChallenge = async (): Promise<LeetCodeDailyChallenge | null> => {
    try {
        const res = await fetchWithTimeout(`${API_BASE_URL}/api/leetcode/daily`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
};
