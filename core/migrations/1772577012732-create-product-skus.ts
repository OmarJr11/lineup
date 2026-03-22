import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductSkus1772577012732 implements MigrationInterface {
  name = 'CreateProductSkus1772577012732';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."product_skus_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_skus" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_product" bigint NOT NULL, "sku_code" character varying(100) NOT NULL, "variation_options" jsonb NOT NULL DEFAULT '{}', "quantity" integer NOT NULL DEFAULT '0', "price" numeric(10,2), "status" "public"."product_skus_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "UQ_53728b0ae1ed2d574fb0b597065" UNIQUE ("sku_code"), CONSTRAINT "PK_2acf028b6a5492960021db0273a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD CONSTRAINT "FK_83e58f11c2ac632270a6057371a" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD CONSTRAINT "FK_6efecf5a2b6bb45c3f9eb7aa632" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD CONSTRAINT "FK_db690d2f29ff3e2b1486dd3522e" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP CONSTRAINT "FK_db690d2f29ff3e2b1486dd3522e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP CONSTRAINT "FK_6efecf5a2b6bb45c3f9eb7aa632"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP CONSTRAINT "FK_83e58f11c2ac632270a6057371a"`,
    );
    await queryRunner.query(`DROP TABLE "product_skus"`);
    await queryRunner.query(`DROP TYPE "public"."product_skus_status_enum"`);
  }
}
