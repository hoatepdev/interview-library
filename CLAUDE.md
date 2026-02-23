# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interview Library is a personal interview question management app with spaced repetition learning. It's a pnpm monorepo with a Next.js frontend, NestJS backend, and a shared utilities package.

## Commands

### Development

```bash
pnpm dev                  # Run frontend (port 9000) + backend (port 9001) concurrently
pnpm dev:frontend         # Frontend only
pnpm dev:backend          # Backend only
docker compose up -d      # Start PostgreSQL (port 5432)
```

### Build

```bash
pnpm build                # Build both frontend and backend
```

### Backend Tests

```bash
pnpm --filter backend test            # Run all tests
pnpm --filter backend test:watch      # Watch mode
pnpm --filter backend test:cov        # With coverage
pnpm --filter backend test -- --testPathPattern="questions"  # Single test file
```

### Linting

```bash
pnpm --filter frontend lint           # Frontend ESLint
pnpm --filter backend lint            # Backend ESLint (with --fix)
```

### Database

```bash
pnpm db:migrate                       # Run pending migrations
pnpm db:migrate:revert                # Revert last migration
# Generate a new migration (run from apps/backend):
pnpm typeorm migration:generate -d src/database/data-source.ts src/database/migrations/MigrationName
pnpm --filter backend seed            # Run initial seed
pnpm --filter backend seed:additional # Run additional seed
```

### i18n

```bash
pnpm validate:i18n        # Validate translation files
pnpm import:translations  # Import translations
```

## Architecture

### Monorepo Structure

- **`apps/frontend`** — Next.js 16 (App Router, React 19, Tailwind CSS 4, next-intl)
- **`apps/backend`** — NestJS 10 (TypeORM, PostgreSQL 16, Passport OAuth)
- **`packages/shared`** — Shared i18n utilities and locale config (built with tsup, exports CJS+ESM)

Package manager: pnpm (>=9.0.0). Node >=20.0.0. Shared code imported as `@interview-library/shared`.

### Frontend

**Routing**: Next.js App Router with locale prefix — `app/[locale]/(main)/`. Locales: `en`, `vi`. Uses next-intl for i18n with JSON translation files in `src/messages/`.

**State**: React Context (AuthContext, LoginDialogContext) — no Redux or Zustand.

**API client**: `src/lib/api.ts` — Axios instance with organized namespace exports (`topicsApi`, `questionsApi`, `practiceApi`, `authApi`). Interceptors inject `Accept-Language` header from current locale. Credentials are enabled for session-based auth.

**UI components**: `src/components/ui/` — Built on Radix UI primitives + CVA for variants. Uses `cn()` helper from `src/lib/utils.ts` (clsx + tailwind-merge).

**Key pages**: Dashboard (`/`), Topics (`/topics`), Questions (`/questions`), Practice (`/practice`).

### Backend

**Module structure**: Standard NestJS modules — `auth/`, `topics/`, `questions/`, `practice/`, `i18n/`, `translations/`. Each module has its own controller, service, and DTOs.

**Auth**: OAuth 2.0 via Passport (Google + GitHub strategies). Session-based with express-session. Guards protect routes; serializers handle user persistence.

**Database**: TypeORM entities in `src/database/entities/`. Migrations in `src/database/migrations/`. Data source config in `src/database/data-source.ts`. Key entities: User, Topic, Question, TopicTranslation, QuestionTranslation, UserQuestion (spaced repetition), PracticeLog, QuestionFavorite.

**Practice/Spaced Repetition**: `practice/spaced-repetition.service.ts` implements the review scheduling algorithm. Self-rating enum: poor/fair/good/great. Questions track due status for review.

**API prefix**: All endpoints under `/api`. Frontend proxies `/api/*` to backend via Next.js rewrites in `next.config.ts`.

### i18n Flow

Locale config is centralized in `packages/shared/src/i18n/locales.ts` (LOCALES, DEFAULT_LOCALE, LOCALE_CONFIG). Frontend uses next-intl; backend uses custom I18nMiddleware reading `Accept-Language`. Topics and questions have separate translation entities for multi-language content.

### Environment

Copy `.env.example` to `apps/backend/.env`. Required vars: DB credentials, OAuth client IDs/secrets, SESSION_SECRET. Frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:9001/api`).
