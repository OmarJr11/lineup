import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FixUniqueKeyInProductSku1775537457325 implements MigrationInterface {
  name = 'FixUniqueKeyInProductSku1775537457325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP CONSTRAINT "UQ_53728b0ae1ed2d574fb0b597065"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."entity_audits_operation_enum" RENAME TO "entity_audits_operation_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entity_audits_operation_enum" AS ENUM('INSERT', 'UPDATE', 'DELETE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_audits" ALTER COLUMN "operation" TYPE "public"."entity_audits_operation_enum" USING "operation"::"text"::"public"."entity_audits_operation_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."entity_audits_operation_enum_old"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_product_skus_sku_code_not_deleted" ON "product_skus" ("sku_code") WHERE status != 'deleted'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."uq_product_skus_sku_code_not_deleted"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."entity_audits_operation_enum_old" AS ENUM('INSERT', 'UPDATE', 'DELETE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "entity_audits" ALTER COLUMN "operation" TYPE "public"."entity_audits_operation_enum_old" USING "operation"::"text"::"public"."entity_audits_operation_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."entity_audits_operation_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."entity_audits_operation_enum_old" RENAME TO "entity_audits_operation_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD CONSTRAINT "UQ_53728b0ae1ed2d574fb0b597065" UNIQUE ("sku_code")`,
    );
  }
}
