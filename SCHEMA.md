# PostgreSQL Schema Documentation

## Tables

### users
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | User identifier |
| email | VARCHAR | UNIQUE, NOT NULL | User email address |
| name | VARCHAR | NULLABLE | User display name |
| avatar | VARCHAR | NULLABLE | Avatar URL |
| provider | VARCHAR | NOT NULL, DEFAULT 'google' | OAuth provider |
| provider_id | VARCHAR | UNIQUE, NOT NULL | Provider-specific ID |
| created_at | TIMESTAMP | DEFAULT now() | Record creation |
| updated_at | TIMESTAMP | DEFAULT now() | Record update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (email)
- UNIQUE (provider_id)

---

### topics
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Topic identifier |
| name | VARCHAR(100) | NOT NULL | Topic name (English default) |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly slug |
| color | VARCHAR(7) | NULLABLE | Hex color code (e.g. '#3B82F6') |
| icon | VARCHAR(50) | NULLABLE | Icon name (e.g. 'FileCode') |
| description | TEXT | NULLABLE | Topic description |
| created_at | TIMESTAMP | DEFAULT now() | Record creation |
| updated_at | TIMESTAMP | DEFAULT now() | Record update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (slug)

---

### topic_translations
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Translation ID (auto-increment) |
| topic_id | UUID | NOT NULL, FK(topics.id) | Reference to topic |
| locale | VARCHAR(5) | NOT NULL | Language locale (en, vi) |
| name | VARCHAR(100) | NOT NULL | Localized topic name |
| description | TEXT | NULLABLE | Localized description |
| created_at | TIMESTAMP | DEFAULT now() | Record creation |
| updated_at | TIMESTAMP | DEFAULT now() | Record update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (topic_id, locale)
- INDEX (locale)
- FOREIGN KEY (topic_id) → topics(id) ON DELETE CASCADE

---

### questions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Question identifier |
| title | VARCHAR(255) | NOT NULL | Question title (English default) |
| content | TEXT | NOT NULL | Question content |
| answer | TEXT | NULLABLE | Question answer |
| topic_id | UUID | NOT NULL, FK(topics.id) | Reference to topic |
| user_id | UUID | NULLABLE, FK(users.id) | Owner (null = system question) |
| level | ENUM | NOT NULL, DEFAULT 'middle' | junior, middle, senior |
| status | ENUM | NOT NULL, DEFAULT 'new' | new, learning, mastered |
| difficulty_score | INTEGER | DEFAULT 0 | Difficulty rating |
| practice_count | INTEGER | DEFAULT 0 | Total practice attempts |
| last_practiced_at | TIMESTAMP | NULLABLE | Last practice timestamp |
| next_review_at | TIMESTAMP | NULLABLE | Next review due date |
| ease_factor | NUMERIC(4,2) | DEFAULT 2.5 | Spaced repetition ease factor |
| interval_days | INTEGER | DEFAULT 0 | Days until next review |
| repetitions | INTEGER | DEFAULT 0 | Number of successful reps |
| order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | DEFAULT now() | Record creation |
| updated_at | TIMESTAMP | DEFAULT now() | Record update |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (topic_id)
- INDEX (user_id)
- FOREIGN KEY (topic_id) → topics(id) ON DELETE CASCADE
- FOREIGN KEY (user_id) → users(id) ON DELETE CASCADE

**Enums:**
- level: 'junior' | 'middle' | 'senior'
- status: 'new' | 'learning' | 'mastered'

---

### question_translations
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PRIMARY KEY | Translation ID (auto-increment) |
| question_id | UUID | NOT NULL, FK(questions.id) | Reference to question |
| locale | VARCHAR(5) | NOT NULL | Language locale (en, vi) |
| title | VARCHAR(255) | NOT NULL | Localized question title |
| content | TEXT | NOT NULL | Localized question content |
| answer | TEXT | NULLABLE | Localized answer |
| created_at | TIMESTAMP | DEFAULT now() | Record creation |
| updated_at | TIMESTAMP | DEFAULT now() | Record update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (question_id, locale)
- INDEX (locale)
- FOREIGN KEY (question_id) → questions(id) ON DELETE CASCADE

---

### user_questions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Record identifier |
| user_id | UUID | NOT NULL, FK(users.id) | Reference to user |
| question_id | UUID | NOT NULL, FK(questions.id) | Reference to question |
| is_public | BOOLEAN | DEFAULT false | Whether the question is visible publicly |
| is_favorite | BOOLEAN | DEFAULT false | User marked as favorite |
| next_review_at | TIMESTAMP | NULLABLE | User-specific next review due date |
| ease_factor | NUMERIC(4,2) | DEFAULT 2.5 | User-specific ease factor |
| interval_days | INTEGER | DEFAULT 0 | User-specific days until next review |
| repetitions | INTEGER | DEFAULT 0 | User-specific successful rep count |
| created_at | TIMESTAMP | DEFAULT now() | Record creation |
| updated_at | TIMESTAMP | DEFAULT now() | Record update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE (user_id, question_id)
- INDEX (user_id)
- INDEX (question_id)
- FOREIGN KEY (user_id) → users(id) ON DELETE CASCADE
- FOREIGN KEY (question_id) → questions(id) ON DELETE CASCADE

---

### practice_logs
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Log record identifier |
| question_id | UUID | NOT NULL, FK(questions.id) | Reference to question |
| user_id | UUID | NULLABLE, FK(users.id) | Reference to user |
| self_rating | ENUM | NOT NULL | poor, fair, good, great |
| time_spent_seconds | INTEGER | NULLABLE | Practice duration in seconds |
| notes | TEXT | NULLABLE | Session notes |
| practiced_at | TIMESTAMP | DEFAULT now() | Practice timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (question_id)
- INDEX (user_id)
- INDEX (practiced_at)
- FOREIGN KEY (question_id) → questions(id) ON DELETE CASCADE
- FOREIGN KEY (user_id) → users(id) ON DELETE SET NULL

**Enums:**
- self_rating: 'poor' | 'fair' | 'good' | 'great'

---

## Enums

### QuestionLevel
```
'junior'  - Entry-level difficulty
'middle'  - Intermediate difficulty
'senior'  - Advanced difficulty
```

### QuestionStatus
```
'new'      - New, not yet practiced
'learning' - In active learning
'mastered' - Fully mastered
```

### SelfRating
```
'poor'   - Did not know answer (1)
'fair'   - Took effort, partial knowledge (2)
'good'   - Knew answer but took effort (3)
'great'  - Instant recall, confident (4)
```

---

## Entity Relationships

```
users
  ├─ 1:N ─ user_questions (user_id)
  ├─ 1:N ─ practice_logs (user_id)
  └─ 1:N ─ questions (user_id) [nullable - system questions have no owner]

topics
  ├─ 1:N ─ topic_translations (topic_id)
  └─ 1:N ─ questions (topic_id)

questions
  ├─ N:1 ─ topics (topic_id)
  ├─ N:1 ─ users (user_id) [nullable]
  ├─ 1:N ─ question_translations (question_id)
  ├─ 1:N ─ user_questions (question_id)
  └─ 1:N ─ practice_logs (question_id)

user_questions
  ├─ N:1 ─ users (user_id)
  └─ N:1 ─ questions (question_id)

practice_logs
  ├─ N:1 ─ questions (question_id)
  └─ N:1 ─ users (user_id) [nullable]

topic_translations
  └─ N:1 ─ topics (topic_id)

question_translations
  └─ N:1 ─ questions (question_id)
```

---

## Entity Relationship Diagram (Text)

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ id (PK)         │
│ email (U)       │
│ name            │
│ avatar          │
│ provider        │
│ provider_id (U) │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
    ┌────┴──────┬──────────────┐
    │           │              │
    │ 1:N       │ 1:N          │ 1:N (nullable)
    │           │              │
    ▼           ▼              ▼
┌─────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  user_questions     │  │ practice_logs    │  │   questions      │
├─────────────────────┤  ├──────────────────┤  ├──────────────────┤
│ id (PK)             │  │ id (PK)          │  │ id (PK)          │
│ user_id (FK)        │  │ question_id (FK) │  │ title            │
│ question_id (FK, U) │  │ user_id (FK, ∅)  │  │ content          │
│ is_public           │  │ self_rating      │  │ answer           │
│ is_favorite         │  │ time_spent_secs  │  │ topic_id (FK)    │
│ next_review_at      │  │ notes            │  │ user_id (FK, ∅)  │
│ ease_factor         │  │ practiced_at     │  │ level            │
│ interval_days       │  └──────────────────┘  │ status           │
│ repetitions         │                        │ difficulty_score │
│ created_at          │                        │ practice_count   │
│ updated_at          │                        │ last_practiced_at│
└──────────┬──────────┘                        │ next_review_at   │
           │                                   │ ease_factor      │
           │                                   │ interval_days    │
           │                 ┌─────────────────┤ repetitions      │
           │                 │                 │ order            │
           │    ┌────────────┴─┐               │ created_at       │
           │    │              │               │ updated_at       │
           └────┼──────────────┼───────────────┘                  │
                │              │                      ▲           │
                │              │                      │ N:1       │
                │              │              ┌───────┴────────┐  │
                │              │              │                │  │
                │              ▼              ▼                ▼  │
                │         ┌──────────────────────┐  ┌──────────────────────┐
                │         │ question_translations│  │  topic_translations  │
                │         ├──────────────────────┤  ├──────────────────────┤
                │         │ id (PK, BIGSERIAL)   │  │ id (PK, BIGSERIAL)   │
                │         │ question_id (FK, U)  │  │ topic_id (FK, U)     │
                │         │ locale (U)           │  │ locale (U)           │
                │         │ title                │  │ name                 │
                │         │ content              │  │ description          │
                │         │ answer               │  │ created_at           │
                │         │ created_at           │  │ updated_at           │
                │         │ updated_at           │  └──────────┬───────────┘
                │         └──────────────────────┘            │ N:1
                │                                             │
                └─────────────────────────────────┬───────────┘
                                                  │
                                     ┌────────────┴────────────┐
                                     ▼
                             ┌──────────────┐
                             │   topics     │
                             ├──────────────┤
                             │ id (PK)      │
                             │ name         │
                             │ slug (U)     │
                             │ description  │
                             │ color        │
                             │ icon         │
                             │ created_at   │
                             │ updated_at   │
                             └──────────────┘
```

---

## Key Notes

### Migration History
- All previous migrations replaced by single `InitialSchema` migration (timestamp: 1771845985469)
- Extension required: `uuid-ossp` (created in migration)

### Cascade Behavior
- **ON DELETE CASCADE:** Questions deleted when topic/user deleted; translations/logs deleted when questions deleted; user_questions deleted when user or question deleted
- **ON DELETE SET NULL:** Practice logs `user_id` becomes NULL if user deleted (preserves log history)

### Spaced Repetition Tracking
- **Dual tracking**: Global (`questions`) and per-user (`user_questions`)
- Global fields on `questions` track aggregate review schedule for system questions
- `user_questions` fields track each user's personal SM-2 state independently
- Fields: `ease_factor` (NUMERIC 4,2), `interval_days`, `repetitions`, `next_review_at`

### Localization
- English (default) stored directly in `questions`/`topics` tables
- Additional locales stored in `question_translations`/`topic_translations`
- Unique constraint `(foreign_id, locale)` prevents duplicate translations
- Translation IDs use `BIGSERIAL` (auto-increment identity column)

### User Questions
- Many-to-many junction table with UUID PK (not composite)
- Tracks per-user metadata: `is_favorite`, `is_public`, and full spaced rep state
- Unique constraint `(user_id, question_id)` prevents duplicates

### Practice Logs
- Immutable audit trail of all practice sessions
- `user_id` nullable: supports anonymous/unlinked practice records
- Self-rating enum drives SM-2 algorithm in `spaced-repetition.service.ts`

### Question Ownership
- `questions.user_id` nullable: NULL = system question, NOT NULL = user-created question
- Users can create their own questions alongside system questions
