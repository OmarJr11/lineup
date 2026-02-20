import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEntitiesForSearches1771533999570 implements MigrationInterface {
    name = 'AddEntitiesForSearches1771533999570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "business_search_index" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_business" bigint NOT NULL, "search_vector" tsvector, "visits" bigint NOT NULL DEFAULT '0', "followers" bigint NOT NULL DEFAULT '0', "catalog_visits_total" bigint NOT NULL DEFAULT '0', "product_likes_total" bigint NOT NULL DEFAULT '0', "product_visits_total" bigint NOT NULL DEFAULT '0', CONSTRAINT "UQ_834f45dd19f9f6d8ac0879c18e6" UNIQUE ("id_business"), CONSTRAINT "PK_55b05abee22397d456210f002a6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "catalog_search_index" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_catalog" bigint NOT NULL, "id_business" bigint NOT NULL, "search_vector" tsvector, "visits" bigint NOT NULL DEFAULT '0', "product_likes_total" bigint NOT NULL DEFAULT '0', "product_visits_total" bigint NOT NULL DEFAULT '0', CONSTRAINT "UQ_72e52f304a1599c4d79e2589fd1" UNIQUE ("id_catalog"), CONSTRAINT "PK_7f4b6ba978f12a679b44f4e3545" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_search_index" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_product" bigint NOT NULL, "id_business" bigint NOT NULL, "id_catalog" bigint NOT NULL, "search_vector" tsvector, "likes" bigint NOT NULL DEFAULT '0', "visits" bigint NOT NULL DEFAULT '0', CONSTRAINT "PK_9973d8d677176fd00166ae7db55" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4a12430b4b1aede37a9322cb49" ON "product_search_index" ("id_product") `);
        await queryRunner.query(`ALTER TABLE "business_search_index" ADD CONSTRAINT "FK_834f45dd19f9f6d8ac0879c18e6" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalog_search_index" ADD CONSTRAINT "FK_72e52f304a1599c4d79e2589fd1" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalog_search_index" ADD CONSTRAINT "FK_76b28b255f3fc33513eb34c217f" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_search_index" ADD CONSTRAINT "FK_4a12430b4b1aede37a9322cb49e" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_search_index" ADD CONSTRAINT "FK_d692a38555789b969d4974c3b5c" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_search_index" ADD CONSTRAINT "FK_e3a6a4ecc522a95e60426c94b37" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_search_index" DROP CONSTRAINT "FK_e3a6a4ecc522a95e60426c94b37"`);
        await queryRunner.query(`ALTER TABLE "product_search_index" DROP CONSTRAINT "FK_d692a38555789b969d4974c3b5c"`);
        await queryRunner.query(`ALTER TABLE "product_search_index" DROP CONSTRAINT "FK_4a12430b4b1aede37a9322cb49e"`);
        await queryRunner.query(`ALTER TABLE "catalog_search_index" DROP CONSTRAINT "FK_76b28b255f3fc33513eb34c217f"`);
        await queryRunner.query(`ALTER TABLE "catalog_search_index" DROP CONSTRAINT "FK_72e52f304a1599c4d79e2589fd1"`);
        await queryRunner.query(`ALTER TABLE "business_search_index" DROP CONSTRAINT "FK_834f45dd19f9f6d8ac0879c18e6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4a12430b4b1aede37a9322cb49"`);
        await queryRunner.query(`DROP TABLE "product_search_index"`);
        await queryRunner.query(`DROP TABLE "catalog_search_index"`);
        await queryRunner.query(`DROP TABLE "business_search_index"`);
    }

}
