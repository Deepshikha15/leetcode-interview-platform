import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST?.trim() || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';
const SUPABASE_HEADCOUNT_TABLE = process.env.SUPABASE_HEADCOUNT_TABLE?.trim() || 'signup_headcount';
const SUPABASE_REST_BASE_URL = SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1';
const STORE_FILE_PATH = path.resolve(
    process.cwd(),
    process.env.HEADCOUNT_DATA_FILE ?? 'server/data/headcount-store.json'
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_TABLE_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
const hasValidSupabaseTable = SAFE_TABLE_NAME_REGEX.test(SUPABASE_HEADCOUNT_TABLE);

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

const normalizeEmail = (email) => email.trim().toLowerCase();

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

const buildSupabaseHeaders = (extraHeaders = {}) => ({
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extraHeaders
});

const parseCountFromContentRange = (value) => {
    if (typeof value !== 'string') return null;
    const slashIndex = value.lastIndexOf('/');
    if (slashIndex < 0 || slashIndex === value.length - 1) return null;

    const rawCount = value.slice(slashIndex + 1);
    const parsedCount = Number(rawCount);
    return Number.isFinite(parsedCount) ? parsedCount : null;
};

const getSupabaseTableUrl = () => `${SUPABASE_REST_BASE_URL}/${SUPABASE_HEADCOUNT_TABLE}`;

const ensureStoreFile = async () => {
    await fs.mkdir(path.dirname(STORE_FILE_PATH), { recursive: true });

    try {
        await fs.access(STORE_FILE_PATH);
    } catch {
        await fs.writeFile(
            STORE_FILE_PATH,
            JSON.stringify({ emails: [] }, null, 2),
            'utf-8'
        );
    }
};

const loadEmails = async () => {
    await ensureStoreFile();

    try {
        const rawValue = await fs.readFile(STORE_FILE_PATH, 'utf-8');
        const parsed = rawValue ? JSON.parse(rawValue) : { emails: [] };

        if (!Array.isArray(parsed.emails)) {
            return new Set();
        }

        return new Set(
            parsed.emails
                .filter((entry) => typeof entry === 'string')
                .map((entry) => normalizeEmail(entry))
        );
    } catch {
        return new Set();
    }
};

const saveEmails = async (emails) => {
    await fs.writeFile(
        STORE_FILE_PATH,
        JSON.stringify({ emails: Array.from(emails).sort() }, null, 2),
        'utf-8'
    );
};

const createFileHeadcountStore = async () => {
    let registeredEmails = await loadEmails();

    return {
        getHeadcount: async () => registeredEmails.size,
        registerEmail: async (email) => {
            const beforeSize = registeredEmails.size;
            registeredEmails.add(email);
            const wasAdded = registeredEmails.size > beforeSize;

            if (wasAdded) {
                await saveEmails(registeredEmails);
            }

            return {
                headcount: registeredEmails.size,
                added: wasAdded
            };
        },
        mode: 'file'
    };
};

const getSupabaseHeadcount = async () => {
    const url = `${getSupabaseTableUrl()}?select=email`;
    const response = await fetch(url, {
        method: 'GET',
        headers: buildSupabaseHeaders({
            Prefer: 'count=exact',
            Range: '0-0'
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Supabase count failed (${response.status}): ${errorBody}`);
    }

    const contentRange = response.headers.get('content-range');
    const count = parseCountFromContentRange(contentRange);

    if (count === null) {
        throw new Error(`Supabase count missing/invalid content-range header: ${contentRange}`);
    }

    return count;
};

const registerSupabaseEmail = async (email) => {
    const url = getSupabaseTableUrl();
    const response = await fetch(url, {
        method: 'POST',
        headers: buildSupabaseHeaders({
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
        }),
        body: JSON.stringify({ email })
    });

    if (!response.ok && response.status !== 409) {
        const errorBody = await response.text();
        throw new Error(`Supabase insert failed (${response.status}): ${errorBody}`);
    }

    const added = response.ok;
    const headcount = await getSupabaseHeadcount();

    return {
        headcount,
        added
    };
};

const createSupabaseHeadcountStore = () => ({
    getHeadcount: getSupabaseHeadcount,
    registerEmail: registerSupabaseEmail,
    mode: 'supabase'
});

const createHeadcountStore = async () => {
    if (!hasSupabaseConfig) {
        return createFileHeadcountStore();
    }

    if (!hasValidSupabaseTable) {
        console.warn(
            `Invalid SUPABASE_HEADCOUNT_TABLE value "${SUPABASE_HEADCOUNT_TABLE}". Falling back to file storage.`
        );
        return createFileHeadcountStore();
    }

    try {
        const supabaseStore = createSupabaseHeadcountStore();
        await supabaseStore.getHeadcount();
        return supabaseStore;
    } catch (error) {
        console.error('Supabase headcount initialization failed. Falling back to file storage.', error);
        return createFileHeadcountStore();
    }
};

const headcountStore = await createHeadcountStore();

const readRequestBody = async (req) => {
    const chunks = [];

    for await (const chunk of req) {
        chunks.push(chunk);
    }

    const rawBody = Buffer.concat(chunks).toString('utf-8').trim();
    if (!rawBody) return {};
    return JSON.parse(rawBody);
};

const handleHeadcountApi = async (req, res, pathname) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return true;
    }

    if (pathname === '/api/headcount' && req.method === 'GET') {
        try {
            const headcount = await headcountStore.getHeadcount();
            sendJson(res, 200, { headcount });
            return true;
        } catch {
            sendJson(res, 500, { error: 'Unable to read headcount.' });
            return true;
        }
    }

    if (pathname === '/api/headcount/register' && req.method === 'POST') {
        try {
            const body = await readRequestBody(req);
            const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';

            if (!email || !EMAIL_REGEX.test(email)) {
                sendJson(res, 400, { error: 'A valid email is required.' });
                return true;
            }

            const { headcount, added } = await headcountStore.registerEmail(email);

            sendJson(res, 200, {
                headcount,
                added
            });
            return true;
        } catch (error) {
            if (error instanceof SyntaxError) {
                sendJson(res, 400, { error: 'Invalid JSON payload.' });
                return true;
            }

            sendJson(res, 500, { error: 'Unable to register user headcount.' });
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
    } catch {
        if (pathname !== '/index.html') {
            try {
                const fallback = await fs.readFile(path.join(DIST_DIR, 'index.html'));
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(fallback);
                return;
            } catch {
                // continue to 404 below
            }
        }

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
        const handledByApi = await handleHeadcountApi(req, res, pathname);
        if (handledByApi) return;

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
    if (headcountStore.mode === 'supabase') {
        console.log(`Headcount storage: Supabase table "${SUPABASE_HEADCOUNT_TABLE}"`);
    } else {
        console.log(`Headcount store file: ${STORE_FILE_PATH}`);
    }
});
