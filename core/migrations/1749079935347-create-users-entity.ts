import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersEntity1749079935347 implements MigrationInterface {
    name = 'CreateUsersEntity1749079935347'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "system"`);
        await queryRunner.query(`CREATE TYPE "system"."users_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."users" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "email" character varying(50) NOT NULL, "email_validated" boolean NOT NULL, "username" character varying(50) NOT NULL, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, "status" "system"."users_status_enum" NOT NULL, "provider" character varying(50) NOT NULL, "password" character varying(200) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system"."users"`);
        await queryRunner.query(`DROP TYPE "system"."users_status_enum"`);
        await queryRunner.query(`DROP SCHEMA IF EXISTS "system"`);
    }

}
