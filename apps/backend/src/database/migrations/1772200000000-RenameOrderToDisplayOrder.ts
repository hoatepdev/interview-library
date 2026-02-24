import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameOrderToDisplayOrder1772200000000 implements MigrationInterface {
  name = "RenameOrderToDisplayOrder1772200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" RENAME COLUMN "order" TO "display_order"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "questions" RENAME COLUMN "display_order" TO "order"`,
    );
  }
}
