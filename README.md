# Portfolio

A cinematic portfolio with a React/Vite frontend and an Express/MySQL backend.

## Run locally

1. Install dependencies:

```bash
npm install
npm install --prefix server
```

2. Configure environment variables:

- Root `.env` / `.env.local`
  - `VITE_API_BASE_URL=/api`
  - `VITE_BACKEND_PORT=8789`

- `server/.env`
  - `PORT=8789`
  - `JWT_SECRET=<your-secret>`
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `CONFIG_FILE_FALLBACK=false`

3. Start both frontend and backend with one command:

```bash
npm run dev
```

That command runs:

- Vite frontend on the default dev port
- Express backend on port `8789`
- Frontend API requests proxied to the backend

## Useful commands

```bash
npm run dev:frontend
npm run dev --prefix server
npm run build
npm run lint
npm run healthcheck
```

## Notes

- The backend is designed to use MySQL as the primary persistence layer.
- If MySQL is unreachable, save operations will fail instead of silently falling back to local-only storage.
- `http://localhost:8789/` shows the API landing page, not the frontend app.
