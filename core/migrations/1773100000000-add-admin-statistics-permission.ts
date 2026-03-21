import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds ADMSTATS permission and assigns it to Admin and Moderator roles.
 */
export class AddAdminStatisticsPermission1773100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES ('ADMSTATS', 'View admin platform statistics.', 1)
        `);
    await queryRunner.query(`
            INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
            SELECT r.id, p.id, 1
            FROM "system"."roles" r
            CROSS JOIN "system"."permissions" p
            WHERE r.code IN ('01ADMLUP', '03MODLUP') AND p.code = 'ADMSTATS'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions" WHERE code = 'ADMSTATS'
        `);
    if (permissions?.length) {
      await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permissions[0].id}
            `);
    }
    await queryRunner.query(`
            DELETE FROM "system"."permissions" WHERE code = 'ADMSTATS'
        `);
  }
}
