import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCarts1775800000000 implements MigrationInterface {
  name = 'CreateCarts1775800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "carts" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_creation_user" bigint NOT NULL, "id_business" bigint NOT NULL, "total" numeric(12,2) NOT NULL DEFAULT '0', "itemsCount" integer NOT NULL DEFAULT '0', "lastActivityDate" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_carts_id" PRIMARY KEY ("id"), CONSTRAINT "UQ_carts_user_business" UNIQUE ("id_creation_user", "id_business"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cart_items" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_cart" bigint NOT NULL, "id_product" bigint NOT NULL, "id_product_sku" bigint, "quantity" integer NOT NULL, "unitPrice" numeric(12,2) NOT NULL, "subtotal" numeric(12,2) NOT NULL, "variationOptions" jsonb, CONSTRAINT "PK_cart_items_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_creation_user" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" ADD CONSTRAINT "FK_carts_business" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_cart" FOREIGN KEY ("id_cart") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_cart_items_product_sku" FOREIGN KEY ("id_product_sku") REFERENCES "product_skus"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product_sku"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_product"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_cart_items_cart"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_business"`,
    );
    await queryRunner.query(
      `ALTER TABLE "carts" DROP CONSTRAINT "FK_carts_creation_user"`,
    );
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "carts"`);
  }
}
