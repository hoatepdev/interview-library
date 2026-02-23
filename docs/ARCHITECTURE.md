# Architecture

## Overview

Interview Library is a pnpm monorepo with three packages:

```
interview-library/
├── apps/
│   ├── backend/      # NestJS REST API  (port 9001)
│   └── frontend/     # Next.js web app  (port 9000)
└── packages/
    └── shared/       # Shared i18n config (CJS + ESM)
```

The frontend proxies all `/api/*` requests to the backend via Next.js rewrites, so the browser only ever communicates with one origin.

---

## Frontend (`apps/frontend`)

**Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl

### Routing

App Router with locale prefix:

```
app/
└── [locale]/
    ├── (main)/               # Authenticated layout (sidebar + header)
    │   ├── page.tsx          # Dashboard
    │   ├── topics/
    │   ├── questions/
    │   ├── practice/
    │   ├── settings/
    │   ├── moderation/       # MOD/ADMIN only
    │   └── admin/users/      # ADMIN only
    └── not-found.tsx
```

Locales: `en` (default), `vi`. The `middleware.ts` handles locale detection and redirect.

### State Management

React Context only — no Redux or Zustand:

| Context | Purpose |
|---------|---------|
| `AuthContext` | Current user, loading state, login/logout |
| `LoginDialogContext` | Open/close the OAuth login modal |

### Key Files

| Path | Purpose |
|------|---------|
| `src/lib/api.ts` | Axios client + all API namespace exports |
| `src/types/index.ts` | TypeScript enums and interfaces |
| `src/hooks/use-auth.ts` | Access `AuthContext` |
| `src/hooks/use-role.ts` | `isAdmin`, `isModerator`, `isModOrAdmin` |
| `src/i18n/routing.ts` | next-intl locale-aware `Link` and `useRouter` |
| `src/messages/en.json` | English translations |
| `src/messages/vi.json` | Vietnamese translations |

### API Client (`src/lib/api.ts`)

Axios instance with:
- `baseURL` from `NEXT_PUBLIC_API_URL` (default `http://localhost:9001/api`)
- `withCredentials: true` for session cookies
- Request interceptor injects `Accept-Language` from current locale

Namespace exports:

```
topicsApi    — CRUD topics
questionsApi — CRUD questions, favorite, status
practiceApi  — random, log, stats, history, due, due-count
authApi      — me, logout
reviewApi    — pending, approve/reject questions and revisions
adminApi     — list users, update role
```

### Component Structure

```
components/
├── auth/           LoginModal
├── layout/         MainLayout, Header, Sidebar, MobileNav
├── notifications/  NotificationBell
├── practice/       PracticeSession, QuestionCard, AnswerReveal, SelfRating, PracticeStats, DueForReview
├── questions/      QuestionList, QuestionForm
├── topics/         TopicCard, TopicForm
└── ui/             Radix UI primitives (Button, Dialog, Select, …)
```

---

## Backend (`apps/backend`)

**Stack:** NestJS 10, TypeORM, Passport.js, PostgreSQL 16

### Module Structure

```
src/
├── admin/          GET /admin/users, PATCH /admin/users/:id/role
├── auth/           OAuth strategies, session guard, serializer
├── common/         RolesGuard, @Roles() decorator, UserRole/ContentStatus enums
├── database/       Entities, migrations, DataSource config
├── i18n/           I18nMiddleware (Accept-Language), I18nService
├── practice/       Random question, practice log, SM-2, stats, due
├── questions/      CRUD + content approval logic
├── review/         Approve/reject questions and revisions, audit log
├── topics/         CRUD (MOD/ADMIN guarded)
└── translations/   Translation API
```

### Authentication & Authorization

**Auth flow:**
1. User clicks "Sign in with Google/GitHub"
2. Browser redirects to `/api/auth/google` (or `/github`)
3. Passport OAuth strategy handles callback
4. `AuthService.validateUser()` upserts user record
5. Passport serializes `user.id` into session cookie
6. Subsequent requests deserialize user from session

**Guards:**
- `SessionAuthGuard` — checks `req.isAuthenticated()`, throws `401` if not
- `RolesGuard` — reads `@Roles(...)` metadata, checks `req.user.role`, throws `403` if insufficient

**First user becomes ADMIN** — `auth.service.ts` checks user count on first OAuth login.

### Content Approval Workflow

```
USER creates question
  → contentStatus = PENDING_REVIEW

MOD/ADMIN creates question
  → contentStatus = APPROVED (bypasses review)

USER edits an APPROVED question
  → QuestionRevision created (contentStatus = PENDING_REVIEW)
  → Original question untouched

MOD/ADMIN edits any question
  → Direct update, always APPROVED

Moderator approves revision
  → Revision fields merged into question
  → Revision marked APPROVED
  → ContentReview audit row created

Moderator rejects revision/question
  → contentStatus = REJECTED, reviewNote set
  → ContentReview audit row created
```

### Spaced Repetition (SM-2)

Implemented in `practice/spaced-repetition.service.ts`. After each practice log:

| Rating | Effect |
|--------|--------|
| `great` | `easeFactor += 0.1`, interval multiplied, repetitions++ |
| `good` | interval multiplied, repetitions++, easeFactor unchanged |
| `fair` | interval reset to 1 day, easeFactor -= 0.15 |
| `poor` | interval reset to 0, repetitions reset, easeFactor -= 0.2 |

SM-2 state stored per-user in `user_questions` (independent of global `questions` fields).

### Database

TypeORM with migrations. DataSource config: `src/database/data-source.ts`.

Entities: `User`, `Topic`, `TopicTranslation`, `Question`, `QuestionTranslation`, `QuestionRevision`, `ContentReview`, `UserQuestion`, `PracticeLog`.

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for full schema.

---

## Shared Package (`packages/shared`)

Built with `tsup`, exports both CJS and ESM.

Exports:
- `LOCALES` — `['en', 'vi']`
- `DEFAULT_LOCALE` — `'en'`
- `LOCALE_CONFIG` — locale metadata

Used by both frontend (next-intl config) and backend (i18n middleware).

---

## i18n Flow

```
Frontend request
  → next-intl reads locale from URL prefix (/en/, /vi/)
  → Axios interceptor adds Accept-Language header

Backend request
  → I18nMiddleware reads Accept-Language
  → I18nService resolves translations for that locale
  → topic_translations / question_translations queried if locale ≠ default
```

---

## Key Design Decisions

**Session-based auth (not JWT)** — Simpler for a personal app. No token refresh logic. HTTP-only cookies prevent XSS token theft.

**Single Axios instance** — All API calls go through one configured instance. Credentials and language headers applied centrally.

**Dual SM-2 tracking** — `questions` table holds global state for system questions; `user_questions` holds per-user state. This lets practice work for unauthenticated users (global state) and authenticated users (personal state) without branching.

**Content approval only for USER role** — MOD/ADMIN bypass the queue. Keeps the workflow simple: one type of actor produces content that needs review.

**Revision as snapshot** — `question_revisions` stores a full snapshot of proposed fields, not a diff. Simpler to implement and easier to display side-by-side in the moderation UI.

**Locale in URL prefix** — `/en/topics`, `/vi/topics`. Avoids cookie/query-param complexity and enables server-side locale detection in Next.js App Router.
