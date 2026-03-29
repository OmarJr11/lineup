import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds is_primary column to products table.
 */
export class AddIsPrimaryToProducts1774900000000 implements MigrationInterface {
  name = 'AddIsPrimaryToProducts1774900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_primary" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_primary"`);
  }
}
