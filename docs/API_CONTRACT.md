# API Contract

Base URL: `http://localhost:9001/api`

All endpoints accept and return JSON. Authentication uses HTTP-only session cookies (set automatically after OAuth login).

---

## Authentication

### `GET /api/auth/google`
Redirect to Google OAuth consent screen.

### `GET /api/auth/google/callback`
Google OAuth callback. Redirects to frontend on success.

### `GET /api/auth/github`
Redirect to GitHub OAuth consent screen.

### `GET /api/auth/github/callback`
GitHub OAuth callback. Redirects to frontend on success.

### `GET /api/auth/me`
Get current authenticated user.

**Auth required:** Yes

**Response `200`**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Alice",
  "avatar": "https://...",
  "provider": "google",
  "role": "user"
}
```

**Response `401`** — Not authenticated

### `POST /api/auth/logout`
Logout and clear session.

**Response `200`**

---

## Topics

### `GET /api/topics`
List all approved topics.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Filter by name/description |
| locale | string | Response locale (`en`, `vi`) |

**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "JavaScript",
    "slug": "javascript",
    "color": "#F7DF1E",
    "icon": "FileCode",
    "description": "...",
    "questionsCount": 12,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### `GET /api/topics/:id`
Get topic by ID or slug.

**Response `200`** — Topic object (same shape as above)
**Response `404`** — Topic not found

### `POST /api/topics`
Create a topic. **Requires MODERATOR or ADMIN.**

**Auth required:** Yes (role: moderator, admin)

**Body:**
```json
{
  "name": "TypeScript",
  "slug": "typescript",
  "color": "#3178C6",
  "icon": "Code",
  "description": "Typed JavaScript"
}
```

**Response `201`** — Created topic object

### `PUT /api/topics/:id`
Update a topic. **Requires MODERATOR or ADMIN.**

**Auth required:** Yes (role: moderator, admin)

**Body:** Partial topic fields (same as POST)

**Response `200`** — Updated topic object

### `DELETE /api/topics/:id`
Delete a topic and all its questions. **Requires MODERATOR or ADMIN.**

**Auth required:** Yes (role: moderator, admin)

**Response `200`**

---

## Questions

### `GET /api/questions`
List questions. Public users see only `approved` questions. Owners see their own `pending_review`/`rejected` questions. MOD/ADMIN see all.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| search | string | Full-text search in title/content |
| topicId | uuid | Filter by topic |
| level | `junior`\|`middle`\|`senior` | Filter by level |
| status | `new`\|`learning`\|`mastered` | Filter by learning status |
| favorites | boolean | Show only user's favorites |
| due | boolean | Show only due-for-review questions |
| locale | string | Response locale |

**Response `200`**
```json
[
  {
    "id": "uuid",
    "title": "Explain Event Loop",
    "content": "...",
    "answer": "...",
    "level": "middle",
    "status": "new",
    "contentStatus": "approved",
    "practiceCount": 3,
    "nextReviewAt": "2024-02-01T00:00:00Z",
    "topic": { "id": "uuid", "name": "JavaScript", "color": "#F7DF1E" },
    "isFavorite": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### `GET /api/questions/:id`
Get question by ID.

**Response `200`** — Full question object
**Response `404`** — Not found

### `POST /api/questions`
Create a question.

**Auth required:** Yes

**Behavior by role:**
- `user` → `contentStatus = 'pending_review'`
- `moderator` / `admin` → `contentStatus = 'approved'`

**Body:**
```json
{
  "title": "Explain Event Loop",
  "content": "Detailed question...",
  "answer": "Detailed answer...",
  "topicId": "uuid",
  "level": "middle"
}
```

**Response `201`** — Created question object

### `PUT /api/questions/:id`
Update a question.

**Auth required:** Yes (owner, moderator, or admin)

**Behavior by role:**
- `user` editing an `approved` question → creates `question_revision`, original unchanged
- `user` editing own `pending_review` question → updates in-place
- `moderator` / `admin` → direct edit, always `approved`

**Body:** Partial question fields

**Response `200`** — Updated question object (or original question if revision was created)

### `DELETE /api/questions/:id`
Delete a question.

**Auth required:** Yes (owner, moderator, or admin)

**Response `200`**

### `PATCH /api/questions/:id/favorite`
Toggle favorite for the current user.

**Auth required:** Yes

**Response `200`**
```json
{ "isFavorite": true }
```

### `PATCH /api/questions/:id/status`
Update learning status for the current user.

**Auth required:** Yes

**Body:**
```json
{ "status": "mastered" }
```

**Response `200`** — Updated question object

---

## Practice

### `GET /api/practice/random`
Get a random question for practice.

**Auth required:** No (but needed for user-specific filtering)

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| topicId | uuid | Restrict to topic |
| level | string | Restrict to level |
| status | string | Restrict to status |
| excludeQuestionId | uuid | Exclude this question (avoid repeats) |
| mode | `smart`\|`random` | `smart` prioritizes due questions |

**Response `200`** — Question object with `isDue` field
**Response `404`** — No questions available

### `POST /api/practice/log`
Record a practice session result. Triggers SM-2 update.

**Auth required:** No

**Body:**
```json
{
  "questionId": "uuid",
  "selfRating": "good",
  "timeSpentSeconds": 45,
  "notes": "optional notes"
}
```

**Response `201`** — Practice log object

**SM-2 side effects:**
- `practice_count` incremented on question
- `last_practiced_at` updated
- `next_review_at`, `ease_factor`, `interval_days`, `repetitions` recalculated
- Question `status` auto-updated: `great` × 3+ → `mastered`

### `GET /api/practice/stats`
Get practice statistics.

**Auth required:** No

**Response `200`**
```json
{
  "totalQuestions": 50,
  "totalPracticeSessions": 120,
  "totalPracticeTimeMinutes": 240,
  "questionsByStatus": { "new": 20, "learning": 18, "mastered": 12 },
  "questionsByLevel": { "junior": 10, "middle": 25, "senior": 15 },
  "practiceByRating": { "poor": 10, "fair": 20, "good": 55, "great": 35 },
  "questionsNeedingReview": 8,
  "recentLogs": [...]
}
```

### `GET /api/practice/history`
Get practice history.

**Query params:** `limit` (default: 20)

**Response `200`** — Array of practice logs with question details

### `GET /api/practice/due`
Get questions due for review.

**Query params:** `limit` (default: 20)

**Response `200`**
```json
[
  {
    "id": "uuid",
    "title": "...",
    "dueStatus": "overdue",
    "nextReviewAt": "2024-01-15T00:00:00Z",
    "topic": { "name": "JavaScript" }
  }
]
```

`dueStatus` values: `overdue`, `due_today`, `due_tomorrow`, `upcoming`

### `GET /api/practice/due-count`
Get count of due questions (for notification badge).

**Response `200`**
```json
{ "count": 5 }
```

---

## Review (Moderation)

All review endpoints require **MODERATOR or ADMIN** role.

### `GET /api/review/pending`
Get all pending questions and revisions.

**Response `200`**
```json
{
  "questions": [...],
  "revisions": [...]
}
```

### `GET /api/review/pending/count`
Get count of pending items.

**Response `200`**
```json
{ "count": 3 }
```

### `GET /api/review/revisions/:id`
Get revision detail with original question for diff comparison.

**Response `200`**
```json
{
  "id": "uuid",
  "title": "Proposed title",
  "content": "...",
  "contentStatus": "pending_review",
  "submitter": { "id": "uuid", "name": "Alice" },
  "question": {
    "id": "uuid",
    "title": "Original title",
    "content": "..."
  },
  "createdAt": "..."
}
```

### `POST /api/review/questions/:id/approve`
Approve a pending question.

**Body:** `{ "note": "optional note" }`

**Response `200`** — Updated question object

### `POST /api/review/questions/:id/reject`
Reject a pending question.

**Body:** `{ "note": "Reason for rejection" }` *(required)*

**Response `200`** — Updated question object

### `POST /api/review/revisions/:id/approve`
Approve a pending revision. Copies revision fields into the original question.

**Body:** `{ "note": "optional note" }`

**Response `200`** — Updated question object

### `POST /api/review/revisions/:id/reject`
Reject a pending revision.

**Body:** `{ "note": "Reason for rejection" }` *(required)*

**Response `200`** — Updated revision object

### `GET /api/review/history`
Get review audit log.

**Query params:** `limit` (default: 50)

**Response `200`** — Array of `content_reviews` entries with reviewer info

---

## Admin

All admin endpoints require **ADMIN** role.

### `GET /api/admin/users`
List all users.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Alice",
    "avatar": "https://...",
    "provider": "google",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### `PATCH /api/admin/users/:id/role`
Change a user's role.

**Body:**
```json
{ "role": "moderator" }
```

Valid values: `user`, `moderator`, `admin`

**Response `200`** — Updated user object

---

## Translations

### `GET /api/translations`
Get translations for the current locale (from `Accept-Language` header).

### `GET /api/translations/:locale`
Get translations for a specific locale (`en` or `vi`).

**Response `200`**
```json
{
  "topics": { "javascript": { "name": "JavaScript", "description": "..." } }
}
```

---

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Validation error details",
  "error": "Bad Request"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error / bad input |
| 401 | Not authenticated |
| 403 | Insufficient role / forbidden |
| 404 | Resource not found |
| 500 | Internal server error |
