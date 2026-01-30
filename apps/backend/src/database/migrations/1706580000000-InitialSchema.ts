import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialSchema1706580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create topics table
    await queryRunner.createTable(
      new Table({
        name: 'topics',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
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

    // Create questions table
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'answer',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'topic_id',
            type: 'uuid',
          },
          {
            name: 'level',
            type: 'enum',
            enum: ['junior', 'middle', 'senior'],
            default: "'middle'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['new', 'learning', 'mastered'],
            default: "'new'",
          },
          {
            name: 'is_favorite',
            type: 'boolean',
            default: false,
          },
          {
            name: 'difficulty_score',
            type: 'int',
            default: 0,
          },
          {
            name: 'practice_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_practiced_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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

    // Create foreign key constraint
    await queryRunner.createForeignKey(
      'questions',
      new TableForeignKey({
        columnNames: ['topic_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'topics',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes for questions
    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_QUESTIONS_TOPIC',
        columnNames: ['topic_id'],
      }),
    );

    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_QUESTIONS_LEVEL',
        columnNames: ['level'],
      }),
    );

    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_QUESTIONS_STATUS',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_QUESTIONS_FAVORITE',
        columnNames: ['is_favorite'],
      }),
    );

    // Create full-text search index
    await queryRunner.query(`
      CREATE INDEX "IDX_QUESTIONS_SEARCH" ON "questions"
      USING GIN(to_tsvector('english', "title" || ' ' || "content"))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('questions');
    await queryRunner.dropTable('topics');
  }
}
