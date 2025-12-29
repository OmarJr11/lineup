import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCatalogsPermissionsToBusinessRole1766973380783 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        //Create permissions
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES 
                ('CATCREATE', 'Permission to create catalogs', 1),
                ('CATUPDATE', 'Permission to update catalogs', 1),
                ('CATDELETE', 'Permission to delete catalogs', 1)
        `);

        // Permission codes to add
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('CATCREATE', 'CATUPDATE', 'CATDELETE')
        `);   

        const business = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '05BUSSLUP'
        `);
        const role = business[0].id;

        // Associate each permission with the role if not already associated
        for (const p of permissions) {
            await queryRunner.query(`
                INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
                VALUES (${role}, ${p.id}, 1)
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('CATCREATE', 'CATUPDATE', 'CATDELETE')
        `);
        for (const permission of permissions) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permission.id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code IN ('CATCREATE', 'CATUPDATE', 'CATDELETE')
        `);
    }

}
