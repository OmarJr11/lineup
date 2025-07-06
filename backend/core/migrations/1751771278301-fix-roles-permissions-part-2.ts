import { MigrationInterface, QueryRunner } from "typeorm";

export class FixRolesPermissionsPart21751771278301 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=1;
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=2;
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=3;
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=7;
        `);
        await queryRunner.query(`
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=10;
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=12;
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=13;
            DELETE FROM "system".role_permissions WHERE id_role=4 AND id_permission=14;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "system".role_permissions (id_role, id_permission, id_creation_user)
            VALUES
                (4, 1, 1),
                (4, 2, 1),
                (4, 3, 1),
                (4, 7, 1),
                (4, 10, 1),
                (4, 12, 1),
                (4, 13, 1),
                (4, 14, 1);
        `);
    }

}
