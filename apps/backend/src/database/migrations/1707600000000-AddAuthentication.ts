import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddAuthentication1707600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
            default: "'google'",
          },
          {
            name: 'provider_id',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add user_id to practice_logs
    await queryRunner.query(`
      ALTER TABLE practice_logs
      ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);

    // Create index on user_id for practice_logs
    await queryRunner.createIndex(
      'practice_logs',
      new TableIndex({
        name: 'IDX_PRACTICE_LOGS_USER_ID',
        columnNames: ['user_id'],
      }),
    );

    // Create question_favorites table
    await queryRunner.createTable(
      new Table({
        name: 'question_favorites',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'question_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for question_favorites
    await queryRunner.createForeignKey(
      'question_favorites',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'question_favorites',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique constraint on (user_id, question_id)
    await queryRunner.createIndex(
      'question_favorites',
      new TableIndex({
        name: 'UQ_QUESTION_FAVORITES_USER_QUESTION',
        columnNames: ['user_id', 'question_id'],
        isUnique: true,
      }),
    );

    // Create user_questions table for personal questions
    await queryRunner.createTable(
      new Table({
        name: 'user_questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'question_id',
            type: 'uuid',
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys for user_questions
    await queryRunner.createForeignKey(
      'user_questions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'user_questions',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique constraint on (user_id, question_id)
    await queryRunner.createIndex(
      'user_questions',
      new TableIndex({
        name: 'UQ_USER_QUESTIONS_USER_QUESTION',
        columnNames: ['user_id', 'question_id'],
        isUnique: true,
      }),
    );

    // Add user_id to questions table (for personal questions)
    await queryRunner.query(`
      ALTER TABLE questions
      ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE
    `);

    // Drop is_favorite from questions (moved to separate table)
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN IF EXISTS is_favorite`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back is_favorite to questions
    await queryRunner.query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false`);

    // Remove user_id from questions
    await queryRunner.query(`ALTER TABLE questions DROP COLUMN IF EXISTS user_id`);

    // Drop user_questions table
    await queryRunner.dropTable('user_questions', true);

    // Drop question_favorites table
    await queryRunner.dropTable('question_favorites', true);

    // Remove user_id from practice_logs
    await queryRunner.query(`ALTER TABLE practice_logs DROP COLUMN IF EXISTS user_id`);

    // Drop users table
    await queryRunner.dropTable('users', true);
  }
}
