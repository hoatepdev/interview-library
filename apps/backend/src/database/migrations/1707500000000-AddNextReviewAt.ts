import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddNextReviewAt1707500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add next_review_at column to questions table
    await queryRunner.query(`
      ALTER TABLE questions
      ADD COLUMN next_review_at TIMESTAMP NULL
    `);

    // Add spaced repetition tracking columns
    await queryRunner.query(`
      ALTER TABLE questions
      ADD COLUMN ease_factor FLOAT DEFAULT 2.5
    `);

    await queryRunner.query(`
      ALTER TABLE questions
      ADD COLUMN interval_days INT DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE questions
      ADD COLUMN repetitions INT DEFAULT 0
    `);

    // Create index on next_review_at for efficient queries
    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_QUESTIONS_NEXT_REVIEW',
        columnNames: ['next_review_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('questions', 'IDX_QUESTIONS_NEXT_REVIEW');
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN IF EXISTS repetitions`);
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN IF EXISTS interval_days`);
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN IF EXISTS ease_factor`);
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN IF EXISTS next_review_at`);
  }
}
