import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveGlobalSm2FromQuestions1772000000000 implements MigrationInterface {
  name = 'RemoveGlobalSm2FromQuestions1772000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Migrate global SM-2 state into user_questions for questions
    // that have been practiced (practice_count > 0) but don't yet have
    // a user_questions row. This covers cases where practice happened
    // before user_questions tracking was introduced.
    //
    // We join practice_logs to find the user who practiced each question,
    // then insert into user_questions only where no row exists yet.
    await queryRunner.query(`
      INSERT INTO user_questions (id, user_id, question_id, ease_factor, interval_days, repetitions, next_review_at, created_at, updated_at)
      SELECT
        uuid_generate_v4(),
        pl.user_id,
        q.id,
        q.ease_factor,
        q.interval_days,
        q.repetitions,
        q.next_review_at,
        NOW(),
        NOW()
      FROM questions q
      INNER JOIN (
        SELECT DISTINCT question_id, user_id
        FROM practice_logs
        WHERE user_id IS NOT NULL
      ) pl ON pl.question_id = q.id
      WHERE q.practice_count > 0
        AND NOT EXISTS (
          SELECT 1 FROM user_questions uq
          WHERE uq.user_id = pl.user_id AND uq.question_id = q.id
        )
    `);

    // Step 2: Drop SM-2 columns from questions table
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "ease_factor"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "interval_days"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "repetitions"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "next_review_at"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "last_practiced_at"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "practice_count"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add dropped columns with their original defaults
    await queryRunner.query(`ALTER TABLE "questions" ADD "practice_count" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "last_practiced_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "next_review_at" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "ease_factor" numeric(4,2) NOT NULL DEFAULT 2.5`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "interval_days" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "questions" ADD "repetitions" integer NOT NULL DEFAULT 0`);
  }
}
