import { MigrationInterface, QueryRunner } from 'typeorm';

export class TranslationTables1707400000000 implements MigrationInterface {
  name = 'TranslationTables1707400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // === Phase 1: Create translation tables ===

    // Create topic_translations table
    await queryRunner.query(`
      CREATE TABLE "topic_translations" (
        "id" BIGSERIAL PRIMARY KEY,
        "topic_id" UUID NOT NULL REFERENCES "topics"(id) ON DELETE CASCADE,
        "locale" VARCHAR(5) NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("topic_id", "locale"),
        CONSTRAINT "check_topic_locale_format" CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
      )
    `);

    // Create question_translations table
    await queryRunner.query(`
      CREATE TABLE "question_translations" (
        "id" BIGSERIAL PRIMARY KEY,
        "question_id" UUID NOT NULL REFERENCES "questions"(id) ON DELETE CASCADE,
        "locale" VARCHAR(5) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "answer" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE("question_id", "locale"),
        CONSTRAINT "check_question_locale_format" CHECK (locale ~ '^[a-z]{2}(-[A-Z]{2})?$')
      )
    `);

    // === Phase 2: Create indexes ===

    // topic_translations indexes
    await queryRunner.query(`CREATE INDEX "idx_topic_translations_topic_id" ON "topic_translations"("topic_id")`);
    await queryRunner.query(`CREATE INDEX "idx_topic_translations_locale" ON "topic_translations"("locale")`);

    // question_translations indexes
    await queryRunner.query(`CREATE INDEX "idx_question_translations_question_id" ON "question_translations"("question_id")`);
    await queryRunner.query(`CREATE INDEX "idx_question_translations_locale" ON "question_translations"("locale")`);

    // === Phase 3: Migrate existing data from JSONB ===

    // Migrate topic translations
    await queryRunner.query(`
      INSERT INTO "topic_translations" ("topic_id", "locale", "name", "description")
      SELECT
        t."id" as topic_id,
        jsonb_object_keys(t."translations") as locale,
        t."translations"->jsonb_object_keys(t."translations")->>'name' as name,
        t."translations"->jsonb_object_keys(t."translations")->>'description' as description
      FROM "topics" t
      WHERE t."translations" != '{}' AND t."translations" IS NOT NULL
        AND t."translations" ? 'name'
      ON CONFLICT ("topic_id", "locale") DO NOTHING
    `);

    // Migrate question translations
    await queryRunner.query(`
      INSERT INTO "question_translations" ("question_id", "locale", "title", "content", "answer")
      SELECT
        q."id" as question_id,
        jsonb_object_keys(q."translations") as locale,
        q."translations"->jsonb_object_keys(q."translations")->>'title' as title,
        q."translations"->jsonb_object_keys(q."translations")->>'content' as content,
        q."translations"->jsonb_object_keys(q."translations")->>'answer' as answer
      FROM "questions" q
      WHERE q."translations" != '{}' AND q."translations" IS NOT NULL
        AND q."translations" ? 'title'
      ON CONFLICT ("question_id", "locale") DO NOTHING
    `);

    // Note: Keeping JSONB columns for now - drop in Phase 5 after verification
    // ALTER TABLE "topics" DROP COLUMN "translations";
    // ALTER TABLE "questions" DROP COLUMN "translations";
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: Drop translation tables
    await queryRunner.query(`DROP TABLE IF EXISTS "question_translations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "topic_translations"`);
  }
}
