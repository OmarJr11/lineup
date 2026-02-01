import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductFilesEntity1769978664301 implements MigrationInterface {
    name = 'CreateProductFilesEntity1769978664301'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."product_files_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "product_files" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "image_code" character varying(50) NOT NULL, "id_product" bigint NOT NULL, "order" bigint NOT NULL DEFAULT '0', "status" "public"."product_files_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "PK_d741e1a2d0cde49c1f897048626" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "product_files" ADD CONSTRAINT "FK_7d097fc77830915bfe5e58fd7c0" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_files" ADD CONSTRAINT "FK_12e82854495757e7fc0dbc99fe7" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_files" ADD CONSTRAINT "FK_66893df5563b418089717fcf315" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_files" ADD CONSTRAINT "FK_b4663b52308bf12f9f0b36fe844" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_files" DROP CONSTRAINT "FK_b4663b52308bf12f9f0b36fe844"`);
        await queryRunner.query(`ALTER TABLE "product_files" DROP CONSTRAINT "FK_66893df5563b418089717fcf315"`);
        await queryRunner.query(`ALTER TABLE "product_files" DROP CONSTRAINT "FK_12e82854495757e7fc0dbc99fe7"`);
        await queryRunner.query(`ALTER TABLE "product_files" DROP CONSTRAINT "FK_7d097fc77830915bfe5e58fd7c0"`);
        await queryRunner.query(`DROP TABLE "product_files"`);
        await queryRunner.query(`DROP TYPE "public"."product_files_status_enum"`);
    }

}
