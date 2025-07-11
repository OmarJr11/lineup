import { MigrationInterface, QueryRunner } from "typeorm";

export class InsertPermissionsPart21749691710773 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO system.permissions (code, description, status, id_creation_user) VALUES
                ('ADMLOG', 'Login as admin or moderator.', 'active', 1);

            -- Assign ADMLOG permission to Admin (id 1) and Moderator (id 3)
            INSERT INTO system.role_permissions (id_role, id_permission, id_creation_user)
            SELECT r.id, p.id, 1
            FROM system.roles r, system.permissions p
            WHERE r.id IN (1, 3) AND p.code = 'ADMLOG';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM system.role_permissions
            WHERE id_permission = (SELECT id FROM system.permissions WHERE code = 'ADMLOG');
            DELETE FROM system.permissions
            WHERE code = 'ADMLOG';
        `);
    }
}
