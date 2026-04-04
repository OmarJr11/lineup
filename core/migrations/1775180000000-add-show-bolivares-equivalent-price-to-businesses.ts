import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds show_bolivares_equivalent_price to businesses for optional VES equivalent display.
 */
export class AddShowBolivaresEquivalentPriceToBusinesses1775180000000 implements MigrationInterface {
  name = 'AddShowBolivaresEquivalentPriceToBusinesses1775180000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "is_bs_equivalent_price_enabled" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" DROP COLUMN "is_bs_equivalent_price_enabled"`,
    );
  }
}
