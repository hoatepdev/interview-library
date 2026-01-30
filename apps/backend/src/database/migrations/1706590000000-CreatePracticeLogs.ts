import { MigrationInterface, Table, TableForeignKey, TableIndex, QueryRunner } from 'typeorm';

export class CreatePracticeLogs1706590000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'practice_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'question_id',
            type: 'uuid',
          },
          {
            name: 'self_rating',
            type: 'enum',
            enum: ['poor', 'fair', 'good', 'great'],
          },
          {
            name: 'time_spent_seconds',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'practiced_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'practice_logs',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'questions',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'practice_logs',
      new TableIndex({
        name: 'IDX_PRACTICE_LOGS_QUESTION',
        columnNames: ['question_id'],
      }),
    );

    await queryRunner.createIndex(
      'practice_logs',
      new TableIndex({
        name: 'IDX_PRACTICE_LOGS_DATE',
        columnNames: ['practiced_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('practice_logs');
  }
}
