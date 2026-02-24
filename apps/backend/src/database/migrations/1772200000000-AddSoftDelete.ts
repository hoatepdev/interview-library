import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDelete1772200000000 implements MigrationInterface {
  name = "AddSoftDelete1772200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Add soft delete columns to each table ───

    // users
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "users" ADD "deleted_by" UUID`);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // topics
    await queryRunner.query(`ALTER TABLE "topics" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "topics" ADD "deleted_by" UUID`);
    await queryRunner.query(`
      ALTER TABLE "topics"
      ADD CONSTRAINT "FK_topics_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // questions
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(`ALTER TABLE "questions" ADD "deleted_by" UUID`);
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD CONSTRAINT "FK_questions_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // question_revisions
    await queryRunner.query(
      `ALTER TABLE "question_revisions" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_revisions" ADD "deleted_by" UUID`,
    );
    await queryRunner.query(`
      ALTER TABLE "question_revisions"
      ADD CONSTRAINT "FK_question_revisions_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // user_questions
    await queryRunner.query(
      `ALTER TABLE "user_questions" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_questions" ADD "deleted_by" UUID`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_questions"
      ADD CONSTRAINT "FK_user_questions_deleted_by"
      FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // ─── 2. Replace unique constraints with partial unique indexes ───

    // topics.slug: drop old unique, create partial unique
    await queryRunner.query(
      `ALTER TABLE "topics" DROP CONSTRAINT IF EXISTS "UQ_topics_slug"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_topics_slug"`);
    // Also try the TypeORM-generated constraint name
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'topics'
          AND tc.constraint_type = 'UNIQUE'
          AND ccu.column_name = 'slug';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "topics" DROP CONSTRAINT "' || constraint_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_topics_slug_active"
      ON "topics" ("slug")
      WHERE "deleted_at" IS NULL
    `);

    // users.email: drop old unique, create partial unique
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'users'
          AND tc.constraint_type = 'UNIQUE'
          AND ccu.column_name = 'email';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "users" DROP CONSTRAINT "' || constraint_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_email_active"
      ON "users" ("email")
      WHERE "deleted_at" IS NULL
    `);

    // users.provider_id: drop old unique, create partial unique
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'users'
          AND tc.constraint_type = 'UNIQUE'
          AND ccu.column_name = 'provider_id';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "users" DROP CONSTRAINT "' || constraint_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_provider_id_active"
      ON "users" ("provider_id")
      WHERE "deleted_at" IS NULL
    `);

    // user_questions unique (user_id, question_id): drop old, create partial
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.table_name = 'user_questions'
          AND tc.constraint_type = 'UNIQUE';

        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "user_questions" DROP CONSTRAINT "' || constraint_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_questions_user_question_active"
      ON "user_questions" ("user_id", "question_id")
      WHERE "deleted_at" IS NULL
    `);

    // ─── 3. Create partial indexes to optimize common queries (skip deleted rows) ───

    await queryRunner.query(`
      CREATE INDEX "IDX_users_active" ON "users" ("id") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_topics_active" ON "topics" ("id") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_questions_active" ON "questions" ("id") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_questions_active_topic" ON "questions" ("topic_id") WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_questions_active_content_status"
      ON "questions" ("content_status")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_question_revisions_active"
      ON "question_revisions" ("id")
      WHERE "deleted_at" IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_questions_active"
      ON "user_questions" ("user_id", "question_id")
      WHERE "deleted_at" IS NULL
    `);

    // ─── 4. Change cascade rules on foreign keys ───
    // Replace CASCADE with RESTRICT on critical relationships.
    // We keep practice_logs and content_reviews cascade behavior untouched
    // since they're immutable logs.

    // questions.topic_id: CASCADE → RESTRICT
    await queryRunner.query(`
      ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "FK_questions_topic_id"
    `);
    // Find and drop the actual constraint name
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'questions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'topic_id';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "questions" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD CONSTRAINT "FK_questions_topic_id"
      FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT
    `);

    // questions.user_id: CASCADE → SET NULL
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'questions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "questions" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD CONSTRAINT "FK_questions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // question_revisions.question_id: CASCADE → RESTRICT
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'question_revisions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'question_id';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "question_revisions" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "question_revisions"
      ADD CONSTRAINT "FK_question_revisions_question_id"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT
    `);

    // question_revisions.submitted_by: CASCADE → SET NULL
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'question_revisions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'submitted_by';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "question_revisions" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "question_revisions" ALTER COLUMN "submitted_by" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "question_revisions"
      ADD CONSTRAINT "FK_question_revisions_submitted_by"
      FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL
    `);

    // user_questions.user_id: CASCADE → RESTRICT
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'user_questions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "user_questions" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "user_questions"
      ADD CONSTRAINT "FK_user_questions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
    `);

    // user_questions.question_id: CASCADE → RESTRICT
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'user_questions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'question_id';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "user_questions" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "user_questions"
      ADD CONSTRAINT "FK_user_questions_question_id"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT
    `);

    // content_reviews.reviewer_id: CASCADE → SET NULL
    await queryRunner.query(`
      DO $$
      DECLARE
        fk_name TEXT;
      BEGIN
        SELECT tc.constraint_name INTO fk_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'content_reviews'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'reviewer_id';

        IF fk_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE "content_reviews" DROP CONSTRAINT "' || fk_name || '"';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE "content_reviews" ALTER COLUMN "reviewer_id" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "content_reviews"
      ADD CONSTRAINT "FK_content_reviews_reviewer_id"
      FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ─── Reverse cascade changes ───

    // content_reviews.reviewer_id: SET NULL → CASCADE
    await queryRunner.query(
      `ALTER TABLE "content_reviews" DROP CONSTRAINT IF EXISTS "FK_content_reviews_reviewer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "content_reviews" ALTER COLUMN "reviewer_id" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "content_reviews"
      ADD CONSTRAINT "FK_content_reviews_reviewer_id"
      FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // user_questions.question_id: RESTRICT → CASCADE
    await queryRunner.query(
      `ALTER TABLE "user_questions" DROP CONSTRAINT IF EXISTS "FK_user_questions_question_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_questions"
      ADD CONSTRAINT "FK_user_questions_question_id"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
    `);

    // user_questions.user_id: RESTRICT → CASCADE
    await queryRunner.query(
      `ALTER TABLE "user_questions" DROP CONSTRAINT IF EXISTS "FK_user_questions_user_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_questions"
      ADD CONSTRAINT "FK_user_questions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // question_revisions.submitted_by: SET NULL → CASCADE
    await queryRunner.query(
      `ALTER TABLE "question_revisions" DROP CONSTRAINT IF EXISTS "FK_question_revisions_submitted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_revisions" ALTER COLUMN "submitted_by" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "question_revisions"
      ADD CONSTRAINT "FK_question_revisions_submitted_by"
      FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // question_revisions.question_id: RESTRICT → CASCADE
    await queryRunner.query(
      `ALTER TABLE "question_revisions" DROP CONSTRAINT IF EXISTS "FK_question_revisions_question_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "question_revisions"
      ADD CONSTRAINT "FK_question_revisions_question_id"
      FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
    `);

    // questions.user_id: SET NULL → CASCADE
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "FK_questions_user_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD CONSTRAINT "FK_questions_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // questions.topic_id: RESTRICT → CASCADE
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "FK_questions_topic_id"`,
    );
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD CONSTRAINT "FK_questions_topic_id"
      FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE
    `);

    // ─── Drop partial indexes ───
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_questions_active"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_question_revisions_active"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_questions_active_content_status"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_questions_active_topic"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_topics_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_active"`);

    // ─── Restore original unique constraints ───

    // user_questions: drop partial, restore full unique
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_user_questions_user_question_active"`,
    );
    await queryRunner.query(`
      ALTER TABLE "user_questions"
      ADD CONSTRAINT "UQ_user_questions_user_question"
      UNIQUE ("user_id", "question_id")
    `);

    // users.provider_id: drop partial, restore full unique
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_users_provider_id_active"`,
    );
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "UQ_users_provider_id"
      UNIQUE ("provider_id")
    `);

    // users.email: drop partial, restore full unique
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_users_email_active"`);
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "UQ_users_email"
      UNIQUE ("email")
    `);

    // topics.slug: drop partial, restore full unique
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_topics_slug_active"`);
    await queryRunner.query(`
      ALTER TABLE "topics"
      ADD CONSTRAINT "UQ_topics_slug"
      UNIQUE ("slug")
    `);

    // ─── Drop soft delete columns ───

    await queryRunner.query(
      `ALTER TABLE "user_questions" DROP CONSTRAINT IF EXISTS "FK_user_questions_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_questions" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_questions" DROP COLUMN "deleted_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "question_revisions" DROP CONSTRAINT IF EXISTS "FK_question_revisions_deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_revisions" DROP COLUMN "deleted_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_revisions" DROP COLUMN "deleted_at"`,
    );

    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT IF EXISTS "FK_questions_deleted_by"`,
    );
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "deleted_at"`);

    await queryRunner.query(
      `ALTER TABLE "topics" DROP CONSTRAINT IF EXISTS "FK_topics_deleted_by"`,
    );
    await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "deleted_at"`);

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_deleted_by"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_by"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
