import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityLocations1767061949992 implements MigrationInterface {
    name = 'FixEntityLocations1767061949992'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ADD "google_maps_url" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address_components" DROP NOT NULL`);

        //Create permissions
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES 
                ('LOCCREATE', 'Permission to create LOCations', 1),
                ('LOCUPDATE', 'Permission to update LOCations', 1),
                ('LOCDELETE', 'Permission to delete LOCations', 1)
        `);

        // Permission codes to add
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('LOCCREATE', 'LOCUPDATE', 'LOCDELETE')
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
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "address_components" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "google_maps_url"`);

        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('LOCCREATE', 'LOCUPDATE', 'LOCDELETE')
        `);
        for (const permission of permissions) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permission.id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code IN ('LOCCREATE', 'LOCUPDATE', 'LOCDELETE')
        `);
    }

}
