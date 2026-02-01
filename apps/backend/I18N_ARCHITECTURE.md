# i18n Architecture Design

## Overview
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│    Backend  │────▶│   Database   │
│  (next-intl) │     │   (NestJS)   │     │ (PostgreSQL) │
└─────────────┘     └─────────────┘     └─────────────┘
      │                     │                      │
      │                     │                      │
   UI Text              Content               Data Storage
   translations        translations
```

## Language Priority (Chain)
1. **URL Path** - `/en/...`, `/vi/...` (Frontend control)
2. **Query Param** - `?lang=vi` (API override)
3. **Accept-Language** - Header fallback (Backend default)
4. **Fallback** - `en` (Always available)

## Database Schema

### Approach: JSONB + Fallback Column
```sql
-- Topics table
ALTER TABLE topics
  ADD COLUMN translations JSONB DEFAULT '{}' NOT NULL;

-- translations structure:
-- {"en": {"name": "JavaScript", "description": "..."},
--  "vi": {"name": "JavaScript", "description": "..."}}

-- Keep existing columns as fallback (en)
-- name, description remain as is
```

```sql
-- Questions table
ALTER TABLE questions
  ADD COLUMN translations JSONB DEFAULT '{}' NOT NULL;

-- translations structure:
-- {"en": {"title": "...", "content": "...", "answer": "..."},
--  "vi": {"title": "...", "content": "...", "answer": "..."}}
```

## Backend Flow

```
Request → [I18n Middleware]
           ├─ Parse lang: query param → Accept-Language → 'en'
           └─ Attach to request: request.i18n.lang
           ↓
     [Service Layer]
           ├─ getTranslatedField(entity, 'name', lang)
           ├─ Returns: translations[lang]?.name ?? entity.name
           └─ Null-safe fallback chain
           ↓
     [Response]
           ├─ DTO includes: original + translation (if available)
           └─ Format: { id, name, nameVi: "..." }
```

## API Contract

### Request
```
GET /api/topics?lang=vi
Accept-Language: vi
```

### Response
```json
{
  "id": "uuid",
  "name": "JavaScript",           // original (en)
  "description": "...",           // original (en)
  "translations": {
    "vi": {
      "name": "JavaScript",
      "description": "..."
    }
  }
}
```
