import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityBusinessFollowers1770171238898 implements MigrationInterface {
    name = 'CreateEntityBusinessFollowers1770171238898'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" ADD "followers" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`CREATE TYPE "public"."business_followers_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "business_followers" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_business" bigint NOT NULL, "id_creation_user" bigint NOT NULL, "status" "public"."business_followers_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_06d15e521178ba8e8eeca77aa07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6a013031155a4082058e84c002" ON "business_followers" ("id_business", "id_creation_user") `);
        await queryRunner.query(`ALTER TABLE "business_followers" ADD CONSTRAINT "FK_7f09dc29be7a57de1e2cff86733" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "business_followers" ADD CONSTRAINT "FK_1bd2e6badfe132ecbaa8b6ef794" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "business_followers" DROP CONSTRAINT "FK_1bd2e6badfe132ecbaa8b6ef794"`);
        await queryRunner.query(`ALTER TABLE "business_followers" DROP CONSTRAINT "FK_7f09dc29be7a57de1e2cff86733"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6a013031155a4082058e84c002"`);
        await queryRunner.query(`DROP TABLE "business_followers"`);
        await queryRunner.query(`DROP TYPE "public"."business_followers_status_enum"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP COLUMN "followers"`);
    }

}
