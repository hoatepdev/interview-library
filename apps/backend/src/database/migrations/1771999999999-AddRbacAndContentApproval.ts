import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRbacAndContentApproval1771999999999 implements MigrationInterface {
  name = 'AddRbacAndContentApproval1771999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create enums
    await queryRunner.query(`CREATE TYPE "public"."user_role_enum" AS ENUM('user', 'moderator', 'admin')`);
    await queryRunner.query(`CREATE TYPE "public"."content_status_enum" AS ENUM('draft', 'pending_review', 'approved', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "public"."review_action_enum" AS ENUM('approved', 'rejected')`);
    await queryRunner.query(`CREATE TYPE "public"."review_target_type_enum" AS ENUM('question', 'question_revision')`);

    // 2. Add role to users (existing users default to 'user')
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "role" "public"."user_role_enum" NOT NULL DEFAULT 'user'`);

    // 3. Add content_status and review_note to questions (existing questions default to 'approved')
    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN "content_status" "public"."content_status_enum" NOT NULL DEFAULT 'approved'`);
    await queryRunner.query(`ALTER TABLE "questions" ADD COLUMN "review_note" text`);
    await queryRunner.query(`CREATE INDEX "IDX_questions_content_status" ON "questions" ("content_status")`);

    // 4. Add content_status to topics (existing topics default to 'approved')
    await queryRunner.query(`ALTER TABLE "topics" ADD COLUMN "content_status" "public"."content_status_enum" NOT NULL DEFAULT 'approved'`);

    // 5. Create question_revisions table
    await queryRunner.query(`
      CREATE TABLE "question_revisions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "question_id" uuid NOT NULL,
        "submitted_by" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "content" text NOT NULL,
        "answer" text,
        "level" "public"."questions_level_enum",
        "topic_id" uuid,
        "content_status" "public"."content_status_enum" NOT NULL DEFAULT 'pending_review',
        "review_note" text,
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_question_revisions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_qr_question_id" ON "question_revisions" ("question_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_qr_content_status" ON "question_revisions" ("content_status")`);
    await queryRunner.query(`ALTER TABLE "question_revisions" ADD CONSTRAINT "FK_qr_question" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "question_revisions" ADD CONSTRAINT "FK_qr_submitter" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "question_revisions" ADD CONSTRAINT "FK_qr_reviewer" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL`);

    // 6. Create content_reviews audit table
    await queryRunner.query(`
      CREATE TABLE "content_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "target_type" "public"."review_target_type_enum" NOT NULL,
        "target_id" uuid NOT NULL,
        "action" "public"."review_action_enum" NOT NULL,
        "note" text,
        "reviewer_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_reviews" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cr_target" ON "content_reviews" ("target_type", "target_id")`);
    await queryRunner.query(`ALTER TABLE "content_reviews" ADD CONSTRAINT "FK_cr_reviewer" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop content_reviews
    await queryRunner.query(`ALTER TABLE "content_reviews" DROP CONSTRAINT "FK_cr_reviewer"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cr_target"`);
    await queryRunner.query(`DROP TABLE "content_reviews"`);

    // Drop question_revisions
    await queryRunner.query(`ALTER TABLE "question_revisions" DROP CONSTRAINT "FK_qr_reviewer"`);
    await queryRunner.query(`ALTER TABLE "question_revisions" DROP CONSTRAINT "FK_qr_submitter"`);
    await queryRunner.query(`ALTER TABLE "question_revisions" DROP CONSTRAINT "FK_qr_question"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_qr_content_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_qr_question_id"`);
    await queryRunner.query(`DROP TABLE "question_revisions"`);

    // Drop columns from topics
    await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "content_status"`);

    // Drop columns from questions
    await queryRunner.query(`DROP INDEX "public"."IDX_questions_content_status"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "review_note"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "content_status"`);

    // Drop column from users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."review_target_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."review_action_enum"`);
    await queryRunner.query(`DROP TYPE "public"."content_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
  }
}
