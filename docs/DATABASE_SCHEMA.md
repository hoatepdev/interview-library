# Database Schema

PostgreSQL 16. Extension required: `uuid-ossp`.

## Migrations

| Migration | Description |
|-----------|-------------|
| `1771845985469-InitialSchema` | Base schema: topics, questions, users, practice, translations |
| `1771999999999-AddRbacAndContentApproval` | RBAC roles, content_status, question_revisions, content_reviews |

Run migrations: `pnpm db:migrate`

---

## Tables

### users
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| email | VARCHAR | UNIQUE, NOT NULL | |
| name | VARCHAR | NULLABLE | |
| avatar | VARCHAR | NULLABLE | Avatar URL |
| provider | VARCHAR | NOT NULL, DEFAULT 'google' | OAuth provider |
| provider_id | VARCHAR | UNIQUE, NOT NULL | Provider-specific ID |
| role | user_role_enum | NOT NULL, DEFAULT 'user' | RBAC role |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

---

### topics
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| name | VARCHAR(100) | NOT NULL | English default |
| slug | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly |
| color | VARCHAR(7) | NULLABLE | Hex e.g. `#3B82F6` |
| icon | VARCHAR(50) | NULLABLE | Icon name e.g. `FileCode` |
| description | TEXT | NULLABLE | |
| content_status | content_status_enum | NOT NULL, DEFAULT 'approved' | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

---

### topic_translations
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | Auto-increment |
| topic_id | UUID | NOT NULL, FK → topics(id) CASCADE | |
| locale | VARCHAR(5) | NOT NULL | `en`, `vi` |
| name | VARCHAR(100) | NOT NULL | Localized name |
| description | TEXT | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

**Unique:** `(topic_id, locale)`

---

### questions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| title | VARCHAR(255) | NOT NULL | English default |
| content | TEXT | NOT NULL | |
| answer | TEXT | NULLABLE | |
| topic_id | UUID | NOT NULL, FK → topics(id) CASCADE | |
| user_id | UUID | NULLABLE, FK → users(id) CASCADE | NULL = system question |
| level | questions_level_enum | NOT NULL, DEFAULT 'middle' | |
| status | questions_status_enum | NOT NULL, DEFAULT 'new' | Learning progress |
| content_status | content_status_enum | NOT NULL, DEFAULT 'approved' | Moderation status |
| review_note | TEXT | NULLABLE | Moderator rejection note |
| difficulty_score | INTEGER | DEFAULT 0 | |
| practice_count | INTEGER | DEFAULT 0 | |
| last_practiced_at | TIMESTAMP | NULLABLE | |
| next_review_at | TIMESTAMP | NULLABLE | SM-2 next due date |
| ease_factor | NUMERIC(4,2) | DEFAULT 2.5 | SM-2 ease factor |
| interval_days | INTEGER | DEFAULT 0 | SM-2 interval |
| repetitions | INTEGER | DEFAULT 0 | SM-2 successful reps |
| order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

---

### question_translations
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| question_id | UUID | NOT NULL, FK → questions(id) CASCADE | |
| locale | VARCHAR(5) | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| content | TEXT | NOT NULL | |
| answer | TEXT | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

**Unique:** `(question_id, locale)`

---

### question_revisions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| question_id | UUID | NOT NULL, FK → questions(id) CASCADE | Original question |
| submitted_by | UUID | NOT NULL, FK → users(id) | Submitter |
| title | VARCHAR(255) | NOT NULL | Proposed title |
| content | TEXT | NOT NULL | Proposed content |
| answer | TEXT | NULLABLE | |
| level | questions_level_enum | NULLABLE | Proposed level (if changed) |
| topic_id | UUID | NULLABLE, FK → topics(id) | Proposed topic (if changed) |
| content_status | content_status_enum | NOT NULL, DEFAULT 'pending_review' | |
| review_note | TEXT | NULLABLE | Moderator feedback |
| reviewed_by | UUID | NULLABLE, FK → users(id) | |
| reviewed_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT now() | |

---

### content_reviews
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| target_type | review_target_type_enum | NOT NULL | `question` or `question_revision` |
| target_id | UUID | NOT NULL | ID of reviewed item |
| action | review_action_enum | NOT NULL | `approved` or `rejected` |
| note | TEXT | NULLABLE | |
| reviewer_id | UUID | NOT NULL, FK → users(id) | |
| created_at | TIMESTAMP | DEFAULT now() | |

---

### user_questions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| user_id | UUID | NOT NULL, FK → users(id) CASCADE | |
| question_id | UUID | NOT NULL, FK → questions(id) CASCADE | |
| is_public | BOOLEAN | DEFAULT false | |
| is_favorite | BOOLEAN | DEFAULT false | |
| next_review_at | TIMESTAMP | NULLABLE | Per-user SM-2 |
| ease_factor | NUMERIC(4,2) | DEFAULT 2.5 | Per-user SM-2 |
| interval_days | INTEGER | DEFAULT 0 | |
| repetitions | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMP | DEFAULT now() | |
| updated_at | TIMESTAMP | DEFAULT now() | |

**Unique:** `(user_id, question_id)`

---

### practice_logs
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | |
| question_id | UUID | NOT NULL, FK → questions(id) CASCADE | |
| user_id | UUID | NULLABLE, FK → users(id) SET NULL | |
| self_rating | practice_logs_self_rating_enum | NOT NULL | |
| time_spent_seconds | INTEGER | NULLABLE | |
| notes | TEXT | NULLABLE | |
| practiced_at | TIMESTAMP | DEFAULT now() | |

---

## Enums

| Enum | Values |
|------|--------|
| `user_role_enum` | `user`, `moderator`, `admin` |
| `content_status_enum` | `draft`, `pending_review`, `approved`, `rejected` |
| `questions_level_enum` | `junior`, `middle`, `senior` |
| `questions_status_enum` | `new`, `learning`, `mastered` |
| `practice_logs_self_rating_enum` | `poor`, `fair`, `good`, `great` |
| `review_action_enum` | `approved`, `rejected` |
| `review_target_type_enum` | `question`, `question_revision` |

---

## Relationships

```
users ──────────────────────────────────────────────────────────┐
  ├─ 1:N ─ questions (user_id, nullable)                        │
  ├─ 1:N ─ user_questions (user_id)                             │
  ├─ 1:N ─ practice_logs (user_id, nullable → SET NULL)         │
  ├─ 1:N ─ question_revisions (submitted_by)                    │
  ├─ 1:N ─ question_revisions (reviewed_by, nullable)           │
  └─ 1:N ─ content_reviews (reviewer_id)                        │
                                                                 │
topics                                                           │
  ├─ 1:N ─ topic_translations (topic_id → CASCADE)              │
  └─ 1:N ─ questions (topic_id → CASCADE)                       │
                                                                 │
questions ◄─────────────────────────────────────────────────────┘
  ├─ 1:N ─ question_translations (question_id → CASCADE)
  ├─ 1:N ─ user_questions (question_id → CASCADE)
  ├─ 1:N ─ practice_logs (question_id → CASCADE)
  └─ 1:N ─ question_revisions (question_id → CASCADE)
```

---

## Notes

### Content Approval Workflow

```
USER creates question
  → content_status = 'pending_review'

MOD/ADMIN creates question
  → content_status = 'approved' (bypass review)

Moderator approves question
  → content_status = 'approved'
  → entry added to content_reviews

Moderator rejects question
  → content_status = 'rejected', review_note set
  → entry added to content_reviews

USER edits an approved question
  → question_revisions row created (content_status = 'pending_review')
  → original question fields unchanged

Moderator approves revision
  → revision fields copied into question
  → revision content_status = 'approved'

Moderator rejects revision
  → revision content_status = 'rejected', review_note set
```

### Spaced Repetition (SM-2)

Questions and user_questions both carry SM-2 fields (`ease_factor`, `interval_days`, `repetitions`, `next_review_at`). Per-user state lives in `user_questions`. The global fields on `questions` track aggregate state for system questions practiced without a user session.

Self-rating drives the algorithm:
- `great` → increase interval and ease factor
- `good` → increase interval, ease factor unchanged
- `fair` → reset interval, ease factor decreases
- `poor` → reset to beginning, ease factor decreases

### Cascade Behavior

| FK | On Delete |
|----|-----------|
| questions → topics | CASCADE |
| questions → users | CASCADE |
| question_translations → questions | CASCADE |
| topic_translations → topics | CASCADE |
| user_questions → users/questions | CASCADE |
| practice_logs → questions | CASCADE |
| practice_logs → users | SET NULL |
| question_revisions → questions | CASCADE |
