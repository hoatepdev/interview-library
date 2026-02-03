# Interview Library - Project Plan

## Overview

Personal interview question management application for storing, categorizing, and practicing interview questions.

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, next-intl
- **Backend**: NestJS, TypeScript, TypeORM, Passport.js
- **Database**: PostgreSQL (Docker)
- **Authentication**: OAuth (Google, GitHub) with session-based auth
- **Internationalization**: English, Vietnamese (vi)

---

## Phase 1: Foundation (MVP Core) ✅ COMPLETED

**Status**: ✅ Complete
**Duration**: ~1-2 weeks

### Tasks Completed

| Task | Status | Description |
|------|--------|-------------|
| Project Setup | ✅ | Monorepo structure with Next.js + NestJS |
| Database | ✅ | PostgreSQL with Docker Compose |
| DB Schema | ✅ | Tables: topics, questions, users with migrations |
| Topics CRUD | ✅ | API + UI for topic management |
| Questions CRUD | ✅ | API + UI for question management |
| Layout & Navigation | ✅ | Header, Sidebar, MainLayout |
| Home Dashboard | ✅ | Redesigned with stats & activity |
| Practice UI (Frontend) | ✅ | Components created & API connected |
| Multi-language (i18n) | ✅ | English & Vietnamese support |
| Dark Mode | ✅ | Full dark mode support with theme toggle |

### Backend API Endpoints

```
POST   /api/topics              - Create topic
GET    /api/topics              - List all topics
GET    /api/topics/:id          - Get topic by ID
PUT    /api/topics/:id          - Update topic
DELETE /api/topics/:id          - Delete topic

POST   /api/questions           - Create question
GET    /api/questions           - List questions (with filters)
GET    /api/questions/:id       - Get question by ID
PUT    /api/questions/:id       - Update question
DELETE /api/questions/:id       - Delete question
PATCH  /api/questions/:id/favorite - Toggle favorite
PATCH  /api/questions/:id/status   - Update learning status
```

### Frontend Pages

| Page | Route | Status |
|------|-------|--------|
| Home/Dashboard | `/` | ✅ Complete |
| Topics List | `/topics` | ✅ Complete |
| Questions List | `/questions` | ✅ Complete |
| Practice Mode | `/practice` | ✅ Complete |

### Frontend Components Created

```
components/
├── layout/
│   ├── MainLayout.tsx         - Main app layout with sidebar
│   ├── Header.tsx             - Top navigation header
│   └── Sidebar.tsx            - Side navigation menu
│
├── practice/
│   ├── PracticeSession.tsx    - Main practice container
│   ├── QuestionCard.tsx       - Question display with topic & practice count
│   ├── AnswerReveal.tsx       - Show/hide answer (handles optional answers)
│   ├── SelfRating.tsx         - Rating buttons using SelfRating enum
│   └── PracticeStats.tsx      - Stats display (currently mock data)
│
├── topics/
│   ├── TopicCard.tsx          - Topic card component
│   └── TopicForm.tsx          - Topic create/edit form
│
├── questions/
│   ├── QuestionList.tsx       - Question list with edit/delete/favorite
│   └── QuestionForm.tsx       - Question create/edit form
│
└── ui/
    ├── Button.tsx             - Reusable button component
    ├── Input.tsx              - Text input
    ├── Label.tsx              - Form label
    ├── Textarea.tsx           - Textarea
    ├── Select.tsx             - Select dropdown
    ├── Dialog.tsx             - Dialog/modal component
    ├── theme-toggle.tsx       - Dark mode toggle
    └── theme-provider.tsx     - Theme context provider

app/layout.tsx
└── Toaster                    - Toast notifications (sonner)

lib/
└── api.ts                     - Connected to real backend
    ├── topicsApi              - Full CRUD for topics
    ├── questionsApi           - Full CRUD + favorite toggle
    ├── practiceApi            - Random question, log practice, stats
    ├── getTopics()            - Convenience function
    ├── getQuestions()         - Convenience function
    └── axios instance         - Configured with baseURL

types/
└── index.ts                   - TypeScript types & enums
    ├── QuestionLevel          - JUNIOR, MIDDLE, SENIOR
    ├── QuestionStatus         - NEW, LEARNING, MASTERED
    ├── SelfRating             - POOR, FAIR, GOOD, GREAT
    ├── Topic, Question        - Entity interfaces
    ├── PracticeLog, PracticeStats, PracticeLogEntry
    └── DTOs for create/update operations
```

### Database Schema

```sql
topics
├── id (UUID, PK)
├── name (VARCHAR)
├── slug (VARCHAR, unique)
├── color (VARCHAR)
├── icon (VARCHAR)
└── description (TEXT)

topic_translations
├── id (UUID, PK)
├── topic_id (UUID, FK)
├── locale (VARCHAR)
├── name (VARCHAR)
└── description (TEXT)

questions
├── id (UUID, PK)
├── title (VARCHAR)
├── content (TEXT)
├── answer (TEXT, nullable)
├── topic_id (UUID, FK)
├── level (ENUM: junior/middle/senior)
├── status (ENUM: new/learning/mastered)
├── difficulty_score (INT)
├── practice_count (INT)
└── last_practiced_at (TIMESTAMP)

question_translations
├── id (UUID, PK)
├── question_id (UUID, FK)
├── locale (VARCHAR)
├── title (VARCHAR)
├── content (TEXT)
└── answer (TEXT)

users
├── id (UUID, PK)
├── email (VARCHAR, unique)
├── name (VARCHAR)
├── avatar (VARCHAR)
├── provider (VARCHAR)
├── provider_id (VARCHAR)
└── created_at (TIMESTAMP)

user_questions
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── question_id (UUID, FK → questions)
├── is_favorite (BOOLEAN)
├── status (ENUM: new/learning/mastered)
└── UNIQUE(user_id, question_id)

question_favorites
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── question_id (UUID, FK → questions)
└── created_at (TIMESTAMP)

practice_logs
├── id (UUID, PK)
├── user_id (UUID, FK → users)
├── question_id (UUID, FK → questions)
├── self_rating (ENUM: poor/fair/good/great)
├── time_spent_seconds (INT, nullable)
├── notes (TEXT, nullable)
└── practiced_at (TIMESTAMP)
```

### How to Run

```bash
# Start PostgreSQL
docker compose up -d

# Start Backend (Terminal 1)
cd apps/backend
npm run start:dev

# Start Frontend (Terminal 2)
cd apps/frontend
npm run dev
```

Visit http://localhost:3000

---

## Phase 2: Practice Mode

**Status**: ✅ Complete
**Duration**: ~3-5 days

### Progress

| Task | Status | Description |
|------|--------|-------------|
| Practice UI Components | ✅ | All components created |
| Practice Page | ✅ | `/practice` page created |
| practice_logs table | ✅ | Migration created & run |
| Practice Module | ✅ | Backend module complete |
| Random question API | ✅ | GET /api/practice/random |
| Practice logging API | ✅ | POST /api/practice/log |
| Practice stats API | ✅ | GET /api/practice/stats |
| Practice history API | ✅ | GET /api/practice/history |
| Connect Frontend → Backend | ✅ | API client updated & flow tested |

### Backend Implementation Complete

**Files Created:**
```
apps/backend/src/
├── practice/
│   ├── practice.module.ts         ✅
│   ├── practice.controller.ts      ✅
│   ├── practice.service.ts         ✅
│   └── dto/
│       ├── create-practice-log.dto.ts  ✅
│       └── query-practice.dto.ts       ✅
└── database/
    ├── entities/practice-log.entity.ts ✅
    └── migrations/
        └── 1706590000000-CreatePracticeLogs.ts ✅
```

### Frontend Implementation Complete

**Files Updated/Created:**
```
apps/frontend/src/
├── types/index.ts                 ✅ All TypeScript types & enums
├── lib/api.ts                     ✅ API client with practiceApi methods
├── app/practice/page.tsx          ✅ Practice page with stats sidebar
└── components/practice/
    ├── PracticeSession.tsx        ✅ Connected to practiceApi
    ├── QuestionCard.tsx           ✅ Shows topic name, favorite, practice count
    ├── AnswerReveal.tsx           ✅ Handles optional answers
    ├── SelfRating.tsx             ✅ Uses SelfRating enum
    └── PracticeStats.tsx          ✅ Fetches real stats from API
```

**Features Implemented:**
- Random question loading with exclude option (no repeats in session)
- Time tracking per question (auto-calculated)
- Practice logging with self-rating
- Auto-load next question after rating
- Real-time stats display (total questions, sessions, time spent, by status)
- Loading states and error handling
- Type-safe API calls with full TypeScript support

### Database Schema

```sql
practice_logs
├── id (UUID, PK)
├── question_id (UUID, FK → questions)
├── self_rating (ENUM: poor/fair/good/great)
├── time_spent_seconds (INT, nullable)
├── notes (TEXT, nullable)
└── practiced_at (TIMESTAMP)
```

### API Endpoints (All Working)

```
GET    /api/practice/random       - Get random question (with filters)
       Query params: topicId, level, status, excludeQuestionId, limit

POST   /api/practice/log          - Save practice result
       Body: { questionId, selfRating, timeSpentSeconds?, notes? }

GET    /api/practice/stats        - Get practice statistics
       Returns: { totalQuestions, totalPracticeSessions, totalPracticeTimeMinutes,
                questionsByStatus, questionsByLevel, practiceByRating,
                questionsNeedingReview, recentLogs }

GET    /api/practice/history      - Get practice history
       Query params: limit (default: 20)
       Returns: Array of practice logs with question details
```

### Auto-Update Logic

When logging practice:
- `practice_count` increments
- `last_practiced_at` updates to now
- Status auto-updates based on rating:
  - `great` + 3+ practices → `mastered`
  - `great` → `learning`
  - `poor` → `learning`

### User Flow

```
1. User clicks "Start Practice" from home
2. System shows random question (answer hidden)
3. User thinks about answer
4. User clicks "Show Answer"
5. User rates their own answer (Poor/Fair/Good/Great)
6. System saves practice log via API
7. System updates question practice_count
8. User clicks "Next Question"
9. Repeat
```

---

## Phase 3: Search & Filter Enhancement

**Status**: ✅ Complete (Basic Search)
**Duration**: ~1-2 days

### Tasks Completed

| Priority | Task | Status | Description |
|----------|------|--------|-------------|
| P0 | Full-text search | ✅ Done | Client-side search by title/content/answer/level/status |
| P0 | Search UI | ✅ Done | Connected search inputs with real-time filtering |
| P1 | Topics search | ✅ Done | Search by name and description |
| P1 | Advanced filters | ⏳ | Multi-filter support (future) |
| P1 | Better Filter UI | ⏳ | Improved filter sidebar (future) |

### Current State
- **Questions page**: Search filters title, content, answer, level, status
- **Topics page**: Search filters name, description
- Real-time filtering as user types
- Case-insensitive search

---

## Phase 4: Polish & UX Improvements

**Status**: ✅ Complete (Core UX)
**Duration**: ~2-3 days

### Tasks Completed

| Priority | Task | Status | Description |
|----------|------|--------|-------------|
| P1 | Dashboard stats | ✅ Done | Nice gradient design |
| P1 | Activity feed | ✅ Done | Recent activity on home |
| P1 | Loading states | ✅ Done | Skeleton screens on all pages |
| P1 | Delete & Edit | ✅ Done | Full CRUD with dialogs |
| P2 | Dark mode | ✅ Done | Full dark mode support |
| P2 | Toast notifications | ✅ Done | Sonner toasts for all actions |
| P1 | Responsive design | ⏳ | Mobile-friendly tweaks |
| P2 | Keyboard shortcuts | ⏳ | Power user features |
| P2 | Export/Import | ⏳ | JSON backup/restore |

### Features Completed

- [x] Dark mode toggle - Full integration across all components
- [x] Toast notifications - Replaced all alert() calls with sonner
- [x] Delete functionality - Delete buttons on all cards with confirmation
- [x] Edit dialogs - Edit functionality for Topics and Questions
- [x] Loading skeletons - All pages have proper loading states

---

## Phase 5: Authentication & User Features

**Status**: ✅ Complete
**Duration**: ~3-5 days

### Tasks Completed

| Priority | Task | Status | Description |
|----------|------|--------|-------------|
| P0 | User Authentication | ✅ Done | OAuth with Google & GitHub |
| P0 | Session Management | ✅ Done | Passport.js session-based auth |
| P0 | User CRUD | ✅ Done | Users table & entities |
| P0 | User-specific Questions | ✅ Done | Row-level security for user data |
| P0 | Multi-language Support | ✅ Done | i18n with English & Vietnamese |
| P1 | Language Switcher | ✅ Done | Toggle between en/vi |
| P1 | Login Modal | ✅ Done | OAuth login UI |
| P1 | Protected Routes | ✅ Done | Session auth guard |

### Backend Implementation Complete

**Files Created:**
```
apps/backend/src/
├── auth/
│   ├── auth.module.ts              ✅
│   ├── auth.controller.ts          ✅
│   ├── auth.service.ts             ✅
│   ├── strategies/
│   │   ├── google.strategy.ts      ✅
│   │   └── github.strategy.ts      ✅
│   ├── guards/
│   │   └── session-auth.guard.ts   ✅
│   └── serializers/
│       └── auth.serializer.ts      ✅
├── i18n/
│   ├── i18n.module.ts              ✅
│   ├── i18n.middleware.ts          ✅
│   ├── i18n.service.ts             ✅
│   └── translation.service.ts      ✅
└── database/
    └── entities/
        ├── user.entity.ts          ✅
        ├── user-question.entity.ts ✅
        ├── question-favorite.entity.ts ✅
        ├── topic-translation.entity.ts ✅
        └── question-translation.entity.ts ✅
```

### Frontend Implementation Complete

**Files Updated/Created:**
```
apps/frontend/src/
├── app/
│   └── [locale]/
│       ├── layout.tsx              ✅ Locale-based layout
│       ├── not-found.tsx           ✅ Localized 404
│       └── [...rest]/              ✅ Catch-all for auth redirects
├── components/
│   ├── auth/
│   │   └── LoginModal.tsx          ✅ OAuth login UI
│   └── layout/
│       ├── Header.tsx              ✅ Updated with lang switcher & login
│       ├── Sidebar.tsx             ✅ Updated with user menu
│       └── MainLayout.tsx          ✅ Updated for authenticated users
├── lib/
│   ├── api.ts                      ✅ Added auth API methods
│   └── auth.ts                     ✅ Auth utility functions
├── messages/
│   ├── en.json                     ✅ English translations
│   └── vi.json                     ✅ Vietnamese translations
└── middleware.ts                   ✅ i18n redirect middleware
```

### Features Implemented

- **OAuth Authentication**:
  - Google OAuth integration
  - GitHub OAuth integration
  - Session-based authentication with Passport.js
  - Secure session storage with HTTP-only cookies

- **User Management**:
  - User registration on first OAuth login
  - Profile data (name, email, avatar)
  - Provider tracking (google/github)

- **User-Specific Data**:
  - User-question relationships for personal favorites/status
  - User-specific practice logs
  - Row-level security on all user data

- **Multi-language Support**:
  - Locale-based routing (/en/*, /vi/*)
  - next-intl integration
  - Language switcher in header
  - Translations for all UI elements

- **Login/Logout**:
  - Login modal with OAuth buttons
  - Logout functionality
  - Protected routes with session guard
  - User profile display

### API Endpoints (All Working)

```
# Authentication
GET    /api/auth/google           - Initiate Google OAuth
GET    /api/auth/google/callback  - Google OAuth callback
GET    /api/auth/github           - Initiate GitHub OAuth
GET    /api/auth/github/callback  - GitHub OAuth callback
GET    /api/auth/me               - Get current user profile
GET    /api/auth/debug-session    - Debug session state
POST   /api/auth/logout           - Logout user

# Translations
GET    /api/translations          - Get translations by locale
GET    /api/translations/:locale  - Get specific locale translations
```

### Environment Variables

Add to `.env`:

```bash
# OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback

# Session
SESSION_SECRET=your_random_secret_string
```

---

## Phase 6: Extended Features (Post-MVP)

**Status**: ⏳ Optional
**Duration**: Variable

### AI-Assisted Practice

```
Features:
- AI generates follow-up questions
- Chat-based practice mode
- Feedback on answer quality
- Suggest knowledge gaps

Tech: OpenAI API / Anthropic API
```

### Spaced Repetition

```
Features:
- Algorithm to schedule reviews
- Notifications for due questions
- Priority queue for weak areas

Algorithm: SM-2 or custom
```

### Tags System

```sql
-- New tables
tags
├── id (UUID, PK)
├── name (VARCHAR)
└── color (VARCHAR)

question_tags (junction)
├── question_id (UUID, FK)
├── tag_id (UUID, FK)
```

### Statistics & Analytics

```
Features:
- Strength/weakness by topic
- Progress charts over time
- Practice time tracking
- Performance trends

Tech: Chart.js / Recharts
```

---

## Future Enhancements

> **Note**: Multi-user support with authentication has been implemented in Phase 5.
> Current implementation includes:
> - OAuth authentication (Google & GitHub)
> - User-specific data isolation
> - Session-based authentication
> - Row-level security for user data

### Additional User Features (Future)

To extend the current authentication system:

1. **Email/Password Authentication**
   - Add traditional login alongside OAuth
   - Password reset flow
   - Email verification

2. **User Settings**
   - Profile customization
   - Preferences management
   - Notification settings

### Offline Support (PWA)

```
Features:
- Service worker for caching
- Local storage for offline practice
- Sync when online
```

### Mobile App

```
Options:
1. Capacitor - Wrap existing web app
2. React Native - Native implementation
3. Expo - Managed React Native
```

---

## Project Structure

```
interview-library/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── topics/       # Topics module ✅
│   │   │   ├── questions/    # Questions module ✅
│   │   │   ├── practice/     # Practice module ✅
│   │   │   ├── auth/         # Authentication module ✅
│   │   │   │   ├── strategies/
│   │   │   │   ├── guards/
│   │   │   │   └── serializers/
│   │   │   ├── i18n/         # Internationalization ✅
│   │   │   └── database/     # Entities & migrations ✅
│   │   └── package.json
│   │
│   └── frontend/             # Next.js App
│       ├── src/
│       │   ├── app/          # App Router pages ✅
│       │   │   └── [locale]/  # Locale-based routing ✅
│       │   ├── components/   # React components ✅
│       │   │   ├── auth/     # Auth components ✅
│       │   │   ├── layout/   # Layout components ✅
│       │   │   ├── practice/ # Practice components ✅
│       │   │   ├── topics/   # Topic components ✅
│       │   │   └── questions/# Question components ✅
│       │   ├── lib/          # Utilities, API client ✅
│       │   ├── messages/     # i18n translations ✅
│       │   └── types/        # TypeScript types ✅
│       └── package.json
│
├── packages/
│   └── shared/               # Shared code (future)
│
├── docker-compose.yml        # PostgreSQL ✅
├── .env                      # Environment variables
├── .env.example              # Env template
├── package.json              # Root workspace
└── PROJECT_PLAN.md           # This file
```

---

## Development Guidelines

### Branch Strategy

```
main          - Production releases
develop       - Development branch
feature/*     - Feature branches
fix/*         - Bugfix branches
```

### Commit Convention

```
feat: add practice mode
fix: resolve topic deletion issue
docs: update README
style: format code
refactor: restructure API client
test: add integration tests
chore: update dependencies
```

### Code Review Checklist

- [ ] TypeScript types are correct
- [ ] No console.log left in code
- [ ] Error handling is proper
- [ ] API responses are consistent
- [ ] UI is responsive
- [ ] No hardcoded values (use env vars)

---

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Current Endpoints

#### Topics
```
POST   /api/topics              - Create topic
GET    /api/topics              - List all topics
GET    /api/topics/:id          - Get topic by ID
PUT    /api/topics/:id          - Update topic
DELETE /api/topics/:id          - Delete topic
```

#### Questions
```
POST   /api/questions           - Create question
GET    /api/questions           - List questions (with filters)
GET    /api/questions/:id       - Get question by ID
PUT    /api/questions/:id       - Update question
DELETE /api/questions/:id       - Delete question
PATCH  /api/questions/:id/favorite - Toggle favorite
PATCH  /api/questions/:id/status   - Update learning status
```

#### Practice
```
GET    /api/practice/random       - Get random question
POST   /api/practice/log          - Save practice result
GET    /api/practice/stats        - Get practice statistics
GET    /api/practice/history      - Get practice history
```

### Response Format

Success:
```json
{
  "id": "uuid",
  "title": "Question title",
  "createdAt": "2024-01-30T00:00:00Z"
}
```

Error:
```json
{
  "statusCode": 404,
  "message": "Not Found",
  "error": "Not Found"
}
```

---

## Environment Variables

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=interview_library
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Deployment

### Backend Deployment Options

1. **Railway** - Simple, auto-deploy from Git
2. **Render** - Free tier available
3. **Fly.io** - Global edge deployment
4. **AWS/Azure/GCP** - Enterprise scale

### Frontend Deployment Options

1. **Vercel** - Best for Next.js, zero-config
2. **Netlify** - Alternative with edge functions
3. **Cloudflare Pages** - Global CDN

### Database

1. **Supabase** - PostgreSQL with auth
2. **Neon** - Serverless PostgreSQL
3. **Railway Postgres** - Simple managed DB

---

## Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Practice Mode | ✅ Complete | 100% |
| Phase 3: Search & Filter | ✅ Complete | 80% (basic search done) |
| Phase 4: Polish & UX | ✅ Complete | 80% (core UX done) |
| Phase 5: Authentication & User Features | ✅ Complete | 100% |
| Phase 6: Extended Features | ⏳ Pending | 0% |

### Current Development State

**Frontend**: Fully connected to backend APIs ✅
- `lib/api.ts` uses axios with real backend endpoints
- `topicsApi`, `questionsApi`, `practiceApi`, `authApi` fully implemented
- `TopicForm` connected to backend with loading states
- `QuestionForm` connected to backend with loading states
- All list pages fetch real data from backend
- Multi-language support with next-intl
- Login modal with OAuth integration

**Backend**: Full implementation ready ✅
- All CRUD endpoints functional
- Practice mode APIs complete
- OAuth authentication (Google & GitHub)
- Session-based auth with Passport.js
- Multi-language API support
- User-specific data isolation
- Tested and working

### Completed Features
- ✅ Frontend → Backend API connection
- ✅ Create Topic via Dialog form
- ✅ Create Question via Dialog form
- ✅ Edit Topic functionality
- ✅ Edit Question functionality
- ✅ Delete Topic (with confirmation)
- ✅ Delete Question (with confirmation)
- ✅ Toggle favorite on questions (user-specific)
- ✅ Real-time data fetching from backend
- ✅ Loading states during API calls
- ✅ Error handling with toast notifications
- ✅ Dark mode (full theme support across all components)
- ✅ Search functionality for questions and topics
- ✅ Toast notifications (sonner) for all user actions
- ✅ Google OAuth authentication
- ✅ GitHub OAuth authentication
- ✅ Session-based authentication
- ✅ User profile management
- ✅ User-specific question data (favorites, status)
- ✅ Multi-language support (English, Vietnamese)
- ✅ Language switcher in header
- ✅ Locale-based routing (/en/*, /vi/*)
- ✅ Localized UI messages

### Immediate Next Steps

1. **Advanced Filters (Phase 3)**
   - Add filter dropdowns for level, status, topic
   - URL query params for shareable filtered views
   - Filter presets (favorites, due for review, etc.)

2. **Remaining UX (Phase 4)**
   - Mobile responsive navigation improvements
   - Keyboard shortcuts (k for practice, t for topics, q for questions)

3. **Extended Features (Phase 6)**
   - AI-assisted practice with follow-up questions
   - Spaced repetition algorithm for review scheduling
   - Tags system for better question organization
   - Statistics & analytics dashboard

---

*Last updated: February 3, 2026 - Authentication (OAuth), Multi-language (i18n), User Features Complete*
