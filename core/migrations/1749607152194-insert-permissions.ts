import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertPermissions1749607152194 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO system.permissions (code, description, status, id_creation_user) VALUES
                ('USRLISOWN', 'View information of the own user.', 'active', 1),
                ('USRLISALL', 'View information for all users.', 'active', 1),
                ('USRDELOWN', 'Delete own user.', 'active', 1),
                ('USRDELALL', 'Delete any user.', 'active', 1),
                ('USRCREALL', 'Create other users.', 'active', 1),
                ('USRUPDALL', 'Update any user.', 'active', 1),
                ('USRUPDOWN', 'Update own user.', 'active', 1);

            -- Role 1 (ADMIN) gets all permissions
            INSERT INTO system.role_permissions (id_role, id_permission, id_creation_user) 
            SELECT 1, id, 1 FROM system.permissions;

            -- Roles 2, and 4 get only USRLISOWN, USRLISALL, USRDELOWN, USRUPDOWN
            INSERT INTO system.role_permissions (id_role, id_permission, id_creation_user)
            SELECT r.id, p.id, 1 FROM system.roles r, system.permissions p
            WHERE r.id IN (2,4,5) AND p.code IN ('USRLISOWN', 'USRLISALL', 'USRDELOWN', 'USRUPDOWN');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM system.role_permissions WHERE id_role IN (1,2,3,4,5);
            DELETE FROM system.permissions WHERE code IN ('USRLISOWN', 'USRLISALL', 'USRDELOWN', 'USRDELALL', 'USRCREALL', 'USRUPDALL', 'USRUPDOWN');
        `);
    }
}
