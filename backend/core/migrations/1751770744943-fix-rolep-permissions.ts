import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRolepPermissions1751770744943 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO system.permissions (code, description, status, id_creation_user) VALUES
            ('BURLISOWN', 'View information of the own Businesses.', 'active', 1),
            ('BURLISALL', 'View information for all Businesses.', 'active', 1),
            ('BURDELOWN', 'Delete own Businesses.', 'active', 1),
            ('BURDELALL', 'Delete any Businesses.', 'active', 1),
            ('BURCREALL', 'Create other Businesses.', 'active', 1),
            ('BURUPDALL', 'Update any Businesses.', 'active', 1),
            ('BURUPDOWN', 'Update own Businesses.', 'active', 1);
        `);

        for (const roleId of [1, 4]) {
            await queryRunner.query(`
                INSERT INTO system.role_permissions (id_role, id_permission, id_creation_user)
                SELECT ${roleId}, id, 1 FROM system.permissions
                WHERE code IN (
                    'BURLISOWN',
                    'BURLISALL',
                    'BURDELOWN',
                    'BURDELALL',
                    'BURCREALL',
                    'BURUPDALL',
                    'BURUPDOWN'
                )
                ON CONFLICT (id_role, id_permission) DO NOTHING;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM system.role_permissions
            WHERE id_permission IN (
                SELECT id FROM system.permissions WHERE code IN (
                    'BURLISOWN',
                    'BURLISALL',
                    'BURDELOWN',
                    'BURDELALL',
                    'BURCREALL',
                    'BURUPDALL',
                    'BURUPDOWN'
                )
            );
        `);
        await queryRunner.query(`
            DELETE FROM system.permissions WHERE code IN (
                'BURLISOWN',
                'BURLISALL',
                'BURDELOWN',
                'BURDELALL',
                'BURCREALL',
                'BURUPDALL',
                'BURUPDOWN'
            );
        `);
    }
}