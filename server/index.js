import { createServer } from 'http';
import { LeetCode } from 'leetcode-query';
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

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST?.trim() || '0.0.0.0';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

if (!existsSync(DIST_DIR)) {
    console.warn(`Warning: Distribution directory NOT found at ${DIST_DIR}. Frontend may not serve correctly.`);
}

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

const handleLeetcodeApi = async (req, res, pathname) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return true;
    }

    if (pathname === '/api/leetcode/problems' && req.method === 'GET') {
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
            console.error('LeetCode problems fetch error:', error);
            sendJson(res, 500, { error: 'Failed to fetch LeetCode problems.' });
            return true;
        }
    }

    const problemMatch = pathname.match(/^\/api\/leetcode\/problem\/([a-z0-9-]+)$/);
    if (problemMatch && req.method === 'GET') {
        try {
            const slug = problemMatch[1];
            const problem = await leetcodeClient.problem(slug);

            if (!problem || !problem.title) {
                sendJson(res, 404, { error: 'Problem not found.' });
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
            console.error('LeetCode problem detail error:', error);
            sendJson(res, 500, { error: 'Failed to fetch problem detail.' });
            return true;
        }
    }

    if (pathname === '/api/leetcode/random' && req.method === 'GET') {
        try {
            const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost';
            const url = new URL(req.url ?? '/', origin);
            const difficulty = url.searchParams.get('difficulty') || undefined;

            // Step 1: Get total count of problems matching the difficulty
            const countResult = await leetcodeClient.problems({
                limit: 1,
                offset: 0,
                filters: {
                    ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {})
                }
            });

            const total = countResult.total;
            if (!total || total === 0) {
                sendJson(res, 404, { error: 'No problems found for the given difficulty.' });
                return true;
            }

            // Step 2: Pick a random free problem that has content
            let finalProblem = null;
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
                        break;
                    }
                }
            }

            if (!finalProblem) {
                sendJson(res, 404, { error: 'Could not find a high-quality free problem. Please try again.' });
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
            console.error('LeetCode random problem error:', error);
            sendJson(res, 500, { error: 'Failed to fetch a random problem.' });
            return true;
        }
    }

    if (pathname === '/api/leetcode/daily' && req.method === 'GET') {
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
            console.error('LeetCode daily challenge error:', error);
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
        const shouldFallbackToIndex = !path.extname(filePath);
        const targetPath = shouldFallbackToIndex ? path.join(DIST_DIR, 'index.html') : filePath;

        const fileBuffer = await fs.readFile(targetPath);
        const extension = path.extname(targetPath).toLowerCase();
        const contentType = CONTENT_TYPES[extension] ?? 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fileBuffer);
    } catch (err) {
        if (pathname !== '/index.html') {
            try {
                const fallback = await fs.readFile(path.join(DIST_DIR, 'index.html'));
                console.log(`Fallback: Serving index.html for unknown path "${pathname}"`);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fallback);
                return;
            } catch (fallbackErr) {
                console.error(`Double Fault: Failed to serve index.html fallback for "${pathname}":`, fallbackErr.message);
            }
        }

        console.error(`Not Found: ${pathname} (mapped to ${getSafeAssetPath(pathname)})`);
        sendText(
            res,
            404,
            'Not found. Build the frontend with "npm run build" before starting the server.'
        );
    }
};

const server = createServer((req, res) => {
    const origin = req.headers.host ? `http://${req.headers.host}` : 'http://localhost';
    const requestUrl = new URL(req.url ?? '/', origin);
    const pathname = requestUrl.pathname;

    (async () => {
        const handledByLeetcode = await handleLeetcodeApi(req, res, pathname);
        if (handledByLeetcode) return;

        if (pathname === '/healthz') {
            sendJson(res, 200, { ok: true });
            return;
        }

        await serveFrontend(req, res, pathname);
    })().catch((error) => {
        console.error('Unhandled server error:', error);
        sendJson(res, 500, { error: 'Internal server error.' });
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
});
