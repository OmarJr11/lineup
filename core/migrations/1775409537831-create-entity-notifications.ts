import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntityNotifications1775409537831 implements MigrationInterface {
  name = 'CreateEntityNotifications1775409537831';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'SYSTEM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "body" text NOT NULL, "payload" jsonb, "id_creation_user" bigint, "id_creation_business" bigint, "read_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
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
      `ALTER TABLE "public"."notifications" ADD CONSTRAINT "FK_bc05362222b52c852e9b8ad790d" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "public"."notifications" ADD CONSTRAINT "FK_b34a08ac3a693b91a7afae30619" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_b34a08ac3a693b91a7afae30619"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_bc05362222b52c852e9b8ad790d"`,
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
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
