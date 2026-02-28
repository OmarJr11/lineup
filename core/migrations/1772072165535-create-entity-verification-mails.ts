import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityVerificationMails1772072165535 implements MigrationInterface {
    name = 'CreateEntityVerificationMails1772072165535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."validation_mails_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."validation_mails" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "email" character varying(255) NOT NULL, "code" character varying(6) NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "system"."validation_mails_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "PK_12a088d58a75e59214240de960c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_validation_mails_code_active" ON "system"."validation_mails" ("code", "status") WHERE status = 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "system"."uq_validation_mails_code_active"`);
        await queryRunner.query(`DROP TABLE "system"."validation_mails"`);
        await queryRunner.query(`DROP TYPE "system"."validation_mails_status_enum"`);
    }

}
