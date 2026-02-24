import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDomainEventsAndPerformanceIndexes1772300000000 implements MigrationInterface {
  name = 'AddDomainEventsAndPerformanceIndexes1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Create domain_events audit table ───
    await queryRunner.query(`
      CREATE TYPE "domain_event_action_enum" AS ENUM ('deleted', 'restored', 'force_deleted', 'restore_blocked')
    `);

    await queryRunner.query(`
      CREATE TABLE "domain_events" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "entity_type" VARCHAR(50) NOT NULL,
        "entity_id" UUID NOT NULL,
        "action" "domain_event_action_enum" NOT NULL,
        "actor_id" UUID,
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_domain_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_domain_events_actor_id"
          FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // ─── 2. Indexes on domain_events ───
    await queryRunner.query(`
      CREATE INDEX "IDX_domain_events_entity"
      ON "domain_events" ("entity_type", "entity_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_domain_events_actor"
      ON "domain_events" ("actor_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_domain_events_created_at"
      ON "domain_events" ("created_at")
    `);

    // ─── 3. Composite performance indexes for soft delete queries ───

    // (deleted_at, topic_id) on questions — common filter: active questions by topic
    await queryRunner.query(`
      CREATE INDEX "IDX_questions_deleted_topic"
      ON "questions" ("deleted_at", "topic_id")
    `);

    // (deleted_at, user_id) on questions — filter: active questions by user
    await queryRunner.query(`
      CREATE INDEX "IDX_questions_deleted_user"
      ON "questions" ("deleted_at", "user_id")
    `);

    // (deleted_at, user_id) on user_questions — filter: active SM-2 state per user
    await queryRunner.query(`
      CREATE INDEX "IDX_user_questions_deleted_user"
      ON "user_questions" ("deleted_at", "user_id")
    `);

    // (deleted_at, question_id) on user_questions — count active user_questions per question
    await queryRunner.query(`
      CREATE INDEX "IDX_user_questions_deleted_question"
      ON "user_questions" ("deleted_at", "question_id")
    `);

    // (deleted_at, question_id) on question_revisions — active revisions per question
    await queryRunner.query(`
      CREATE INDEX "IDX_question_revisions_deleted_question"
      ON "question_revisions" ("deleted_at", "question_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ─── Drop composite performance indexes ───
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_question_revisions_deleted_question"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_questions_deleted_question"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_user_questions_deleted_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_deleted_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_questions_deleted_topic"`);

    // ─── Drop domain_events indexes and table ───
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_events_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_events_actor"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_domain_events_entity"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "domain_events"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "domain_event_action_enum"`);
  }
}
