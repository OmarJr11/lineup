import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds has_variations column to products table.
 */
export class AddHasVariationsToProducts1773523000000
  implements MigrationInterface
{
  name = 'AddHasVariationsToProducts1773523000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "has_variations" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "products" SET "has_variations" = true WHERE id IN (SELECT DISTINCT id_product FROM "product_variations")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "has_variations"`,
    );
  }
}
