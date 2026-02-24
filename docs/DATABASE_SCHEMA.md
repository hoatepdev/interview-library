# Database Schema

PostgreSQL 16. Extension required: `pgcrypto`.

## Migrations

| Migration | Description |
|-----------|-------------|
| `1771845985469-InitialSchema` | Base schema: topics, questions, users, practice, translations |
| `1771999999999-AddRbacAndContentApproval` | RBAC roles, content_status, question_revisions, content_reviews |
| `1772000000000-RemoveGlobalSm2FromQuestions` | Move SM-2 state exclusively to user_questions, drop global SM-2 columns from questions |
| `1772100000000-RemoveStatusFromQuestions` | Drop `status` column from questions (now derived from user_questions.repetitions) |
| `1772200000000-RenameOrderToDisplayOrder` | Rename reserved-keyword column `order` to `display_order` in questions |
| `1772200000000-AddSoftDelete` | Add soft delete (`deleted_at`, `deleted_by`) to users, topics, questions, question_revisions, user_questions; replace CASCADE with RESTRICT/SET NULL on critical FKs; partial unique indexes |

Run migrations: `pnpm db:migrate`

---

## Soft Delete

All primary tables (`users`, `topics`, `questions`, `question_revisions`, `user_questions`) support soft delete via TypeORM's `@DeleteDateColumn`. Rows are never physically removed — `deleted_at` is set to the current timestamp and `deleted_by` records who performed the deletion.

- **Unique constraints** are replaced with partial unique indexes filtered by `WHERE deleted_at IS NULL`, allowing soft-deleted rows to coexist without violating uniqueness.
- **Restore** clears `deleted_at` and `deleted_by`, re-activating the row.
- **Immutable log tables** (`practice_logs`, `content_reviews`) do not use soft delete.

Utility functions: `softDelete()`, `restore()`, `findWithDeleted()` in `src/common/utils/soft-delete.util.ts`.

---

## Tables

### users
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| email | VARCHAR(255) | NOT NULL | Partial unique: `WHERE deleted_at IS NULL` |
| name | VARCHAR(255) | NULLABLE | |
| avatar | TEXT | NULLABLE | Avatar URL |
| provider | VARCHAR(50) | NOT NULL, DEFAULT 'google' | OAuth provider |
| provider_id | VARCHAR(255) | NOT NULL | Partial unique: `WHERE deleted_at IS NULL` |
| role | user_role_enum | NOT NULL, DEFAULT 'user' | RBAC role |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |
| deleted_by | UUID | NULLABLE, FK → users(id) SET NULL | Who deleted |

---

### topics
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| name | VARCHAR(100) | NOT NULL | English default |
| slug | VARCHAR(100) | NOT NULL | Partial unique: `WHERE deleted_at IS NULL` |
| color | VARCHAR(7) | NULLABLE | Hex e.g. `#3B82F6` |
| icon | VARCHAR(50) | NULLABLE | Icon name e.g. `FileCode` |
| description | TEXT | NULLABLE | |
| content_status | content_status_enum | NOT NULL, DEFAULT 'approved' | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |
| deleted_by | UUID | NULLABLE, FK → users(id) SET NULL | Who deleted |

---

### topic_translations
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, GENERATED ALWAYS AS IDENTITY | Auto-increment |
| topic_id | UUID | NOT NULL, FK → topics(id) CASCADE | |
| locale | VARCHAR(5) | NOT NULL | `en`, `vi` |
| name | VARCHAR(100) | NOT NULL | Localized name |
| description | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(topic_id, locale)`

---

### questions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| title | VARCHAR(255) | NOT NULL | English default |
| content | TEXT | NOT NULL | |
| answer | TEXT | NULLABLE | |
| topic_id | UUID | NOT NULL, FK → topics(id) RESTRICT | |
| user_id | UUID | NULLABLE, FK → users(id) SET NULL | NULL = system question |
| level | question_level | NOT NULL, DEFAULT 'middle' | |
| content_status | content_status_enum | NOT NULL, DEFAULT 'approved' | Moderation status |
| review_note | TEXT | NULLABLE | Moderator rejection note |
| difficulty_score | INTEGER | DEFAULT 0 | |
| display_order | INTEGER | DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |
| deleted_by | UUID | NULLABLE, FK → users(id) SET NULL | Who deleted |

---

### question_translations
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGINT | PK, GENERATED ALWAYS AS IDENTITY | |
| question_id | UUID | NOT NULL, FK → questions(id) CASCADE | |
| locale | VARCHAR(5) | NOT NULL | |
| title | VARCHAR(255) | NOT NULL | |
| content | TEXT | NOT NULL | |
| answer | TEXT | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique:** `(question_id, locale)`

---

### question_revisions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| question_id | UUID | NOT NULL, FK → questions(id) RESTRICT | Original question |
| submitted_by | UUID | NULLABLE, FK → users(id) SET NULL | Submitter |
| title | VARCHAR(255) | NOT NULL | Proposed title |
| content | TEXT | NOT NULL | Proposed content |
| answer | TEXT | NULLABLE | |
| level | question_level | NULLABLE | Proposed level (if changed) |
| topic_id | UUID | NULLABLE, FK → topics(id) | Proposed topic (if changed) |
| content_status | content_status_enum | NOT NULL, DEFAULT 'pending_review' | |
| review_note | TEXT | NULLABLE | Moderator feedback |
| reviewed_by | UUID | NULLABLE, FK → users(id) SET NULL | |
| reviewed_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |
| deleted_by | UUID | NULLABLE, FK → users(id) SET NULL | Who deleted |

---

### content_reviews
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| target_type | review_target_type_enum | NOT NULL | `question` or `question_revision` |
| target_id | UUID | NOT NULL | ID of reviewed item |
| action | review_action_enum | NOT NULL | `approved` or `rejected` |
| note | TEXT | NULLABLE | |
| reviewer_id | UUID | NULLABLE, FK → users(id) SET NULL | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

---

### user_questions
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| user_id | UUID | NOT NULL, FK → users(id) RESTRICT | |
| question_id | UUID | NOT NULL, FK → questions(id) RESTRICT | |
| status | question_status | NOT NULL, DEFAULT 'new' | |
| is_favorite | BOOLEAN | DEFAULT false | |
| next_review_at | TIMESTAMPTZ | NULLABLE | Per-user SM-2 |
| ease_factor | NUMERIC(4,2) | DEFAULT 2.5, CHECK >= 1.3 | Per-user SM-2 |
| interval_days | INTEGER | DEFAULT 0, CHECK >= 0 | |
| repetitions | INTEGER | DEFAULT 0, CHECK >= 0 | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |
| deleted_at | TIMESTAMP | NULLABLE | Soft delete timestamp |
| deleted_by | UUID | NULLABLE, FK → users(id) SET NULL | Who deleted |

**PK:** `(user_id, question_id)`
**Partial unique:** `(user_id, question_id) WHERE deleted_at IS NULL`

---

### practice_logs
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| question_id | UUID | NOT NULL, FK → questions(id) CASCADE | |
| user_id | UUID | NULLABLE, FK → users(id) SET NULL | |
| self_rating | self_rating | NOT NULL | |
| time_spent_seconds | INTEGER | NULLABLE, CHECK > 0 | |
| notes | TEXT | NULLABLE | |
| practiced_at | TIMESTAMPTZ | DEFAULT now() | |

---

## Enums

| Enum | Values |
|------|--------|
| `user_role_enum` | `user`, `moderator`, `admin` |
| `content_status_enum` | `draft`, `pending_review`, `approved`, `rejected` |
| `question_level` | `junior`, `middle`, `senior` |
| `question_status` | `new`, `learning`, `mastered` |
| `self_rating` | `poor`, `fair`, `good`, `great` |
| `review_action_enum` | `approved`, `rejected` |
| `review_target_type_enum` | `question`, `question_revision` |

---

## Derived Status

The `questions` table no longer stores a `status` column. Question status is derived at runtime from the per-user SM-2 state in `user_questions.repetitions`:

| Repetitions | Status |
|------------|--------|
| 0 | `new` |
| 1–3 | `learning` |
| >= 4 | `mastered` |

See `getQuestionStatus()` in `src/common/utils/question-status.util.ts`.

---

## Relationships

```
users ──────────────────────────────────────────────────────────┐
  ├─ 1:N ─ questions (user_id, nullable → SET NULL)             │
  ├─ 1:N ─ user_questions (user_id → RESTRICT)                  │
  ├─ 1:N ─ practice_logs (user_id, nullable → SET NULL)         │
  ├─ 1:N ─ question_revisions (submitted_by, nullable → SET NULL)│
  ├─ 1:N ─ question_revisions (reviewed_by, nullable)           │
  └─ 1:N ─ content_reviews (reviewer_id, nullable → SET NULL)   │
                                                                 │
topics                                                           │
  ├─ 1:N ─ topic_translations (topic_id → CASCADE)              │
  └─ 1:N ─ questions (topic_id → RESTRICT)                      │
                                                                 │
questions ◄─────────────────────────────────────────────────────┘
  ├─ 1:N ─ question_translations (question_id → CASCADE)
  ├─ 1:N ─ user_questions (question_id → RESTRICT)
  ├─ 1:N ─ practice_logs (question_id → CASCADE)
  └─ 1:N ─ question_revisions (question_id → RESTRICT)
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

### Soft Delete Workflow

```
Delete (user/question/topic/revision)
  → deleted_at = NOW(), deleted_by = acting user's ID
  → Row excluded from normal queries via TypeORM @DeleteDateColumn
  → Partial unique indexes ensure uniqueness only among active rows

Restore (admin only)
  → deleted_at = NULL, deleted_by = NULL
  → Row becomes active again

Deactivated user login attempt
  → Blocked with ForbiddenException ("account deactivated")
```

### Spaced Repetition (SM-2)

SM-2 state lives exclusively in `user_questions` (`ease_factor`, `interval_days`, `repetitions`, `next_review_at`). Each authenticated user has their own spaced repetition progress per question. Unauthenticated practice sessions are logged but do not track SM-2 state.

Self-rating drives the algorithm:
- `great` → increase interval and ease factor
- `good` → increase interval, ease factor unchanged
- `fair` → reset interval, ease factor decreases
- `poor` → reset to beginning, ease factor decreases

### Cascade Behavior

| FK | On Delete |
|----|-----------|
| questions → topics | RESTRICT |
| questions → users | SET NULL |
| question_translations → questions | CASCADE |
| topic_translations → topics | CASCADE |
| user_questions → users | RESTRICT |
| user_questions → questions | RESTRICT |
| practice_logs → questions | CASCADE |
| practice_logs → users | SET NULL |
| question_revisions → questions | RESTRICT |
| question_revisions → users (submitted_by) | SET NULL |
| content_reviews → users (reviewer_id) | SET NULL |
| *.deleted_by → users | SET NULL |
