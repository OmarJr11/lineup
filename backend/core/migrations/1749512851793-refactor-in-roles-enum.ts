import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorInRolesEnum1749512851793 implements MigrationInterface {
    name = 'RefactorInRolesEnum1749512851793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "system"."roles_code_enum" RENAME TO "roles_code_enum_old"`);
        await queryRunner.query(`CREATE TYPE "system"."roles_code_enum" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP', '05BUSSLUP')`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ALTER COLUMN "code" TYPE "system"."roles_code_enum" USING "code"::"text"::"system"."roles_code_enum"`);
        await queryRunner.query(`DROP TYPE "system"."roles_code_enum_old"`);
        await queryRunner.query(`
            INSERT INTO system.roles (code, description, status, id_creation_user) VALUES
                ('05BUSSLUP', 'Business role', 'active', 1)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM system.roles WHERE code IN ('05BUSSLUP');
        `);
        await queryRunner.query(`CREATE TYPE "system"."roles_code_enum_old" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP')`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ALTER COLUMN "code" TYPE "system"."roles_code_enum_old" USING "code"::"text"::"system"."roles_code_enum_old"`);
        await queryRunner.query(`DROP TYPE "system"."roles_code_enum"`);
        await queryRunner.query(`ALTER TYPE "system"."roles_code_enum_old" RENAME TO "roles_code_enum"`);
    }

}
