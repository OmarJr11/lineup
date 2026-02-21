import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds SEEDBUS permission and assigns it to the admin role.
 */
export class AddSeedPermissionToAdmin1771550000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES ('SEEDBUS', 'Permission to seed businesses and catalogs (development)', 1)
        `);
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code = 'SEEDBUS'
        `);
        const admin = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '01ADMLUP'
        `);
        const permissionId = permissions[0].id;
        const adminRoleId = admin[0].id;
        await queryRunner.query(`
            INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
            VALUES (${adminRoleId}, ${permissionId}, 1)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code = 'SEEDBUS'
        `);
        if (permissions?.length) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permissions[0].id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code = 'SEEDBUS'
        `);
    }
}
