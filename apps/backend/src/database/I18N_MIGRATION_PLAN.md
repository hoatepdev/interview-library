# Multi-Language Migration Plan: Translation Tables Approach

## Executive Summary

Migration from JSONB-based translations to normalized translation tables for production-scale multi-language support.

**Current State:** JSONB `translations` column in `topics` and `questions` tables
**Target State:** Separate `topic_translations` and `question_translations` tables with proper foreign keys

---

## 1. Final Database Schema

### 1.1 Core Tables (Keep Existing)

```sql
-- topics table (remove translations column)
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,        -- English (default)
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  description TEXT,                  -- English (default)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- questions table (remove translations column)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,       -- English (default)
  content TEXT NOT NULL,             -- English (default)
  answer TEXT,                       -- English (default)
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  level VARCHAR(20) DEFAULT 'middle',
  status VARCHAR(20) DEFAULT 'new',
  is_favorite BOOLEAN DEFAULT FALSE,
  difficulty_score INT DEFAULT 0,
  practice_count INT DEFAULT 0,
  last_practiced_at TIMESTAMP,
  "order" INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 1.2 Translation Tables (New)

```sql
-- topic_translations
CREATE TABLE topic_translations (
  id BIGSERIAL PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,        -- 'en', 'vi', etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(topic_id, locale),
  CONSTRAINT check_locale_format CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  CONSTRAINT check_translation_content CHECK (
    (name IS NOT NULL AND name != '') OR
    (description IS NOT NULL)
  )
);

-- question_translations
CREATE TABLE question_translations (
  id BIGSERIAL PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,        -- 'en', 'vi', etc.
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(question_id, locale),
  CONSTRAINT check_locale_format CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
);
```

### 1.3 Indexes (Performance)

```sql
-- topic_translations indexes
CREATE INDEX idx_topic_translations_topic_id ON topic_translations(topic_id);
CREATE INDEX idx_topic_translations_locale ON topic_translations(locale);
CREATE INDEX idx_topic_translations_name_trgm ON topic_translations USING gin(name gin_trgm_ops);
CREATE INDEX idx_topic_translations_desc_trgm ON topic_translations USING gin(description gin_trgm_ops);

-- question_translations indexes
CREATE INDEX idx_question_translations_question_id ON question_translations(question_id);
CREATE INDEX idx_question_translations_locale ON question_translations(locale);
CREATE INDEX idx_question_translations_title_trgm ON question_translations USING gin(title gin_trgm_ops);
CREATE INDEX idx_question_translations_content_trgm ON question_translations USING gin(content gin_trgm_ops);
```

### 1.4 Supported Languages Table (Optional, for Validation)

```sql
CREATE TABLE supported_languages (
  code VARCHAR(5) PRIMARY KEY,       -- 'en', 'vi', 'zh-CN', etc.
  name VARCHAR(50) NOT NULL,         -- 'English', 'Vietnamese', etc.
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- Seed data
INSERT INTO supported_languages (code, name, sort_order) VALUES
  ('en', 'English', 0),
  ('vi', 'Tiếng Việt', 1);
```

---

## 2. Migration Plan (Zero Downtime)

### Phase 1: Prepare Infrastructure (No Data Changes)

```sql
-- Step 1.1: Create translation tables
CREATE TABLE topic_translations (
  id BIGSERIAL PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(topic_id, locale)
);

CREATE TABLE question_translations (
  id BIGSERIAL PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  locale VARCHAR(5) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, locale)
);

-- Step 1.2: Create indexes
CREATE INDEX idx_topic_translations_topic_id ON topic_translations(topic_id);
CREATE INDEX idx_topic_translations_locale ON topic_translations(locale);
CREATE INDEX idx_question_translations_question_id ON question_translations(question_id);
CREATE INDEX idx_question_translations_locale ON question_translations(locale);
```

### Phase 2: Migrate Existing Translations

```sql
-- Step 2.1: Migrate topic translations from JSONB
INSERT INTO topic_translations (topic_id, locale, name, description)
SELECT
  t.id,
  jsonb_object_keys(translations) as locale,
  translations->jsonb_object_keys(translations)->>'name' as name,
  translations->jsonb_object_keys(translations)->>'description' as description
FROM topics t
WHERE translations != '{}' AND translations IS NOT NULL;

-- Step 2.2: Migrate question translations from JSONB
INSERT INTO question_translations (question_id, locale, title, content, answer)
SELECT
  q.id,
  jsonb_object_keys(translations) as locale,
  translations->jsonb_object_keys(translations)->>'title' as title,
  translations->jsonb_object_keys(translations)->>'content' as content,
  translations->jsonb_object_keys(translations)->>'answer' as answer
FROM questions q
WHERE translations != '{}' AND translations IS NOT NULL;
```

### Phase 3: Update Application Code

1. Deploy new TypeORM entities with translation relationships
2. Update services to query from translation tables
3. Keep `translations` JSONB column for fallback (dual-read period)

### Phase 4: Verification (1-2 weeks)

- Monitor API response times
- Verify translation accuracy
- Check for any missing translations
- A/B test with small traffic segment

### Phase 5: Cleanup

```sql
-- Step 5.1: Drop old JSONB columns
ALTER TABLE topics DROP COLUMN translations;
ALTER TABLE questions DROP COLUMN translations;

-- Step 5.2: Drop old GIN indexes (if any)
DROP INDEX IF EXISTS idx_topics_translations;
DROP INDEX IF EXISTS idx_questions_translations;
```

---

## 3. TypeORM Entity Definitions

### 3.1 Topic Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TopicTranslation } from './topic-translation.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;  // English (default)

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ length: 7, nullable: true })
  color: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ type: 'text', nullable: true })
  description: string;  // English (default)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => TopicTranslation, translation => translation.topic, cascade: true)
  translations: TopicTranslation[];
}
```

### 3.2 TopicTranslation Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Topic } from './topic.entity';

export type Locale = 'en' | 'vi';

@Entity('topic_translations')
@Index(['topicId', 'locale'], { unique: true })
export class TopicTranslation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'topic_id' })
  topicId: string;

  @Column({ length: 5 })
  locale: Locale;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;
}
```

### 3.3 Question Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Topic } from './topic.entity';
import { QuestionTranslation } from './question-translation.entity';

export enum QuestionLevel {
  JUNIOR = 'junior',
  MIDDLE = 'middle',
  SENIOR = 'senior',
}

export enum QuestionStatus {
  NEW = 'new',
  LEARNING = 'learning',
  MASTERED = 'mastered',
}

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;  // English (default)

  @Column({ type: 'text' })
  content: string;  // English (default)

  @Column({ type: 'text', nullable: true })
  answer: string;  // English (default)

  @Column({ name: 'topic_id' })
  topicId: string;

  @ManyToOne(() => Topic, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: Topic;

  @Column({
    type: 'enum',
    enum: QuestionLevel,
    default: QuestionLevel.MIDDLE,
  })
  level: QuestionLevel;

  @Column({
    type: 'enum',
    enum: QuestionStatus,
    default: QuestionStatus.NEW,
  })
  status: QuestionStatus;

  @Column({ name: 'is_favorite', default: false })
  isFavorite: boolean;

  @Column({ name: 'practice_count', default: 0 })
  practiceCount: number;

  @Column({ name: 'last_practiced_at', nullable: true })
  lastPracticedAt: Date;

  @Column({ type: 'int', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => QuestionTranslation, translation => translation.question, cascade: true)
  translations: QuestionTranslation[];
}
```

### 3.4 QuestionTranslation Entity

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Question } from './question.entity';

export type Locale = 'en' | 'vi';

@Entity('question_translations')
@Index(['questionId', 'locale'], { unique: true })
export class QuestionTranslation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'question_id' })
  questionId: string;

  @Column({ length: 5 })
  locale: Locale;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  answer: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
```

---

## 4. Query Strategy

### 4.1 Single Entity with Translation

```typescript
// Get topic by ID with translation
async findOne(id: string, locale: string = 'en'): Promise<TopicDto> {
  const topic = await this.topicRepository.findOne({
    where: { id },
    relations: ['translations'],
  });

  if (!topic) {
    throw new NotFoundException(`Topic with ID ${id} not found`);
  }

  return this.formatWithTranslation(topic, locale);
}

private formatWithTranslation(topic: Topic, locale: string): TopicDto {
  // Find translation for requested locale
  const translation = topic.translations?.find(t => t.locale === locale);

  return {
    id: topic.id,
    slug: topic.slug,
    color: topic.color,
    icon: topic.icon,
    // Use translation if available, fallback to English (default)
    name: translation?.name || topic.name,
    description: translation?.description || topic.description,
    locale: translation ? locale : 'en',
  };
}
```

### 4.2 Batch Fetch with LEFT JOIN (Optimized)

```typescript
// Get all topics with single query
async findAll(locale: string = 'en'): Promise<TopicDto[]> {
  const query = this.topicRepository
    .createQueryBuilder('topic')
    .leftJoin(
      'topic.translations',
      'translation',
      'translation.locale = :locale'
    )
    .setParameter('locale', locale)
    .select([
      'topic.id',
      'topic.slug',
      'topic.color',
      'topic.icon',
      'topic.name',  // English default
      'topic.description',
      'translation.name',
      'translation.description',
    ]);

  const results = await query.getRawMany();

  return results.map(row => ({
    id: row.topic_id,
    slug: row.topic_slug,
    color: row.topic_color,
    icon: row.topic_icon,
    name: row.translation_name || row.topic_name,
    description: row.translation_description || row.topic_description,
    locale: row.translation_name ? locale : 'en',
  }));
}
```

### 4.3 Questions with Topic Translations

```typescript
async findQuestionsByTopic(topicId: string, locale: string = 'en'): Promise<QuestionDto[]> {
  const questions = await this.questionRepository
    .createQueryBuilder('question')
    .leftJoinAndSelect('question.translations', 'qt', 'qt.locale = :locale')
    .leftJoinAndSelect('question.topic', 'topic')
    .leftJoin('topic.translations', 'tt', 'tt.locale = :locale')
    .setParameter('locale', locale)
    .where('topic.id = :topicId', { topicId })
    .select([
      'question.id',
      'question.level',
      'question.status',
      'question.title',      // English default
      'question.content',
      'question.answer',
      'qt.title',            // Translated
      'qt.content',
      'qt.answer',
      'topic.id',
      'topic.slug',
      'topic.name',          // English default
      'tt.name',             // Translated
    ])
    .getRawMany();

  return questions.map(row => this.formatQuestionWithTranslations(row, locale));
}
```

---

## 5. Fallback Logic

### 5.1 Fallback Chain

```
Requested Locale → Specific Translation → English (default) → NULL
```

### 5.2 Implementation

```typescript
@Injectable()
export class TranslationService {
  getTranslatedField<T extends EntityWithTranslations>(
    entity: T,
    field: keyof T,
    locale: string
  ): string {
    // 1. Check if locale is English (default)
    if (locale === 'en') {
      return entity[field] as string;
    }

    // 2. Find translation for requested locale
    const translation = entity.translations?.find(t => t.locale === locale);

    // 3. Return translated value or fallback to English default
    return translation?.[field] || entity[field] as string;
  }

  /**
   * Get translation with strict fallback
   * Returns null if no translation exists (not even English)
   */
  getTranslationOrDefault<T extends EntityWithTranslations>(
    entity: T,
    field: keyof T,
    locale: string,
    defaultValue?: string
  ): string | null {
    if (locale === 'en') {
      return (entity[field] as string) || defaultValue || null;
    }

    const translation = entity.translations?.find(t => t.locale === locale);
    const translated = translation?.[field] as string;

    if (translated) return translated;

    // Fallback to English
    return (entity[field] as string) || defaultValue || null;
  }
}
```

### 5.3 Missing Translation Detection

```typescript
/**
   * Check if translation is missing for a locale
   */
  isMissingTranslation(entity: EntityWithTranslations, locale: string): boolean {
    if (locale === 'en') return false;  // English is always available
    return !entity.translations?.some(t => t.locale === locale);
  }

  /**
   * Get all entities missing translations for a locale
   */
  async findMissingTranslations(locale: string): Promise<MissingTranslationReport[]> {
    // Topics
    const topicsWithoutTranslation = await this.topicRepository
      .createQueryBuilder('topic')
      .leftJoin('topic.translations', 'translation', 'translation.locale = :locale')
      .setParameter('locale', locale)
      .where('translation.id IS NULL')
      .getCount();

    // Questions
    const questionsWithoutTranslation = await this.questionRepository
      .createQueryBuilder('question')
      .leftJoin('question.translations', 'translation', 'translation.locale = :locale')
      .setParameter('locale', locale)
      .where('translation.id IS NULL')
      .getCount();

    return [
      { entityType: 'topics', locale, missingCount: topicsWithoutTranslation },
      { entityType: 'questions', locale, missingCount: questionsWithoutTranslation },
    ];
  }
```

---

## 6. API Response Shape

### 6.1 Before (Current - JSONB approach)

```json
// GET /api/topics?lang=vi
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "JavaScript",
  "slug": "javascript",
  "description": "Core JavaScript concepts",
  "nameVi": "JavaScript",
  "descriptionVi": "Các khái niệm cốt lõi của JavaScript"
}
```

### 6.2 After (Translation Tables - Recommended)

```json
// GET /api/topics?lang=vi
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "javascript",
  "color": "#F7DF1E",
  "icon": "code",
  "name": "JavaScript",              // Fallback to English
  "description": "Các khái niệm cốt lõi của JavaScript",
  "locale": "vi",                    // Actual locale returned
  "isFallback": false,               // Indicates if fallback was used
  "availableLocales": ["en", "vi"]   // All available translations
}
```

### 6.3 Question Response

```json
// GET /api/questions/abc123?lang=vi
{
  "id": "abc123",
  "title": "Closure là gì?",
  "content": "Định nghĩa closure...",
  "answer": "Closure là...",
  "level": "senior",
  "status": "learning",
  "topic": {
    "id": "550e8400",
    "name": "JavaScript",
    "slug": "javascript"
  },
  "locale": "vi",
  "isFallback": {
    "title": false,
    "content": false,
    "answer": true    // Only answer fell back to English
  },
  "availableLocales": ["en", "vi"]
}
```

---

## 7. Risks & Edge Cases

### 7.1 Data Integrity Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Orphaned translations | References to deleted entities | CASCADE delete already configured |
| Duplicate locale per entity | Conflicting translations | UNIQUE constraint on (entity_id, locale) |
| Invalid locale codes | Query failures | CHECK constraint for locale format |
| Empty translation content | Display issues | NOT NULL constraints on required fields |

### 7.2 Performance Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| N+1 queries on relations | Slow API responses | Use LEFT JOIN with query builder |
| Missing indexes | Slow lookups | Indexes on foreign keys and locale |
| Large text fields | Slow full-text search | GIN indexes with pg_trgm |
| Too many translations | Bloat | Archive old languages, partition by locale |

### 7.3 Edge Cases to Handle

1. **Partial Translations**: Only some fields translated
   - Solution: Per-field fallback tracking in `isFallback` object

2. **Locale Not Supported**: Request for 'zh-CN' when only 'en', 'vi' exist
   - Solution: Return 404 with list of supported locales

3. **Concurrent Translation Updates**: Race conditions
   - Solution: Optimistic locking with `@VersionColumn`

4. **SEO Requirements**: Different URLs per language
   - Solution: Add locale to URL path (/vi/topics, /en/topics)

5. **Search Across Languages**: User searches in English but content is in Vietnamese
   - Solution: Separate search index or multi-language search query

6. **Bulk Operations**: Importing 1000s of questions
   - Solution: Batch insert with `INSERT ... ON CONFLICT` upsert

### 7.4 Rollback Plan

If critical issues are found:

```sql
-- Step 1: Recreate JSONB columns
ALTER TABLE topics ADD COLUMN translations jsonb DEFAULT '{}';
ALTER TABLE questions ADD COLUMN translations jsonb DEFAULT '{}';

-- Step 2: Migrate back from translation tables
UPDATE topics t
SET translations = jsonb_object_agg(
  tr.locale,
  jsonb_build_object(
    'name', tr.name,
    'description', tr.description
  )
)
FROM topic_translations tr
WHERE tr.topic_id = t.id
GROUP BY t.id;

-- Step 3: Drop translation tables
DROP TABLE IF EXISTS question_translations;
DROP TABLE IF EXISTS topic_translations;
```

---

## 8. Future-Ready Considerations

### 8.1 Adding New Languages

```sql
-- No schema changes needed
-- Just insert new translations
INSERT INTO topic_translations (topic_id, locale, name, description)
VALUES ('uuid-here', 'zh-CN', 'JavaScript', 'JavaScript 核心概念');
```

### 8.2 Search & SEO Support

```sql
-- For search: Full-text indexes
CREATE INDEX idx_topic_translations_name_fts
  ON topic_translations USING gin(to_tsvector('english', name));

-- For SEO: Materialized view of slugs per locale
CREATE MATERIALIZED VIEW topic_slugs AS
SELECT
  t.id,
  t.slug,
  tr.locale,
  COALESCE(tr.name, t.name) as localized_name
FROM topics t
LEFT JOIN topic_translations tr ON tr.topic_id = t.id;
```

### 8.3 Multi-User Translation Management

```sql
-- Add audit trail
ALTER TABLE topic_translations
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN updated_by UUID REFERENCES users(id);

-- Add translation status workflow
ALTER TABLE topic_translations
ADD COLUMN status VARCHAR(20) DEFAULT 'draft';  -- draft, review, published
```

### 8.4 Scaling Considerations

```sql
-- Partition by locale for very large datasets
CREATE TABLE question_translations_vi PARTITION OF question_translations
  FOR VALUES IN ('vi');

CREATE TABLE question_translations_en PARTITION OF question_translations
  FOR VALUES IN ('en');

-- Or use declarative partitioning by locale hash
CREATE TABLE question_translations (...)
PARTITION BY HASH (locale);
```

---

## 9. Implementation Checklist

- [ ] Create migration files for translation tables
- [ ] Add indexes for performance
- [ ] Migrate existing JSONB translations to new tables
- [ ] Update TypeORM entities
- [ ] Implement translation service with fallback logic
- [ ] Update API responses to include locale metadata
- [ ] Add API endpoints for CRUD operations on translations
- [ ] Implement missing translation detection
- [ ] Add monitoring for translation coverage
- [ ] Create admin UI for translation management
- [ ] Update documentation
- [ ] Plan rollback procedure
- [ ] Load testing for translation queries
- [ ] SEO audit for multi-language URLs

---

## 10. Sample Queries for Testing

```sql
-- Find all topics missing Vietnamese translations
SELECT t.id, t.name
FROM topics t
LEFT JOIN topic_translations tr ON tr.topic_id = t.id AND tr.locale = 'vi'
WHERE tr.id IS NULL;

-- Get translation coverage statistics
SELECT
  locale,
  COUNT(*) as translation_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM topics), 2) as coverage_percent
FROM topic_translations
GROUP BY locale;

-- Search topics by Vietnamese name
SELECT t.id, COALESCE(tr.name, t.name) as name
FROM topics t
LEFT JOIN topic_translations tr ON tr.topic_id = t.id AND tr.locale = 'vi'
WHERE tr.name ILIKE '%javascript%';

-- Get questions with all translations
SELECT
  q.id,
  q.title,
  json_agg(
    json_build_object(
      'locale', qt.locale,
      'title', qt.title
    )
  ) as translations
FROM questions q
LEFT JOIN question_translations qt ON qt.question_id = q.id
GROUP BY q.id;
```
