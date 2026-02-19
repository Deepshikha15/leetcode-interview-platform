# LeetCode Interview Platform

## Auth Analytics APIs

The app exposes:
- `GET /api/headcount`
- `POST /api/headcount/register` with `{ "email": "user@example.com" }`
- `POST /api/logins/record` with `{ "email": "user@example.com", "userAgent": "...", "device": "..." }`

These endpoints are called from auth flows so:
- `Total Users` is shared across devices.
- Every successful login is stored with device metadata.

## Supabase Setup

Set these server environment variables:
- `SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co` (frontend build-time var)
- `VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY` (frontend build-time var)
- Optional: `SUPABASE_HEADCOUNT_TABLE=signup_headcount`
- Optional: `SUPABASE_LOGIN_EVENTS_TABLE=login_events`
- Optional local bind host: `HOST=127.0.0.1` (set `HOST=0.0.0.0` for container/public network binding)
- Optional env file override: `ENV_FILE_PATH=/absolute/path/to/.env`

The server auto-loads `.env` from project root (or `ENV_FILE_PATH`) before initializing DB connections.
If you change `VITE_*` vars, rebuild the frontend so the new values are embedded in `dist`.

Create the table in Supabase SQL editor:

```sql
create table if not exists public.signup_headcount (
  id bigserial primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.login_events (
  id bigserial primary key,
  email text not null,
  user_agent text not null default '',
  device text not null default '',
  ip_address text not null default '',
  created_at timestamptz not null default now()
);
```

## Local Fallback (No Supabase Vars)

If Supabase env vars are missing or invalid, the server falls back to file storage:
- `HEADCOUNT_DATA_FILE=server/data/headcount-store.json`
- `LOGIN_EVENTS_DATA_FILE=server/data/login-events-store.json`

## Deploy (Render)

1. Push this repo to GitHub (includes `render.yaml` blueprint).
2. In Render, click **New +** -> **Blueprint** and select this repo.
3. Render will create a Node web service with:
   - build: `npm ci && npm run build`
   - start: `npm run start`
   - health check: `/healthz`
4. In Render service env vars, set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Optional: `SUPABASE_LOGIN_EVENTS_TABLE`
5. Deploy and verify:
   - `GET https://<your-render-url>/healthz` returns `{ "ok": true }`
   - `GET https://<your-render-url>/api/headcount` returns `{ "headcount": <number> }`

## Optional Frontend API Base URL

If frontend and API are deployed on different domains, set:
- `VITE_API_BASE_URL=https://your-api-domain.com`

If they are on the same service/domain, leave `VITE_API_BASE_URL` unset.


