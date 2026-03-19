import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewEntityAudits1773877361534 implements MigrationInterface {
    name = 'CreateNewEntityAudits1773877361534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."entity_audits_operation_enum" AS ENUM('INSERT', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "entity_audits" ("id" BIGSERIAL NOT NULL, "entity_name" character varying(100) NOT NULL, "entity_id" bigint NOT NULL, "operation" "public"."entity_audits_operation_enum" NOT NULL, "old_values" jsonb, "new_values" jsonb, "id_creation_business" bigint, "id_creation_user" bigint, "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_entity_audits_creator" CHECK ((id_creation_business IS NOT NULL) OR (id_creation_user IS NOT NULL)), CONSTRAINT "PK_4194b9433700bc5ee04bcf08224" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "entity_audits" ADD CONSTRAINT "FK_d343ff7cda0a6e6490629a61ae4" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "entity_audits" ADD CONSTRAINT "FK_eb12566b96d97b52ab781c145e5" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_product_audits" DROP CONSTRAINT IF EXISTS "FK_1601fa2aa05295ccc76ac9817b4"`);
        await queryRunner.query(`ALTER TABLE "discount_product_audits" DROP CONSTRAINT IF EXISTS "FK_fc6178059793695e30d3997de2d"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "discount_product_audits"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."discount_product_audits_operation_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."discount_product_audits_operation_enum" AS ENUM('INSERT', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`
            CREATE TABLE "discount_product_audits" (
                "id" BIGSERIAL NOT NULL,
                "id_product" bigint NOT NULL,
                "id_discount_old" bigint,
                "id_discount_new" bigint,
                "operation" "public"."discount_product_audits_operation_enum" NOT NULL,
                "id_creation_business" bigint NOT NULL,
                "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_2b527db4e1189ba7df422761614" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "discount_product_audits" ADD CONSTRAINT "FK_fc6178059793695e30d3997de2d" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "discount_product_audits" ADD CONSTRAINT "FK_1601fa2aa05295ccc76ac9817b4" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`
            INSERT INTO "discount_product_audits" (id_product, id_discount_old, id_discount_new, operation, id_creation_business, creation_date)
            SELECT
                (COALESCE(new_values->>'idProduct', old_values->>'idProduct'))::bigint,
                (old_values->>'idDiscount')::bigint,
                (new_values->>'idDiscount')::bigint,
                operation,
                id_creation_business,
                creation_date
            FROM "entity_audits"
            WHERE entity_name = 'DiscountProduct' AND id_creation_business IS NOT NULL
        `);
        await queryRunner.query(`ALTER TABLE "entity_audits" DROP CONSTRAINT "FK_eb12566b96d97b52ab781c145e5"`);
        await queryRunner.query(`ALTER TABLE "entity_audits" DROP CONSTRAINT "FK_d343ff7cda0a6e6490629a61ae4"`);
        await queryRunner.query(`DROP TABLE "entity_audits"`);
        await queryRunner.query(`DROP TYPE "public"."entity_audits_operation_enum"`);
    }

}
