import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds is_online column to businesses table.
 */
export class AddIsOnlineToBusinesses1773365635352
  implements MigrationInterface
{
  name = 'AddIsOnlineToBusinesses1773365635352';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "is_online" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "is_online"`);
  }
}
