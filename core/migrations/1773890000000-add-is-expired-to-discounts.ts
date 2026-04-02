import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds is_expired column to discounts table.
 */
export class AddIsExpiredToDiscounts1773890000000 implements MigrationInterface {
  name = 'AddIsExpiredToDiscounts1773890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD "is_expired" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `UPDATE "discounts" SET "is_expired" = true WHERE "status" = 'deleted' AND "end_date" < NOW()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "discounts" DROP COLUMN "is_expired"`);
  }
}
