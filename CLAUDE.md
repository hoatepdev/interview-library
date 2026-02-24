# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Interview Library is a personal interview question management app with spaced repetition learning. It's a pnpm monorepo with a Next.js frontend, NestJS backend, and a shared utilities package.

For detailed documentation see:
- [ARCHITECTURE.md](ARCHITECTURE.md) — system design and module structure
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) — full DB schema, enums, relationships
- [API_CONTRACT.md](API_CONTRACT.md) — all API endpoints with request/response shapes
- [README.md](README.md) — quick start and deployment

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

**API client**: `src/lib/api.ts` — Axios instance with organized namespace exports (`topicsApi`, `questionsApi`, `practiceApi`, `authApi`, `reviewApi`, `adminApi`). Interceptors inject `Accept-Language` header from current locale. Credentials are enabled for session-based auth.

**UI components**: `src/components/ui/` — Built on Radix UI primitives + CVA for variants. Uses `cn()` helper from `src/lib/utils.ts` (clsx + tailwind-merge).

**Role-based UI**: `src/hooks/use-role.ts` — `useRole()` returns `{ isAdmin, isModerator, isModOrAdmin }`. Use these to conditionally render navigation links and UI elements.

**Key pages**: Dashboard (`/`), Topics (`/topics`), Questions (`/questions`), Practice (`/practice`), Moderation (`/moderation`, MOD/ADMIN only), Admin Users (`/admin/users`, ADMIN only).

### Backend

**Module structure**: Standard NestJS modules — `auth/`, `topics/`, `questions/`, `practice/`, `review/`, `admin/`, `i18n/`, `translations/`. Each module has its own controller, service, and DTOs.

**Auth**: OAuth 2.0 via Passport (Google + GitHub strategies). Session-based with express-session. Guards protect routes; serializers handle user persistence.

**RBAC**: `common/guards/roles.guard.ts` + `common/decorators/roles.decorator.ts`. Apply with `@UseGuards(SessionAuthGuard, RolesGuard) @Roles(UserRole.MODERATOR, UserRole.ADMIN)`. First user to log in automatically becomes ADMIN.

**Database**: TypeORM entities in `src/database/entities/`. Migrations in `src/database/migrations/`. Data source config in `src/database/data-source.ts`.

**Content approval**: Questions created by `USER` role get `contentStatus = PENDING_REVIEW`. Edits to approved questions create a `question_revision` row instead of updating in-place. MOD/ADMIN bypass the queue.

**Practice/Spaced Repetition**: `practice/spaced-repetition.service.ts` implements SM-2. Self-rating: poor/fair/good/great. Per-user state in `user_questions`.

**API prefix**: All endpoints under `/api`. Frontend proxies `/api/*` to backend via Next.js rewrites in `next.config.ts`.

### i18n Flow

Locale config is centralized in `packages/shared/src/i18n/locales.ts` (LOCALES, DEFAULT_LOCALE, LOCALE_CONFIG). Frontend uses next-intl; backend uses custom I18nMiddleware reading `Accept-Language`. Topics and questions have separate translation entities for multi-language content.

### Environment

Copy `.env.example` to `.env` at the project root. Required vars: DB credentials, OAuth client IDs/secrets, SESSION_SECRET. Frontend reads `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:9001/api`).

## Development Guidelines

### Adding a New Backend Endpoint

1. Add to existing module controller (or create new module)
2. Apply `@UseGuards(SessionAuthGuard)` for auth, add `@UseGuards(RolesGuard) @Roles(UserRole.ADMIN)` for RBAC
3. Create DTO with class-validator decorators
4. Add method to service
5. Export from `api.ts` in frontend under the appropriate namespace

### Adding a New Frontend Page

1. Create `app/[locale]/(main)/your-page/page.tsx`
2. Use `useAuth()` for current user, `useRole()` for permission checks
3. Add navigation link to `Sidebar.tsx` (conditionally rendered by role if needed)
4. Add translation keys to `src/messages/en.json` and `src/messages/vi.json`
5. Call `pnpm validate:i18n` to verify translations are complete

### Adding Database Columns

1. Update the entity file in `apps/backend/src/database/entities/`
2. Generate migration: `pnpm typeorm migration:generate -d src/database/data-source.ts src/database/migrations/MyMigration` (run from `apps/backend`)
3. Run migration: `pnpm db:migrate`
4. Update `DATABASE_SCHEMA.md`

### Commit Convention

```
feat: add practice mode
fix: resolve topic deletion issue
docs: update README
refactor: restructure API client
test: add integration tests
chore: update dependencies
```
