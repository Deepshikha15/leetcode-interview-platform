import { createServer } from 'http';
import { LeetCode } from 'leetcode-query';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const DEFAULT_ENV_FILE_PATH = path.resolve(process.cwd(), '.env');

const stripWrappingQuotes = (value) => {
    if (value.length < 2) return value;
    const firstChar = value[0];
    const lastChar = value[value.length - 1];
    if ((firstChar === '"' && lastChar === '"') || (firstChar === '\'' && lastChar === '\'')) {
        return value.slice(1, -1);
    }
    return value;
};

const loadEnvFromFile = () => {
    const explicitFilePath = process.env.ENV_FILE_PATH?.trim();
    const envFilePath = explicitFilePath || DEFAULT_ENV_FILE_PATH;
    if (!existsSync(envFilePath)) {
        return;
    }

    const fileContent = readFileSync(envFilePath, 'utf-8');
    const lines = fileContent.split(/\r?\n/);

    lines.forEach((rawLine) => {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) return;

        const normalizedLine = line.startsWith('export ') ? line.slice(7).trim() : line;
        const separatorIndex = normalizedLine.indexOf('=');
        if (separatorIndex <= 0) return;

        const key = normalizedLine.slice(0, separatorIndex).trim();
        if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;
        if (typeof process.env[key] === 'string') return;

        const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
        process.env[key] = stripWrappingQuotes(rawValue);
    });
};

loadEnvFromFile();

// --- Better Stack: send logs directly (HTTP API). Set BETTERSTACK_SOURCE_TOKEN to enable.
const BETTERSTACK_TOKEN = process.env.BETTERSTACK_SOURCE_TOKEN?.trim();
// Ingest host from your Better Stack source (HTTPS, no port). Override with BETTERSTACK_INGEST_URL.
const BETTERSTACK_URL = (process.env.BETTERSTACK_INGEST_URL?.trim() || 'https://s1748369.eu-fsn-3.betterstackdata.com').replace(/\/+$/, '');

function sendToBetterStack(message) {
    if (!BETTERSTACK_TOKEN || !message) return;
    const body = JSON.stringify({ message: String(message).slice(0, 10000), dt: new Date().toISOString() });
    fetch(BETTERSTACK_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${BETTERSTACK_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body
    }).catch(() => { /* fire-and-forget */ });
}

const log = (...args) => {
    const line = '[SERVER] ' + args.map(a => (a instanceof Error ? a.message : (typeof a === 'object' && a !== null ? JSON.stringify(a) : String(a)))).join(' ');
    process.stderr.write(line + '\n');
    sendToBetterStack(line);
};

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST?.trim() || '0.0.0.0';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

if (!existsSync(DIST_DIR)) {
    log('WARN: DIST_DIR not found', DIST_DIR);
}

log('--- Config --- PORT:', PORT, 'HOST:', HOST, 'DIST:', DIST_DIR);
log('Supabase URL:', !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL), 'ServiceKey:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

try {
    if (existsSync(DIST_DIR)) {
        const files = await fs.readdir(DIST_DIR);
        log('DIST files:', files.length, files.slice(0, 5).join(', '));
    } else {
        log('DIST folder does NOT exist');
    }
} catch (e) {
    log('DIST read error:', e.message);
}
log('--- Ready ---');

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};


const sendJson = (res, statusCode, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(body);
};

const sendText = (res, statusCode, payload) => {
    res.writeHead(statusCode, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
    });
    res.end(payload);
};


const leetcodeClient = new LeetCode();

// Initialize Supabase admin client for caching
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

if (!supabaseAdmin) {
    log('[SUPABASE] Admin NOT initialized. Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY');
} else {
    log('[SUPABASE] Admin initialized');
}

const syncToCache = async (problem) => {
    if (!supabaseAdmin || !problem || !problem.titleSlug) return;

    try {
        const { error } = await supabaseAdmin
            .from('leetcode_problems')
            .upsert({
                title_slug: problem.titleSlug,
                title: problem.title,
                content: problem.content,
                difficulty: problem.difficulty,
                topic_tags: problem.topicTags || [],
                code_snippets: problem.codeSnippets || [],
                sample_test_case: problem.sampleTestCase,
                hints: problem.hints || [],
                example_testcase_list: problem.exampleTestcaseList || [],
                last_synced_at: new Date().toISOString()
            }, { onConflict: 'title_slug' });

        if (error) {
            log('[CACHE] Sync failed', problem.titleSlug, error.message);
        } else {
            log('[CACHE] Synced', problem.titleSlug);
        }
    } catch (e) {
        log('[CACHE] Sync error', problem.titleSlug, e.message);
    }
};

const handleLeetcodeApi = async (req, res, rawPathname) => {
    // Standardize pathname: remove trailing slash and convert to lowercase for matching
    const pathname = rawPathname.toLowerCase().replace(/\/+$/, '') || '/';
    const method = req.method.toUpperCase();

    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return true;
    }

    if (pathname === '/api/leetcode/problems' && method === 'GET') {
        try {
            const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost';
            const url = new URL(req.url ?? '/', origin);
            const difficulty = url.searchParams.get('difficulty') || undefined;
            const tags = url.searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
            const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
            const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0);
            const category = url.searchParams.get('category') || '';

            const problems = await leetcodeClient.problems({
                limit,
                offset: skip,
                filters: {
                    ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {}),
                    ...(tags ? { tags } : {}),
                    ...(category ? { searchKeywords: category } : {})
                }
            });

            sendJson(res, 200, {
                total: problems.total,
                questions: problems.questions.map(q => ({
                    titleSlug: q.titleSlug,
                    title: q.title,
                    difficulty: q.difficulty,
                    acRate: q.acRate,
                    frontendQuestionId: q.frontendQuestionId,
                    paidOnly: q.paidOnly,
                    topicTags: q.topicTags
                }))
            });
            return true;
        } catch (error) {
            log('[LEETCODE] /problems error:', error.message || error);
            sendJson(res, 500, { error: 'Failed to fetch LeetCode problems.' });
            return true;
        }
    }

    const problemMatch = pathname.match(/^\/api\/leetcode\/problem\/([a-z0-9-]+)$/);
    if (problemMatch && method === 'GET') {
        const slug = problemMatch[1];
        try {
            // 1. Try Cache First
            if (supabaseAdmin) {
                const { data: cached, error: cacheErr } = await supabaseAdmin
                    .from('leetcode_problems')
                    .select('*')
                    .eq('title_slug', slug)
                    .single();

                if (cacheErr && cacheErr.code !== 'PGRST116') {
                    log('[CACHE] Lookup error', slug, cacheErr.message);
                }

                if (cached) {
                    log('[CACHE] Hit', slug);
                    sendJson(res, 200, {
                        questionId: slug,
                        title: cached.title,
                        titleSlug: cached.title_slug,
                        difficulty: cached.difficulty,
                        content: cached.content,
                        topicTags: cached.topic_tags,
                        codeSnippets: cached.code_snippets,
                        sampleTestCase: cached.sample_test_case,
                        hints: cached.hints,
                        exampleTestcaseList: cached.example_testcase_list
                    });
                    return true;
                }
            }

            // 2. Fetch from LeetCode
            const problem = await leetcodeClient.problem(slug);

            if (!problem || !problem.title) {
                log('[LEETCODE] /problem not found', slug);
                sendJson(res, 404, { error: 'Problem not found.' });
                return true;
            }

            log('[LEETCODE] /problem got', slug, 'syncing cache');
            await syncToCache(problem);

            sendJson(res, 200, {
                questionId: problem.questionId,
                title: problem.title,
                titleSlug: problem.titleSlug,
                difficulty: problem.difficulty,
                content: problem.content,
                acRate: problem.acRate,
                likes: problem.likes,
                dislikes: problem.dislikes,
                topicTags: problem.topicTags,
                codeSnippets: problem.codeSnippets,
                sampleTestCase: problem.sampleTestCase,
                hints: problem.hints,
                exampleTestcaseList: problem.exampleTestcaseList
            });
            return true;
        } catch (error) {
            log('[LEETCODE] /problem error:', error.message || error);
            sendJson(res, 500, { error: 'Failed to fetch problem detail.' });
            return true;
        }
    }

    if (pathname === '/api/leetcode/random' && method === 'GET') {
        try {
            const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost';
            const url = new URL(req.url ?? '/', origin);
            const difficulty = url.searchParams.get('difficulty') || undefined;

            // Step 1: Try Supabase cache first (so prod works without calling LeetCode)
            let finalProblem = null;
            if (supabaseAdmin) {
                const diffLabel = (difficulty || 'Medium').charAt(0).toUpperCase() + (difficulty || 'Medium').slice(1).toLowerCase();
                const { data: cachedBatch, error: batchErr } = await supabaseAdmin
                    .from('leetcode_problems')
                    .select('*')
                    .eq('difficulty', diffLabel)
                    .limit(20);

                if (batchErr) {
                    log('[CACHE] Random batch error', batchErr.message);
                }

                log('[LEETCODE] /random cache count', cachedBatch?.length ?? 0);
                if (cachedBatch && cachedBatch.length > 0) {
                    const picked = cachedBatch[Math.floor(Math.random() * cachedBatch.length)];
                    log('[CACHE] Hit random', picked.title_slug);
                    sendJson(res, 200, {
                        questionId: picked.title_slug,
                        title: picked.title,
                        titleSlug: picked.title_slug,
                        difficulty: picked.difficulty,
                        content: picked.content,
                        topicTags: picked.topic_tags,
                        codeSnippets: picked.code_snippets,
                        sampleTestCase: picked.sample_test_case,
                        hints: picked.hints,
                        exampleTestcaseList: picked.example_testcase_list
                    });
                    return true;
                }
                log('[CACHE] Miss random', diffLabel);
            }

            log('[LEETCODE] /random fallback to LeetCode');
            const countResult = await leetcodeClient.problems({
                limit: 1,
                offset: 0,
                filters: {
                    ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {})
                }
            });

            const total = countResult.total;
            log('[LEETCODE] /random LeetCode total', total);
            if (!total || total === 0) {
                log('[LEETCODE] /random 404 no problems');
                sendJson(res, 404, { error: 'No problems found for the given difficulty.' });
                return true;
            }

            for (let attempt = 0; attempt < 10; attempt++) {
                const randomOffset = Math.floor(Math.random() * total);
                const batch = await leetcodeClient.problems({
                    limit: 5,
                    offset: randomOffset,
                    filters: {
                        ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {})
                    }
                });

                const freeProblems = batch.questions.filter(q => !q.paidOnly);
                if (freeProblems.length > 0) {
                    const candidateSlug = freeProblems[Math.floor(Math.random() * freeProblems.length)].titleSlug;

                    // Fetch details immediately to verify content
                    const detail = await leetcodeClient.problem(candidateSlug);
                    if (detail && detail.content && detail.codeSnippets && detail.codeSnippets.length > 0) {
                        finalProblem = detail;
                        // Sync to cache for next time
                        await syncToCache(finalProblem);
                        break;
                    }
                }
            }

            if (!finalProblem) {
                log('[LEETCODE] /random failed 10 attempts', difficulty);
                sendJson(res, 404, {
                    error: 'Could not find a high-quality free problem. This might be due to LeetCode API limits or connectivity issues on Render.',
                    attempts: 10,
                    difficulty: difficulty || 'any'
                });
                return true;
            }

            const problem = finalProblem;
            if (!problem || !problem.title) {
                sendJson(res, 404, { error: 'Problem detail not found.' });
                return true;
            }

            sendJson(res, 200, {
                questionId: problem.questionId,
                title: problem.title,
                titleSlug: problem.titleSlug,
                difficulty: problem.difficulty,
                content: problem.content,
                acRate: problem.acRate,
                likes: problem.likes,
                dislikes: problem.dislikes,
                topicTags: problem.topicTags,
                codeSnippets: problem.codeSnippets,
                sampleTestCase: problem.sampleTestCase,
                hints: problem.hints,
                exampleTestcaseList: problem.exampleTestcaseList
            });
            return true;
        } catch (error) {
            log('[LEETCODE] /random error:', error.message || error);
            sendJson(res, 500, { error: 'Failed to fetch a random problem.' });
            return true;
        }
    }

    if (pathname === '/api/leetcode/daily' && method === 'GET') {
        try {
            const daily = await leetcodeClient.daily();

            sendJson(res, 200, {
                date: daily.date,
                link: daily.link,
                question: {
                    questionId: daily.question.questionId,
                    title: daily.question.title,
                    titleSlug: daily.question.titleSlug,
                    difficulty: daily.question.difficulty,
                    acRate: daily.question.acRate,
                    topicTags: daily.question.topicTags,
                    content: daily.question.content,
                    codeSnippets: daily.question.codeSnippets,
                    hints: daily.question.hints
                }
            });
            return true;
        } catch (error) {
            log('[LEETCODE] /daily error:', error.message || error);
            sendJson(res, 500, { error: 'Failed to fetch daily challenge.' });
            return true;
        }
    }

    return false;
};

const getSafeAssetPath = (pathname) => {
    const decodedPath = decodeURIComponent(pathname);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const normalizedPath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
    return path.join(DIST_DIR, normalizedPath);
};

const serveFrontend = async (req, res, pathname) => {
    try {
        const filePath = getSafeAssetPath(pathname);
        const hasExtension = path.extname(filePath) !== '';

        // If it's a direct file request (has extension), try to serve it.
        // Otherwise, it's a client-side route, serve index.html.
        const targetPath = hasExtension ? filePath : path.join(DIST_DIR, 'index.html');

        try {
            const fileBuffer = await fs.readFile(targetPath);
            const extension = path.extname(targetPath).toLowerCase();
            const contentType = CONTENT_TYPES[extension] ?? 'text/html; charset=utf-8';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(fileBuffer);
        } catch (readErr) {
            log('[FRONTEND] Read failed', targetPath, readErr.message);
            // If the specific file wasn't found but it has an extension, it's a real 404 for an asset
            if (hasExtension) {
                sendText(res, 404, `Asset not found: ${pathname}`);
                return;
            }
            // If index.html fallback failed
            sendText(res, 404, `SPA Fallback failed: index.html not found/readable at ${targetPath}. Build might be broken.`);
        }
    } catch (err) {
        log('[FRONTEND] Error', pathname, err.message);
        sendText(res, 500, 'Internal server error serving frontend.');
    }
};

const server = createServer((req, res) => {
    const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost';
    const requestUrl = new URL(req.url ?? '/', origin);
    const pathname = requestUrl.pathname;

    (async () => {
        log('Incoming', req.method, pathname + (requestUrl.search || ''));

        if (pathname === '/api/debug') {
            const debugInfo = {
                timestamp: new Date().toISOString(),
                env: {
                    NODE_ENV: process.env.NODE_ENV,
                    PORT: PORT,
                    HOST: HOST,
                    DIST_DIR: DIST_DIR,
                    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
                    SUPABASE_URL: !!process.env.SUPABASE_URL,
                    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                    VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY
                },
                dist: {
                    exists: existsSync(DIST_DIR),
                    contents: existsSync(DIST_DIR) ? await fs.readdir(DIST_DIR) : []
                },
                supabase: {
                    initialized: !!supabaseAdmin
                }
            };
            sendJson(res, 200, debugInfo);
            return;
        }

        const handledByLeetcode = await handleLeetcodeApi(req, res, pathname);
        if (handledByLeetcode) return;

        if (pathname === '/healthz') {
            sendJson(res, 200, { ok: true });
            return;
        }

        if (pathname.startsWith('/api/')) {
            log('Unmatched API', pathname);
            sendJson(res, 404, { error: `API endpoint not found: ${pathname}` });
            return;
        }

        await serveFrontend(req, res, pathname);
    })().catch((error) => {
        log('Unhandled error', pathname, error.message || error);
        sendJson(res, 500, { error: 'Internal server error.' });
    });
});

server.listen(PORT, HOST, () => {
    log('Listening on http://' + HOST + ':' + PORT);
});
