import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NewCheckInProducts1775086164984 implements MigrationInterface {
  name = 'NewCheckInProducts1775086164984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "CHK_3c8c31439d83c2a5797c63b0dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "CHK_8e1e51c8fe5849dbad5bdf87b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "CHK_f2eb3ae74dbbea1d94eac725d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_c6510e09b8c2a98b4f9acee59a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ALTER COLUMN "id_catalog" DROP NOT NULL`,
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
      `ALTER TABLE "business_hours" ADD CONSTRAINT "CHK_3d5c9ac6afe0673fc29e271ce2" CHECK ("opens_at_minute" < "closes_at_minute")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" ADD CONSTRAINT "CHK_3b0b41a03b97629935a3cc46fb" CHECK ("closes_at_minute" >= 1 AND "closes_at_minute" <= 1440)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" ADD CONSTRAINT "CHK_9eeda96bbaf214c774ba25362e" CHECK ("opens_at_minute" >= 0 AND "opens_at_minute" <= 1439)`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_45cbbe068170d4d7fb75e9e0ec" CHECK ("id_catalog" IS NOT NULL OR "status" = 'pending')`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_c6510e09b8c2a98b4f9acee59a6" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_c6510e09b8c2a98b4f9acee59a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_45cbbe068170d4d7fb75e9e0ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "CHK_9eeda96bbaf214c774ba25362e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "CHK_3b0b41a03b97629935a3cc46fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "CHK_3d5c9ac6afe0673fc29e271ce2"`,
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
      `ALTER TABLE "products" ALTER COLUMN "id_catalog" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_c6510e09b8c2a98b4f9acee59a6" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" ADD CONSTRAINT "CHK_f2eb3ae74dbbea1d94eac725d9" CHECK (((opens_at_minute >= 0) AND (opens_at_minute <= 1439)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" ADD CONSTRAINT "CHK_8e1e51c8fe5849dbad5bdf87b4" CHECK (((closes_at_minute >= 1) AND (closes_at_minute <= 1440)))`,
    );
    await queryRunner.query(
      `ALTER TABLE "business_hours" ADD CONSTRAINT "CHK_3c8c31439d83c2a5797c63b0dd" CHECK ((opens_at_minute < closes_at_minute))`,
    );
  }
}
