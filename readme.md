# LeetCode Interview Platform

## Global Headcount (Render)

This app now supports a global headcount API:
- `GET /api/headcount`
- `POST /api/headcount/register` with `{ "email": "user@example.com" }`

The frontend calls this API during auth so `Total Users` is shared across devices.

### Render setup
1. Use a Render **Web Service** (not static-only) for this repo.
2. Build command: `npm run build`
3. Start command: `npm run start`
4. Add a persistent disk (recommended) and set:
   - `HEADCOUNT_DATA_FILE=/var/data/headcount-store.json`

### Optional frontend API base URL
If frontend and API are deployed on different domains, set:
- `VITE_API_BASE_URL=https://your-api-domain.com`

If they are on the same Render service, you can leave `VITE_API_BASE_URL` unset.
