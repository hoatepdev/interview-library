import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUserSpacedRepetition1707700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add next_review_at column to user_questions
    await queryRunner.query(`
      ALTER TABLE user_questions
      ADD COLUMN next_review_at TIMESTAMP NULL
    `);

    // Add spaced repetition tracking columns
    await queryRunner.query(`
      ALTER TABLE user_questions
      ADD COLUMN ease_factor FLOAT DEFAULT 2.5
    `);

    await queryRunner.query(`
      ALTER TABLE user_questions
      ADD COLUMN interval_days INT DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE user_questions
      ADD COLUMN repetitions INT DEFAULT 0
    `);

    // Create index on next_review_at for efficient queries
    await queryRunner.createIndex(
      'user_questions',
      new TableIndex({
        name: 'IDX_USER_QUESTIONS_NEXT_REVIEW',
        columnNames: ['next_review_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('user_questions', 'IDX_USER_QUESTIONS_NEXT_REVIEW');
    await queryRunner.query(`ALTER TABLE user_questions DROP COLUMN IF EXISTS repetitions`);
    await queryRunner.query(`ALTER TABLE user_questions DROP COLUMN IF EXISTS interval_days`);
    await queryRunner.query(`ALTER TABLE user_questions DROP COLUMN IF EXISTS ease_factor`);
    await queryRunner.query(`ALTER TABLE user_questions DROP COLUMN IF EXISTS next_review_at`);
  }
}
