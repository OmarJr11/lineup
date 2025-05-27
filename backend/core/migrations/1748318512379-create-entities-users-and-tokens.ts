import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntitiesUsersAndTokens1748318512379 implements MigrationInterface {
    name = 'CreateEntitiesUsersAndTokens1748318512379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system"."tokens" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_user" bigint NOT NULL, "token" character varying(400) NOT NULL, "refresh" character varying(400) NOT NULL, "creation_ip" character varying(50), CONSTRAINT "PK_f605be7e1b82d9306600489d65c" PRIMARY KEY ("id_user", "token"))`);
        await queryRunner.query(`CREATE TYPE "system"."users_status_enum" AS ENUM('active', 'inactive', 'pending', 'deleted', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "system"."users" ("id" BIGSERIAL NOT NULL, "mail" character varying(50) NOT NULL, "email_validated" boolean NOT NULL, "username" character varying(50) NOT NULL, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, "status" "system"."users_status_enum" NOT NULL, "phone" text, "provider" character varying(50) NOT NULL, "img_code" character varying(50), "password" character varying(200) NOT NULL, "birthday" date, "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), CONSTRAINT "UQ_2e5b50f4b7c081eceea476ad128" UNIQUE ("mail"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399" FOREIGN KEY ("id_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399"`);
        await queryRunner.query(`DROP TABLE "system"."users"`);
        await queryRunner.query(`DROP TYPE "system"."users_status_enum"`);
        await queryRunner.query(`DROP TABLE "system"."tokens"`);
    }

}
