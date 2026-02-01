import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityProducVariations1769984068554 implements MigrationInterface {
    name = 'CreateEntityProducVariations1769984068554'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."product_variations_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "product_variations" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "title" character varying(255) NOT NULL, "options" text array NOT NULL, "id_product" bigint NOT NULL, "status" "public"."product_variations_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "PK_353249b2d301e047dde9ef0487c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_variations" ADD CONSTRAINT "FK_33d0e435d6d4703ffd1e7e6732b" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variations" ADD CONSTRAINT "FK_bd108895722202527b781d7b3db" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_variations" ADD CONSTRAINT "FK_88e2b95233fe0138878bc9dc2f2" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_variations" DROP CONSTRAINT "FK_88e2b95233fe0138878bc9dc2f2"`);
        await queryRunner.query(`ALTER TABLE "product_variations" DROP CONSTRAINT "FK_bd108895722202527b781d7b3db"`);
        await queryRunner.query(`ALTER TABLE "product_variations" DROP CONSTRAINT "FK_33d0e435d6d4703ffd1e7e6732b"`);
        await queryRunner.query(`DROP TABLE "product_variations"`);
        await queryRunner.query(`DROP TYPE "public"."product_variations_status_enum"`);
    }

}
