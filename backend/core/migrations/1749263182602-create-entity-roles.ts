import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityRoles1749263182602 implements MigrationInterface {
    name = 'CreateEntityRoles1749263182602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."roles_code_enum" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP')`);
        await queryRunner.query(`CREATE TYPE "system"."roles_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."roles" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "code" "system"."roles_code_enum" NOT NULL, "description" character varying(100) NOT NULL, "status" "system"."roles_status_enum" NOT NULL, "id_creation_user" bigint NOT NULL, "id_modification_user" bigint, CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ADD CONSTRAINT "FK_a4568ce01baa68a6e232ce3f7fb" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ADD CONSTRAINT "FK_2b87ce4db3c87c55fbdfa9e2b11" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."roles" DROP CONSTRAINT "FK_2b87ce4db3c87c55fbdfa9e2b11"`);
        await queryRunner.query(`ALTER TABLE "system"."roles" DROP CONSTRAINT "FK_a4568ce01baa68a6e232ce3f7fb"`);
        await queryRunner.query(`DROP TABLE "system"."roles"`);
        await queryRunner.query(`DROP TYPE "system"."roles_status_enum"`);
        await queryRunner.query(`DROP TYPE "system"."roles_code_enum"`);
    }

}
