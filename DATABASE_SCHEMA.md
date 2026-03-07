# Database Schema

PostgreSQL 16. ORM: TypeORM with migrations. All timestamps are stored in UTC.

---

## Enums

### `user_role`
| Value | Description |
|-------|-------------|
| `user` | Default role for all new accounts |
| `moderator` | Can approve / reject questions and revisions |
| `admin` | Full access including user management; the first user to sign in is automatically promoted |

### `content_status`
| Value | Description |
|-------|-------------|
| `pending_review` | Awaiting moderation (questions submitted by `user` role) |
| `approved` | Visible to all users |
| `rejected` | Declined by a moderator; still stored for audit purposes |

### `question_level`
| Value |
|-------|
| `junior` |
| `middle` |
| `senior` |

### `self_rating`  *(practice feedback)*
| Value | SM-2 quality |
|-------|--------------|
| `poor` | 0 — complete blackout, resets repetition |
| `fair` | 3 — recalled with difficulty |
| `good` | 4 — recalled with minor hesitation |
| `great` | 5 — perfect recall |

### `review_action`
| Value |
|-------|
| `approved` |
| `rejected` |

### `review_target_type`
| Value |
|-------|
| `question` |
| `question_revision` |

### `domain_event_action`
| Value |
|-------|
| `deleted` |
| `restored` |
| `force_deleted` |
| `restore_blocked` |

---

## Tables

### `users`

Stores OAuth-authenticated accounts. The first user to log in is promoted to `admin`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `email` | `varchar` | NOT NULL | |
| `name` | `varchar` | nullable | |
| `avatar` | `varchar` | nullable | URL from OAuth provider |
| `role` | `user_role` | NOT NULL, default `user` | |
| `provider` | `varchar` | NOT NULL, default `google` | OAuth provider name |
| `provider_id` | `varchar` | NOT NULL | Provider-specific user ID |
| `created_at` | `timestamptz` | NOT NULL | Auto-set on insert |
| `updated_at` | `timestamptz` | NOT NULL | Auto-set on update |
| `deleted_at` | `timestamptz` | nullable | Soft-delete timestamp |
| `deleted_by` | `uuid` | nullable, FK → `users.id` SET NULL | Who performed the soft-delete |

---

### `topics`

Subject categories that group questions (e.g., JavaScript, React, SQL).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `name` | `varchar(100)` | NOT NULL | English display name (source of truth) |
| `slug` | `varchar(100)` | NOT NULL | URL-safe identifier; auto-generated from `name` if not provided |
| `color` | `varchar(7)` | nullable | Hex color, e.g. `#F7DF1E` |
| `icon` | `varchar(50)` | nullable | Icon identifier |
| `description` | `text` | nullable | |
| `content_status` | `content_status` | NOT NULL, default `approved` | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |
| `deleted_at` | `timestamptz` | nullable | Soft-delete |
| `deleted_by` | `uuid` | nullable, FK → `users.id` SET NULL | |

**Soft-delete behaviour:** deleting a topic with active questions raises `DomainDeleteBlockedException` unless `force=true`, which cascade-soft-deletes all child questions first.

---

### `topic_translations`

Localised names and descriptions for topics.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `bigint` | PK, auto-increment | |
| `topic_id` | `uuid` | NOT NULL, FK → `topics.id` CASCADE | |
| `locale` | `varchar(5)` | NOT NULL | e.g. `en`, `vi` |
| `name` | `varchar(100)` | NOT NULL | |
| `description` | `text` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

**Unique index:** `(topic_id, locale)`

---

### `questions`

Interview questions. Questions created by `user` role start as `pending_review`; edits to approved questions create a revision instead of an in-place update.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `title` | `varchar(255)` | NOT NULL | English (source of truth) |
| `content` | `text` | NOT NULL | Question body |
| `answer` | `text` | nullable | Model answer |
| `topic_id` | `uuid` | NOT NULL, FK → `topics.id` RESTRICT | |
| `level` | `question_level` | NOT NULL, default `middle` | |
| `user_id` | `uuid` | nullable, FK → `users.id` SET NULL | Original author |
| `difficulty_score` | `int` | NOT NULL, default `0` | Computed / admin-set difficulty |
| `content_status` | `content_status` | NOT NULL, default `approved` | |
| `review_note` | `text` | nullable | Reviewer comment on latest decision |
| `display_order` | `int` | NOT NULL, default `0` | Manual sort within a topic |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |
| `deleted_at` | `timestamptz` | nullable | Soft-delete |
| `deleted_by` | `uuid` | nullable, FK → `users.id` SET NULL | |

---

### `question_translations`

Localised titles, content, and answers for questions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `bigint` | PK, auto-increment | |
| `question_id` | `uuid` | NOT NULL, FK → `questions.id` CASCADE | |
| `locale` | `varchar(5)` | NOT NULL | |
| `title` | `varchar(255)` | NOT NULL | |
| `content` | `text` | NOT NULL | |
| `answer` | `text` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |

**Unique index:** `(question_id, locale)`

---

### `question_revisions`

Proposed edits to existing approved questions, submitted by regular users. A moderator approves or rejects the revision; on approval the parent question's fields are overwritten atomically in a transaction.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `question_id` | `uuid` | NOT NULL, FK → `questions.id` RESTRICT | Target question |
| `submitted_by` | `uuid` | nullable, FK → `users.id` SET NULL | |
| `title` | `varchar(255)` | NOT NULL | Proposed title |
| `content` | `text` | NOT NULL | Proposed content |
| `answer` | `text` | nullable | Proposed answer |
| `level` | `question_level` | nullable | Proposed level (null = keep existing) |
| `topic_id` | `uuid` | nullable | Proposed topic (null = keep existing) |
| `content_status` | `content_status` | NOT NULL, default `pending_review` | |
| `review_note` | `text` | nullable | Reviewer comment |
| `reviewed_by` | `uuid` | nullable, FK → `users.id` SET NULL | |
| `reviewed_at` | `timestamptz` | nullable | |
| `created_at` | `timestamptz` | NOT NULL | |
| `deleted_at` | `timestamptz` | nullable | Soft-delete |
| `deleted_by` | `uuid` | nullable, FK → `users.id` SET NULL | |

---

### `user_questions`

Per-user spaced-repetition state. Created on first practice interaction with a question; updated after every practice session.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` RESTRICT | |
| `question_id` | `uuid` | NOT NULL, FK → `questions.id` RESTRICT | |
| `is_public` | `boolean` | NOT NULL, default `false` | Reserved for future use — not surfaced in UI |
| `is_favorite` | `boolean` | NOT NULL, default `false` | |
| `next_review_at` | `timestamptz` | nullable | null = due immediately |
| `ease_factor` | `decimal(4,2)` | NOT NULL, default `2.5` | SM-2 EF; clamped to `[1.3, 2.5]` |
| `interval_days` | `int` | NOT NULL, default `0` | SM-2 interval |
| `repetitions` | `int` | NOT NULL, default `0` | SM-2 successful repetition count |
| `created_at` | `timestamptz` | NOT NULL | |
| `updated_at` | `timestamptz` | NOT NULL | |
| `deleted_at` | `timestamptz` | nullable | Soft-delete |
| `deleted_by` | `uuid` | nullable, FK → `users.id` SET NULL | |

---

### `practice_logs`

Immutable event log of every practice session. Drives analytics (rating distribution, practice time, streaks).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `question_id` | `uuid` | NOT NULL, FK → `questions.id` CASCADE | |
| `user_id` | `uuid` | nullable, FK → `users.id` SET NULL | |
| `self_rating` | `self_rating` | NOT NULL | User's self-assessment |
| `time_spent_seconds` | `int` | nullable | |
| `notes` | `text` | nullable | Optional free-text notes |
| `practiced_at` | `timestamptz` | NOT NULL | Auto-set on insert (acts as `created_at`) |

---

### `content_reviews`

Audit log of every moderation decision (approve / reject) on questions and revisions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `target_type` | `review_target_type` | NOT NULL | Whether the target is a question or revision |
| `target_id` | `uuid` | NOT NULL | ID of the reviewed entity (polymorphic) |
| `action` | `review_action` | NOT NULL | |
| `note` | `text` | nullable | Reviewer's comment |
| `reviewer_id` | `uuid` | nullable, FK → `users.id` SET NULL | |
| `created_at` | `timestamptz` | NOT NULL | |

---

### `domain_events`

Structured audit trail for soft-delete, restore, and force-delete lifecycle events.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, generated | |
| `entity_type` | `varchar(50)` | NOT NULL | e.g. `topic`, `question` |
| `entity_id` | `uuid` | NOT NULL | ID of the affected entity |
| `action` | `domain_event_action` | NOT NULL | |
| `actor_id` | `uuid` | nullable, FK → `users.id` SET NULL | Who triggered the event |
| `metadata` | `jsonb` | nullable | Extra context (e.g. `cascadedQuestions`, `topicSlug`) |
| `created_at` | `timestamptz` | NOT NULL | |

**Indexes:** `(entity_type, entity_id)`, `(actor_id)`, `(created_at)`

---

## Relationships Summary

```
users ──────────────────────────────────────────────────────────────────
  │  (author)      questions (user_id → SET NULL)
  │  (soft-delete) topics.deleted_by, questions.deleted_by, etc.
  │  (reviewer)    question_revisions.reviewed_by, content_reviews.reviewer_id
  └──────────────────────────────────────────────────────────────────────

topics ──────────────────────────────────────────────────────────────────
  │  1:N  topic_translations  (CASCADE on topic delete)
  └──1:N  questions           (RESTRICT — cannot delete topic with active questions)

questions ───────────────────────────────────────────────────────────────
  │  N:1  topics              (RESTRICT)
  │  1:N  question_translations (CASCADE)
  │  1:N  question_revisions  (RESTRICT)
  │  1:N  user_questions      (RESTRICT)
  └──1:N  practice_logs       (CASCADE)
```

---

## Soft-Delete Pattern

Most entities implement soft-delete via:
- `deleted_at` — TypeORM `@DeleteDateColumn`; populated by `softRemove()` / `softDelete()`
- `deleted_by` — manually set before calling `softRemove()` to record the actor

TypeORM automatically excludes soft-deleted rows from all queries unless `.withDeleted()` is specified or a `@DeleteDateColumn` migration sets it up. The `restore()` utility in `src/common/utils/soft-delete.util.ts` validates parent entities and unique constraints before recovering a row.

---

## Notes

- `user_questions.is_public` — column exists in the schema but is **not used** by any current feature. Reserved for a future "public profile / shared deck" feature.
- `practice_logs.practiced_at` serves as the `created_at` for that table (no separate `created_at` column).
- All FK relations that reference `users` use `ON DELETE SET NULL` to preserve data integrity when a user account is soft-deleted; only `user_questions` and `practice_logs` use `ON DELETE RESTRICT` / `CASCADE` respectively for the owning FK.
