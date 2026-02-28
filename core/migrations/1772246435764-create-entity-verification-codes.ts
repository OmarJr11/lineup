import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityVerificationCodes1772246435764 implements MigrationInterface {
    name = 'CreateEntityVerificationCodes1772246435764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."verification_codes_channel_enum" AS ENUM('email', 'phone')`);
        await queryRunner.query(`CREATE TYPE "system"."verification_codes_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."verification_codes" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_user" bigint, "id_business" bigint, "channel" "system"."verification_codes_channel_enum" NOT NULL, "destination" character varying(255) NOT NULL, "code" character varying(6) NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "system"."verification_codes_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_18741b6b8bf1680dbf5057421d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_verification_codes_business_active" ON "system"."verification_codes" ("id_business", "status") WHERE id_business IS NOT NULL AND status = 'active'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_verification_codes_user_active" ON "system"."verification_codes" ("id_user", "status") WHERE id_user IS NOT NULL AND status = 'active'`);
        await queryRunner.query(`ALTER TABLE "system"."verification_codes" ADD CONSTRAINT "FK_32a9ac418519a77a441bf48a736" FOREIGN KEY ("id_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."verification_codes" ADD CONSTRAINT "FK_c62f493d2454675dc361fb109df" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."verification_codes" DROP CONSTRAINT "FK_c62f493d2454675dc361fb109df"`);
        await queryRunner.query(`ALTER TABLE "system"."verification_codes" DROP CONSTRAINT "FK_32a9ac418519a77a441bf48a736"`);
        await queryRunner.query(`DROP INDEX "system"."uq_verification_codes_user_active"`);
        await queryRunner.query(`DROP INDEX "system"."uq_verification_codes_business_active"`);
        await queryRunner.query(`DROP TABLE "system"."verification_codes"`);
        await queryRunner.query(`DROP TYPE "system"."verification_codes_status_enum"`);
        await queryRunner.query(`DROP TYPE "system"."verification_codes_channel_enum"`);
    }

}
