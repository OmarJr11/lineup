import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddColumnHexColor1774577898478 implements MigrationInterface {
  name = 'AddColumnHexColor1774577898478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "businesses" ADD "hex_color" character varying(7)`,
    );
    await queryRunner.query(
      `ALTER TABLE "catalogs" ADD "hex_color" character varying(7)`,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
    await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "hex_color"`);
    await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "hex_color"`);
  }
}
