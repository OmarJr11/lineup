import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityUserRoles1749264267064 implements MigrationInterface {
    name = 'CreateEntityUserRoles1749264267064'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."user_roles_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."user_roles" ("id_user" bigint NOT NULL, "id_role" bigint NOT NULL, "status" "system"."user_roles_status_enum" NOT NULL, "id_creation_user" bigint NOT NULL, CONSTRAINT "PK_dbfb392b1b20247554de529ea7c" PRIMARY KEY ("id_user", "id_role"))`);
        await queryRunner.query(`ALTER TABLE "system"."user_roles" ADD CONSTRAINT "FK_2bc599b2042ba33568f48c52b36" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."user_roles" ADD CONSTRAINT "FK_af69ec5d5bd973309c025e7a62e" FOREIGN KEY ("id_role") REFERENCES "system"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."user_roles" ADD CONSTRAINT "FK_37a75bf56b7a6ae65144e0d5c00" FOREIGN KEY ("id_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."user_roles" DROP CONSTRAINT "FK_37a75bf56b7a6ae65144e0d5c00"`);
        await queryRunner.query(`ALTER TABLE "system"."user_roles" DROP CONSTRAINT "FK_af69ec5d5bd973309c025e7a62e"`);
        await queryRunner.query(`ALTER TABLE "system"."user_roles" DROP CONSTRAINT "FK_2bc599b2042ba33568f48c52b36"`);
        await queryRunner.query(`DROP TABLE "system"."user_roles"`);
        await queryRunner.query(`DROP TYPE "system"."user_roles_status_enum"`);
    }

}
