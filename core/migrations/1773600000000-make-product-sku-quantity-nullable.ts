import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeProductSkuQuantityNullable1773600000000 implements MigrationInterface {
  name = 'MakeProductSkuQuantityNullable1773600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_skus" ALTER COLUMN "quantity" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ALTER COLUMN "quantity" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "product_skus" SET "quantity" = 0 WHERE "quantity" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ALTER COLUMN "quantity" SET DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ALTER COLUMN "quantity" SET NOT NULL`,
    );
  }
}
