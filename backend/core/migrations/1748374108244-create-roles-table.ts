import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolesTable1748374108244 implements MigrationInterface {
    name = 'CreateRolesTable1748374108244'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."roles_code_enum" AS ENUM('01ADM', '02USE', '03BUS', '04COL')`);
        await queryRunner.query(`CREATE TYPE "system"."roles_status_enum" AS ENUM('active', 'inactive', 'pending', 'deleted', 'approved', 'rejected', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "system"."roles" ("id" BIGSERIAL NOT NULL, "code" "system"."roles_code_enum" NOT NULL, "name" character varying(255) NOT NULL, "status" "system"."roles_status_enum" NOT NULL, "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "id_creation_user" bigint NOT NULL, "creation_ip" character varying(50), "modification_ip" character varying(50), "id_modification_user" bigint, CONSTRAINT "UQ_f6d54f95c31b73fb1bdd8e91d0c" UNIQUE ("code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ADD CONSTRAINT "FK_438164f19250c85a7d2801dabea" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ADD CONSTRAINT "FK_c805b855515ec0fc0442e8f7ad6" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`
            INSERT INTO "system"."users"
                ("id", "username", "mail", "password", "status", "first_name", "last_name", "creation_date", "email_validated", "provider")
            VALUES
                (1, 'admin', 'admin@admin.com', 'admin', 'active', 'Admin', 'System', now(), true, 'line-up')
        `);
        await queryRunner.query(`
            INSERT INTO "system"."roles"
                ("code", "name", "status", "id_creation_user")
            VALUES
                ('01ADM', 'Administrador', 'active', 1),
                ('02USE', 'User', 'active', 1),
                ('03BUS', 'Business', 'active', 1),
                ('04COL', 'Collaborator', 'active', 1)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."roles" DROP CONSTRAINT "FK_c805b855515ec0fc0442e8f7ad6"`);
        await queryRunner.query(`ALTER TABLE "system"."roles" DROP CONSTRAINT "FK_438164f19250c85a7d2801dabea"`);
        await queryRunner.query(`DROP TABLE "system"."roles"`);
        await queryRunner.query(`DROP TYPE "system"."roles_status_enum"`);
        await queryRunner.query(`DROP TYPE "system"."roles_code_enum"`);
        await queryRunner.query(`DELETE FROM "system"."users" WHERE id = 1`);
    }

}
