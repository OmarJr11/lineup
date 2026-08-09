import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds stock_notified to products so low-stock cron notifies at most once per low-stock period.
 */
export class AddStockNotifiedToProducts1775710000000 implements MigrationInterface {
  name = 'AddStockNotifiedToProducts1775710000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "stock_notified" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN "stock_notified"`,
    );
  }
}
