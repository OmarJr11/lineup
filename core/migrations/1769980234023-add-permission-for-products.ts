import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPermissionForProducts1769980234023 implements MigrationInterface {
    name = 'AddPermissionForProducts1769980234023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        //Create permissions
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES 
                ('PRODCRE', 'Permission to create Products', 1),
                ('PRODUPD', 'Permission to update Products', 1),
                ('PRODDEL', 'Permission to delete Products', 1)
        `);

        // Permission codes to add
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('PRODCRE', 'PRODUPD', 'PRODDEL')
        `);

        const business = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '05BUSSLUP'
        `);
        const businessRoleId = business[0].id;
        const admin = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '01ADMLUP'
        `);
        const role = admin[0].id;
        // Associate each permission with the role if not already associated
        for (const p of permissions) {
            await queryRunner.query(`
                INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
                VALUES (${role}, ${p.id}, 1)
            `);
            await queryRunner.query(`
                INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
                VALUES (${businessRoleId}, ${p.id}, 1)
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('PRODCRE', 'PRODUPD', 'PRODDEL')
        `);
        for (const permission of permissions) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permission.id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code IN ('PRODCRE', 'PRODUPD', 'PRODDEL')
        `);
    }

}
