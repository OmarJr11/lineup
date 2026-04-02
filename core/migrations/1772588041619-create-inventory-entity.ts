import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryEntity1772588041619 implements MigrationInterface {
  name = 'CreateInventoryEntity1772588041619';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movements_type_enum" AS ENUM('PURCHASE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'SALE', 'REMOVAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."stock_movements_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`,
    );
    await queryRunner.query(
      `CREATE TABLE "stock_movements" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_product_sku" bigint NOT NULL, "id_creation_business" bigint NOT NULL, "type" "public"."stock_movements_type_enum" NOT NULL, "quantity_delta" integer NOT NULL, "previous_quantity" integer NOT NULL, "new_quantity" integer NOT NULL, "notes" text, "status" "public"."stock_movements_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_57a26b190618550d8e65fb860e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_fd7b70e3335e084939203fa1400" FOREIGN KEY ("id_product_sku") REFERENCES "product_skus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" ADD CONSTRAINT "FK_cef164bd5b0db72ab2c5a19b389" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_cef164bd5b0db72ab2c5a19b389"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stock_movements" DROP CONSTRAINT "FK_fd7b70e3335e084939203fa1400"`,
    );
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TYPE "public"."stock_movements_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."stock_movements_type_enum"`);
  }
}
