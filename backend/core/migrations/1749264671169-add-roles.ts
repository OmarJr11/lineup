import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoles1749264671169 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "system".users (creation_date, modification_date, creation_ip, modification_ip, creation_coordinate, modification_coordinate, id, email, email_validated, username, first_name, last_name, status, "password", provider) VALUES('2025-06-06 22:59:19.448', '2025-06-06 22:59:19.448', NULL, NULL, NULL, NULL, 1, 'admin@lineup.com', true, 'admin', 'admin', 'lineup', 'active'::"system".users_status_enum, '$argon2id$v=19$m=65536,t=5,p=1$j4wRxkxG62HfGRqAyGRjNQ$tNV+A3HIj0O3ifpchXZME08h0YCbt4tAUlfWvYN7p+o', 'lineup'::"system".users_provider_enum);
            INSERT INTO system.roles (code, description, status, id_creation_user) VALUES
                ('01ADMLUP', 'Administrator role', 'active', 1),
                ('02USERLUP', 'User role', 'active', 1),
                ('03MODLUP', 'Moderator role', 'active', 1);
            INSERT INTO system.user_roles (id_user, id_role, status, id_creation_user) VALUES
                (1, (SELECT id FROM system.roles WHERE code = '01ADMLUP'), 'active', 1);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM system.user_roles WHERE id_user = 1 AND id_role IN (SELECT id FROM system.roles WHERE code IN ('01ADMLUP'));
            DELETE FROM system.roles WHERE code IN ('01ADMLUP', '02USERLUP', '03MODLUP');
            DELETE FROM system.users WHERE id = 1;
        `);
    }
}
