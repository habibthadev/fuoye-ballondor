# FUOYE Ballon d'Or

Voting platform for FUOYE's annual football awards — Ballon d'Or, Kopa Trophy, Yashin Trophy, and more.

## Stack

- **Frontend** — Vue 3 + TypeScript, Vite, Pinia, Vue Router, TanStack Query, Tailwind CSS v4, motion-v, Chart.js
- **Backend** — Hono + TypeScript, MongoDB (Mongoose), Zod validation, JWT auth, Flutterwave payments, Cloudinary
- **Infrastructure** — pnpm workspaces

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- MongoDB (local or Atlas)
- Flutterwave test/live keys
- Cloudinary account (for nominee images)

## Setup

```bash
pnpm install
cp backend/.env.example backend/.env
# Fill in your env vars
```

## Development

```bash
# Run both backend + frontend
pnpm dev

# Or separately
pnpm dev:backend    # http://localhost:3001
pnpm dev:frontend   # http://localhost:5173

# With public tunnels (outray)
pnpm dev:tunnel
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start both servers |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm seed` | Seed categories + admin |
| `pnpm dev:tunnel` | Dev with outray tunnels |

## Environment Variables

See `backend/.env.example` for all config options. Key ones:

- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` — JWT signing secret (min 32 chars)
- `FLW_*` — Flutterwave API keys
- `CLOUDINARY_*` — Cloudinary credentials
- `FRONTEND_URL` — CORS origin (comma-separated for multiple)
- `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — Default superadmin credentials

## Deployment

Deployed on Vercel as two separate projects:

- **Frontend** — `frontend/` directory, SPA with SPA rewrites
- **Backend** — `backend/` directory, serverless Hono handler

Set `VITE_API_BASE_URL` in the frontend's Vercel environment variables to point at the production backend URL.
