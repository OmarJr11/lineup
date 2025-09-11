import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableLocations1755049878583 implements MigrationInterface {
    name = 'CreateTableLocations1755049878583'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "FK_cac4e8b4b825c9ec56e9bfb866c"`);
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "products" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "title" character varying(255) NOT NULL, "subtitle" character varying(255) NOT NULL, "description" text NOT NULL, "price" numeric(10,2), "likes" bigint NOT NULL DEFAULT '0', "id_catalog" bigint NOT NULL, "tags" text NOT NULL, "status" "public"."products_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."catalogs_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "catalogs" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "title" character varying(255) NOT NULL, "status" "public"."catalogs_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "PK_1883399275415ee6107413fe6c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."locations_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "locations" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "address" character varying(255) NOT NULL, "address_components" text NOT NULL, "status" "public"."locations_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "PK_85f53f59160618e6d86396aacac"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "PK_73f2557c9a0e7bc04d6e6c0cc90" PRIMARY KEY ("id_role")`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP COLUMN "id_business"`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_c6510e09b8c2a98b4f9acee59a6" FOREIGN KEY ("id_catalog") REFERENCES "catalogs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_1d7f5c8f27569eb1cb94b1b1557" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_349d4b30ea93f9a9b08c6fe5b94" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogs" ADD CONSTRAINT "FK_6b1ab825065234f655f6216778c" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "catalogs" ADD CONSTRAINT "FK_a23da3404ab82052d1004c684d1" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_6a89906ed1099030e303d0285e6" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "locations" ADD CONSTRAINT "FK_3e134067a621c3bd582525bb968" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_3e134067a621c3bd582525bb968"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP CONSTRAINT "FK_6a89906ed1099030e303d0285e6"`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP CONSTRAINT "FK_a23da3404ab82052d1004c684d1"`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP CONSTRAINT "FK_6b1ab825065234f655f6216778c"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_349d4b30ea93f9a9b08c6fe5b94"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_1d7f5c8f27569eb1cb94b1b1557"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_c6510e09b8c2a98b4f9acee59a6"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD "id_business" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "PK_73f2557c9a0e7bc04d6e6c0cc90"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "PK_85f53f59160618e6d86396aacac" PRIMARY KEY ("id_business", "id_role")`);
        await queryRunner.query(`DROP TABLE "locations"`);
        await queryRunner.query(`DROP TYPE "public"."locations_status_enum"`);
        await queryRunner.query(`DROP TABLE "catalogs"`);
        await queryRunner.query(`DROP TYPE "public"."catalogs_status_enum"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "FK_cac4e8b4b825c9ec56e9bfb866c" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
