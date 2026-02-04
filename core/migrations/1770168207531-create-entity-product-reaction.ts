import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityProductReaction1770168207531 implements MigrationInterface {
    name = 'CreateEntityProductReaction1770168207531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."product_reactions_type_enum" AS ENUM('like')`);
        await queryRunner.query(`CREATE TYPE "public"."product_reactions_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "product_reactions" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_product" bigint NOT NULL, "type" "public"."product_reactions_type_enum" NOT NULL, "id_creation_user" bigint NOT NULL, "status" "public"."product_reactions_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_ac84828ced9295b41bd2d63c37b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc183d2cba8a4e04ba8bb8a373" ON "product_reactions" ("id_product", "type", "id_creation_user") `);
        await queryRunner.query(`ALTER TABLE "product_reactions" ADD CONSTRAINT "FK_be4f426053772c8699ca7e9757f" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_reactions" ADD CONSTRAINT "FK_74ce45541382b5cc3948b263e4c" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_reactions" DROP CONSTRAINT "FK_74ce45541382b5cc3948b263e4c"`);
        await queryRunner.query(`ALTER TABLE "product_reactions" DROP CONSTRAINT "FK_be4f426053772c8699ca7e9757f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc183d2cba8a4e04ba8bb8a373"`);
        await queryRunner.query(`DROP TABLE "product_reactions"`);
        await queryRunner.query(`DROP TYPE "public"."product_reactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."product_reactions_type_enum"`);
    }

}
