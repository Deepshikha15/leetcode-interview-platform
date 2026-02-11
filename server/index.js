import { createServer } from 'http';
import { promises as fs } from 'fs';
import path from 'path';

const PORT = Number(process.env.PORT ?? 3001);
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const STORE_FILE_PATH = path.resolve(
    process.cwd(),
    process.env.HEADCOUNT_DATA_FILE ?? 'server/data/headcount-store.json'
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

let registeredEmails = await loadEmails();

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
        sendJson(res, 200, { headcount: registeredEmails.size });
        return true;
    }

    if (pathname === '/api/headcount/register' && req.method === 'POST') {
        try {
            const body = await readRequestBody(req);
            const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';

            if (!email || !EMAIL_REGEX.test(email)) {
                sendJson(res, 400, { error: 'A valid email is required.' });
                return true;
            }

            const beforeSize = registeredEmails.size;
            registeredEmails.add(email);
            const wasAdded = registeredEmails.size > beforeSize;

            if (wasAdded) {
                await saveEmails(registeredEmails);
            }

            sendJson(res, 200, {
                headcount: registeredEmails.size,
                added: wasAdded
            });
            return true;
        } catch {
            sendJson(res, 400, { error: 'Invalid JSON payload.' });
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

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Headcount store file: ${STORE_FILE_PATH}`);
});
