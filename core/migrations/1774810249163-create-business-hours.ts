import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBusinessHours1774810249163 implements MigrationInterface {
  name = 'CreateBusinessHours1774810249163';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."business_hours_day_of_week_enum" AS ENUM('Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado')`,
    );
    await queryRunner.query(
      `CREATE TABLE "business_hours" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_business" bigint NOT NULL, "day_of_week" "public"."business_hours_day_of_week_enum" NOT NULL, "opens_at_minute" smallint NOT NULL, "closes_at_minute" smallint NOT NULL, "slot_order" smallint NOT NULL DEFAULT '1', CONSTRAINT "CHK_3c8c31439d83c2a5797c63b0dd" CHECK ("opens_at_minute" < "closes_at_minute"), CONSTRAINT "CHK_8e1e51c8fe5849dbad5bdf87b4" CHECK ("closes_at_minute" >= 1 AND "closes_at_minute" <= 1440), CONSTRAINT "CHK_f2eb3ae74dbbea1d94eac725d9" CHECK ("opens_at_minute" >= 0 AND "opens_at_minute" <= 1439), CONSTRAINT "PK_560a76077605005da835fe505a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_business_hours_business_day_slot" ON "business_hours" ("id_business", "day_of_week", "slot_order") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_business_hours_business_day" ON "business_hours" ("id_business", "day_of_week") `,
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
      `ALTER TABLE "business_hours" ADD CONSTRAINT "FK_a0375150a2a99c3be5c5c352426" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business_hours" DROP CONSTRAINT "FK_a0375150a2a99c3be5c5c352426"`,
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
      `DROP INDEX "public"."idx_business_hours_business_day"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_business_hours_business_day_slot"`,
    );
    await queryRunner.query(`DROP TABLE "business_hours"`);
    await queryRunner.query(
      `DROP TYPE "public"."business_hours_day_of_week_enum"`,
    );
  }
}
