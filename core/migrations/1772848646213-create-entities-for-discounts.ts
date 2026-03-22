import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntitiesForDiscounts1772848646213
  implements MigrationInterface
{
  name = 'CreateEntitiesForDiscounts1772848646213';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."discounts_discount_type_enum" AS ENUM('percentage', 'fixed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."discounts_scope_enum" AS ENUM('business', 'catalog', 'product')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."discounts_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`,
    );
    await queryRunner.query(
      `CREATE TABLE "discounts" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "discount_type" "public"."discounts_discount_type_enum" NOT NULL, "value" numeric(10,2) NOT NULL, "id_currency" bigint, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "scope" "public"."discounts_scope_enum" NOT NULL, "id_catalog" bigint, "status" "public"."discounts_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "CHK_b1d8e5b2d7304b94e3f8ae03d9" CHECK ((discount_type = 'percentage' AND id_currency IS NULL) OR (discount_type = 'fixed' AND id_currency IS NOT NULL)), CONSTRAINT "CHK_ab3d99041b6cdfd092b99564f5" CHECK ((scope = 'business' AND id_catalog IS NULL) OR (scope = 'catalog' AND id_catalog IS NOT NULL) OR (scope = 'product' AND id_catalog IS NULL)), CONSTRAINT "PK_66c522004212dc814d6e2f14ecc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "discount_products" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id_product" bigint NOT NULL, "id_discount" bigint NOT NULL, "id_creation_business" bigint NOT NULL, CONSTRAINT "PK_e3767dd3a7d1b26f69fc5e590f8" PRIMARY KEY ("id_product"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."discount_product_audits_operation_enum" AS ENUM('INSERT', 'UPDATE', 'DELETE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "discount_product_audits" ("id" BIGSERIAL NOT NULL, "id_product" bigint NOT NULL, "id_discount_old" bigint, "id_discount_new" bigint, "operation" "public"."discount_product_audits_operation_enum" NOT NULL, "id_creation_business" bigint NOT NULL, "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2b527db4e1189ba7df422761614" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_17f3871d80a2e52a466d3e7fd30" FOREIGN KEY ("id_currency") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_0a44ea3b16ab0ff0477479339e2" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_a3467406362aa1bd1db63681b89" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_3efc4a512919eee0fd805f360ae" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "FK_e3767dd3a7d1b26f69fc5e590f8" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "FK_0e604a093f7bd686284190b37c5" FOREIGN KEY ("id_discount") REFERENCES "discounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" ADD CONSTRAINT "FK_d11232bbfed3c674e340393a3df" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_product_audits" ADD CONSTRAINT "FK_fc6178059793695e30d3997de2d" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_product_audits" ADD CONSTRAINT "FK_1601fa2aa05295ccc76ac9817b4" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES
                ('DISCCRE', 'Create discounts', 1),
                ('DISCUPD', 'Update discounts', 1),
                ('DISCDEL', 'Delete discounts', 1),
                ('DISCREAD', 'Read/list discounts', 1)
        `);

    const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('DISCCRE', 'DISCUPD', 'DISCDEL', 'DISCREAD')
        `);

    const [adminRole] = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '01ADMLUP'
        `);
    const [businessRole] = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '05BUSSLUP'
        `);

    for (const p of permissions) {
      await queryRunner.query(`
                INSERT INTO "system"."role_permissions" (id_role, id_permission, id_creation_user)
                VALUES (${adminRole.id}, ${p.id}, 1)
            `);
      await queryRunner.query(`
                INSERT INTO "system"."role_permissions" (id_role, id_permission, id_creation_user)
                VALUES (${businessRole.id}, ${p.id}, 1)
            `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('DISCCRE', 'DISCUPD', 'DISCDEL', 'DISCREAD')
        `);
    for (const permission of permissions) {
      await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE id_permission = ${permission.id}
            `);
    }
    await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code IN ('DISCCRE', 'DISCUPD', 'DISCDEL', 'DISCREAD')
        `);

    await queryRunner.query(
      `ALTER TABLE "discount_product_audits" DROP CONSTRAINT "FK_1601fa2aa05295ccc76ac9817b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_product_audits" DROP CONSTRAINT "FK_fc6178059793695e30d3997de2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "FK_d11232bbfed3c674e340393a3df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "FK_0e604a093f7bd686284190b37c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discount_products" DROP CONSTRAINT "FK_e3767dd3a7d1b26f69fc5e590f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_3efc4a512919eee0fd805f360ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_a3467406362aa1bd1db63681b89"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_0a44ea3b16ab0ff0477479339e2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_17f3871d80a2e52a466d3e7fd30"`,
    );
    await queryRunner.query(`DROP TABLE "discount_product_audits"`);
    await queryRunner.query(
      `DROP TYPE "public"."discount_product_audits_operation_enum"`,
    );
    await queryRunner.query(`DROP TABLE "discount_products"`);
    await queryRunner.query(`DROP TABLE "discounts"`);
    await queryRunner.query(`DROP TYPE "public"."discounts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."discounts_scope_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."discounts_discount_type_enum"`,
    );
  }
}
