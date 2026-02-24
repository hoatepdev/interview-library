-- =============================================================================
-- Interview Library — Production PostgreSQL Schema
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- ENUM TYPES
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE question_level AS ENUM ('junior', 'middle', 'senior');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE question_status AS ENUM ('new', 'learning', 'mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE self_rating AS ENUM ('poor', 'fair', 'good', 'great');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id          UUID        NOT NULL DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL,
  name        VARCHAR(255),
  avatar      TEXT,
  provider    VARCHAR(50)  NOT NULL DEFAULT 'google',
  provider_id VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT users_pkey            PRIMARY KEY (id),
  CONSTRAINT users_email_key       UNIQUE (email),
  CONSTRAINT users_provider_key    UNIQUE (provider, provider_id)
);


-- =============================================================================
-- TABLE: topics
-- =============================================================================

CREATE TABLE IF NOT EXISTS topics (
  id          UUID         NOT NULL DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7),
  icon        VARCHAR(50),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT topics_pkey     PRIMARY KEY (id),
  CONSTRAINT topics_slug_key UNIQUE (slug)
);


-- =============================================================================
-- TABLE: topic_translations
-- =============================================================================

CREATE TABLE IF NOT EXISTS topic_translations (
  id          BIGINT       NOT NULL GENERATED ALWAYS AS IDENTITY,
  topic_id    UUID         NOT NULL,
  locale      VARCHAR(5)   NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT topic_translations_pkey        PRIMARY KEY (id),
  CONSTRAINT topic_translations_locale_key  UNIQUE (topic_id, locale),
  CONSTRAINT topic_translations_topic_fkey  FOREIGN KEY (topic_id)
    REFERENCES topics (id) ON DELETE CASCADE
);


-- =============================================================================
-- TABLE: questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id               UUID             NOT NULL DEFAULT gen_random_uuid(),
  title            VARCHAR(255)     NOT NULL,
  content          TEXT             NOT NULL,
  answer           TEXT,
  topic_id         UUID             NOT NULL,
  user_id          UUID,
  level            question_level   NOT NULL DEFAULT 'middle',
  is_public        BOOLEAN          NOT NULL DEFAULT TRUE,
  difficulty_score INTEGER          NOT NULL DEFAULT 0,
  display_order    INTEGER          NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT questions_pkey       PRIMARY KEY (id),
  CONSTRAINT questions_topic_fkey FOREIGN KEY (topic_id)
    REFERENCES topics (id) ON DELETE CASCADE,
  CONSTRAINT questions_user_fkey  FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
);


-- =============================================================================
-- TABLE: question_translations
-- =============================================================================

CREATE TABLE IF NOT EXISTS question_translations (
  id          BIGINT       NOT NULL GENERATED ALWAYS AS IDENTITY,
  question_id UUID         NOT NULL,
  locale      VARCHAR(5)   NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT         NOT NULL,
  answer      TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT question_translations_pkey        PRIMARY KEY (id),
  CONSTRAINT question_translations_locale_key  UNIQUE (question_id, locale),
  CONSTRAINT question_translations_q_fkey      FOREIGN KEY (question_id)
    REFERENCES questions (id) ON DELETE CASCADE
);


-- =============================================================================
-- TABLE: user_questions
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_questions (
  user_id       UUID             NOT NULL,
  question_id   UUID             NOT NULL,
  status        question_status  NOT NULL DEFAULT 'new',
  is_favorite   BOOLEAN          NOT NULL DEFAULT FALSE,
  next_review_at TIMESTAMPTZ,
  ease_factor   NUMERIC(4,2)     NOT NULL DEFAULT 2.50,
  interval_days INTEGER          NOT NULL DEFAULT 0,
  repetitions   INTEGER          NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT user_questions_pkey          PRIMARY KEY (user_id, question_id),
  CONSTRAINT user_questions_user_fkey     FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT user_questions_question_fkey FOREIGN KEY (question_id)
    REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT user_questions_ease_check    CHECK (ease_factor >= 1.3),
  CONSTRAINT user_questions_interval_check CHECK (interval_days >= 0),
  CONSTRAINT user_questions_reps_check    CHECK (repetitions >= 0)
);


-- =============================================================================
-- TABLE: practice_logs
-- =============================================================================

CREATE TABLE IF NOT EXISTS practice_logs (
  id                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL,
  question_id         UUID        NOT NULL,
  self_rating         self_rating NOT NULL,
  time_spent_seconds  INTEGER,
  notes               TEXT,
  practiced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT practice_logs_pkey          PRIMARY KEY (id),
  CONSTRAINT practice_logs_user_fkey     FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT practice_logs_question_fkey FOREIGN KEY (question_id)
    REFERENCES questions (id) ON DELETE CASCADE,
  CONSTRAINT practice_logs_time_check    CHECK (time_spent_seconds IS NULL OR time_spent_seconds > 0)
);


-- =============================================================================
-- INDEXES
-- =============================================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- topics
CREATE INDEX IF NOT EXISTS idx_topics_slug
  ON topics (slug);

-- topic_translations
CREATE INDEX IF NOT EXISTS idx_topic_translations_locale
  ON topic_translations (locale);

-- questions
CREATE INDEX IF NOT EXISTS idx_questions_topic_id
  ON questions (topic_id);

CREATE INDEX IF NOT EXISTS idx_questions_user_id
  ON questions (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_level
  ON questions (level);

CREATE INDEX IF NOT EXISTS idx_questions_is_public
  ON questions (is_public);

-- question_translations
CREATE INDEX IF NOT EXISTS idx_question_translations_locale
  ON question_translations (locale);

-- user_questions
CREATE INDEX IF NOT EXISTS idx_user_questions_user_id
  ON user_questions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_questions_question_id
  ON user_questions (question_id);

CREATE INDEX IF NOT EXISTS idx_user_questions_status
  ON user_questions (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_questions_favorites
  ON user_questions (user_id, is_favorite)
  WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_questions_review_queue
  ON user_questions (user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- practice_logs
CREATE INDEX IF NOT EXISTS idx_practice_logs_user_id
  ON practice_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_practice_logs_question_id
  ON practice_logs (question_id);

CREATE INDEX IF NOT EXISTS idx_practice_logs_practiced_at
  ON practice_logs (user_id, practiced_at DESC);
