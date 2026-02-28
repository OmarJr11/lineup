import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntitiesForVisits1771287054620 implements MigrationInterface {
    name = 'CreateEntitiesForVisits1771287054620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_unique_id_social_network_phone"`);
        await queryRunner.query(`CREATE TABLE "business_visits" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_business" bigint NOT NULL, "id_creation_user" bigint, CONSTRAINT "PK_df87be4e5f295406f47945dc8d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_visits" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_product" bigint NOT NULL, "id_creation_user" bigint, CONSTRAINT "PK_556b76ec23216a06bcc9658a985" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "catalog_visits" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_catalog" bigint NOT NULL, "id_creation_user" bigint, CONSTRAINT "PK_a6a4f411dbd3b644f72987cf1d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD "visits" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "visits" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "visits" bigint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "business_visits" ADD CONSTRAINT "FK_5b52176af08e4cf43a7e1e5663b" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_visits" ADD CONSTRAINT "FK_88134150433164d90237fee422c" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_visits" ADD CONSTRAINT "FK_fb40dcf68485884e8f89c1a7130" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_visits" ADD CONSTRAINT "FK_00eea209b8c9752f80a19000458" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalog_visits" ADD CONSTRAINT "FK_79b766c6850eb65adb5b08aaa6a" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalog_visits" ADD CONSTRAINT "FK_aaebb97575fc56e751a7298e1b3" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalog_visits" DROP CONSTRAINT "FK_aaebb97575fc56e751a7298e1b3"`);
        await queryRunner.query(`ALTER TABLE "catalog_visits" DROP CONSTRAINT "FK_79b766c6850eb65adb5b08aaa6a"`);
        await queryRunner.query(`ALTER TABLE "product_visits" DROP CONSTRAINT "FK_00eea209b8c9752f80a19000458"`);
        await queryRunner.query(`ALTER TABLE "product_visits" DROP CONSTRAINT "FK_fb40dcf68485884e8f89c1a7130"`);
        await queryRunner.query(`ALTER TABLE "business_visits" DROP CONSTRAINT "FK_88134150433164d90237fee422c"`);
        await queryRunner.query(`ALTER TABLE "business_visits" DROP CONSTRAINT "FK_5b52176af08e4cf43a7e1e5663b"`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "visits"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "visits"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "visits"`);
        await queryRunner.query(`DROP TABLE "catalog_visits"`);
        await queryRunner.query(`DROP TABLE "product_visits"`);
        await queryRunner.query(`DROP TABLE "business_visits"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_id_social_network_phone" ON "social_network_businesses" ("id_social_network", "phone") WHERE ((phone IS NOT NULL) AND (phone <> ''::text))`);
    }

}
