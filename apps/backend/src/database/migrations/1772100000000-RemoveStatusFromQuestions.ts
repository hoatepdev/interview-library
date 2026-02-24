import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveStatusFromQuestions1772100000000 implements MigrationInterface {
  name = "RemoveStatusFromQuestions1772100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the status column from questions table.
    // Status is now derived dynamically from user_questions.repetitions:
    //   repetitions = 0      -> 'new'
    //   repetitions 1-3      -> 'learning'
    //   repetitions >= 4     -> 'mastered'
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "status"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."questions_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create the enum type and column with default 'new'
    await queryRunner.query(
      `CREATE TYPE "public"."questions_status_enum" AS ENUM('new', 'learning', 'mastered')`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "status" "public"."questions_status_enum" NOT NULL DEFAULT 'new'`,
    );
  }
}
