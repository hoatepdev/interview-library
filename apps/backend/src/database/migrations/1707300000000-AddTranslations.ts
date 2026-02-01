import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTranslations1707300000000 implements MigrationInterface {
  name = 'AddTranslations1707300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add translations column to topics
    await queryRunner.query(`
      ALTER TABLE "topics"
      ADD COLUMN "translations" jsonb NOT NULL DEFAULT '{}'
    `);

    // Add translations column to questions
    await queryRunner.query(`
      ALTER TABLE "questions"
      ADD COLUMN "translations" jsonb NOT NULL DEFAULT '{}'
    `);

    // Create index on translations for faster lookups
    await queryRunner.query(`
      CREATE INDEX "idx_topics_translations" ON "topics" USING GIN ("translations")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_questions_translations" ON "questions" USING GIN ("translations")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_translations"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_topics_translations"`);
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "translations"`);
    await queryRunner.query(`ALTER TABLE "topics" DROP COLUMN "translations"`);
  }
}
