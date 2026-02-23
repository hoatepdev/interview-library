# Interview Library

Personal interview question management app with spaced repetition learning. Store, categorize, and practice interview questions with a built-in SM-2 spaced repetition scheduler.

## Features

- **Topics & Questions** — Organize questions by topic with multi-level difficulty (Junior / Middle / Senior)
- **Spaced Repetition** — SM-2 algorithm schedules review sessions based on self-rating performance
- **Practice Mode** — Random or smart (due-first) question sessions with self-rating
- **RBAC** — Role-based access control (User / Moderator / Admin) with content approval workflow
- **Multi-language** — English and Vietnamese (vi) with locale-based routing
- **Dark Mode** — Full dark/light theme support
- **OAuth Auth** — Sign in with Google or GitHub

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl |
| Backend | NestJS 10, TypeORM, Passport.js |
| Database | PostgreSQL 16 |
| Auth | OAuth 2.0 (Google, GitHub) + express-session |
| Package Manager | pnpm workspaces |

## Quick Start

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker (for PostgreSQL)

### Setup

```bash
# Clone and install
git clone <repo>
cd interview-library
pnpm install

# Start database
docker compose up -d

# Configure environment
cp apps/backend/.env.example apps/backend/.env
# Fill in OAuth credentials and session secret in apps/backend/.env

# Run migrations
pnpm db:migrate

# Start dev servers (frontend :9000, backend :9001)
pnpm dev
```

Open [http://localhost:9000](http://localhost:9000).

### Environment Variables

**`apps/backend/.env`**

```env
PORT=9001
NODE_ENV=development
FRONTEND_URL=http://localhost:9000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=interview_library

SESSION_SECRET=your_random_secret_string

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:9001/api/auth/google/callback

GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:9001/api/auth/github/callback
```

**`apps/frontend/.env.local`** (optional, defaults to localhost)

```env
NEXT_PUBLIC_API_URL=http://localhost:9001/api
```

## Commands

```bash
pnpm dev                          # Start frontend + backend concurrently
pnpm build                        # Build both apps
pnpm db:migrate                   # Run pending migrations
pnpm db:migrate:revert            # Revert last migration
pnpm --filter backend test        # Run backend tests
pnpm --filter frontend lint       # Lint frontend
pnpm --filter backend lint        # Lint backend
pnpm validate:i18n                # Validate translation files
```

## Project Structure

```
interview-library/
├── apps/
│   ├── backend/          # NestJS API (port 9001)
│   └── frontend/         # Next.js app (port 9000)
├── packages/
│   └── shared/           # Shared i18n config (locales, etc.)
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Documentation

| File | Description |
|------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, module structure, key decisions |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Full database schema with tables, enums, ERD |
| [API_CONTRACT.md](API_CONTRACT.md) | All API endpoints with request/response examples |
| [CLAUDE.md](CLAUDE.md) | Development guide for working with this codebase |

## Deployment

| Service | Options |
|---------|---------|
| Frontend | Vercel (recommended), Netlify, Cloudflare Pages |
| Backend | Railway, Render, Fly.io |
| Database | Supabase, Neon, Railway Postgres |
