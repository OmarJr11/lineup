import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates Business Premium role with inventory permissions.
 * Admin and Business Premium roles get INVMGMT permission.
 */
export class AddBusinessPremiumRoleAndInventoryPermissions1772590000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TYPE "system"."roles_code_enum" RENAME TO "roles_code_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "system"."roles_code_enum" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP', '05BUSSLUP', '06BUSADMLUP', '07BUSPREMLUP')
        `);
    await queryRunner.query(`
            ALTER TABLE "system"."roles" ALTER COLUMN "code" TYPE "system"."roles_code_enum" USING "code"::"text"::"system"."roles_code_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "system"."roles_code_enum_old"
        `);
    await queryRunner.query(`
            INSERT INTO "system"."roles" (code, description, status, id_creation_user)
            VALUES ('07BUSPREMLUP', 'Business Premium - Premium subscription with inventory management', 'active', 1)
        `);
    await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            SELECT 'INVMGMT', 'Manage inventory: adjust stock, register sales, view history', 1
            WHERE NOT EXISTS (SELECT 1 FROM "system"."permissions" WHERE code = 'INVMGMT')
        `);
    await queryRunner.query(`
            INSERT INTO "system"."role_permissions" (id_role, id_permission, id_creation_user)
            SELECT r.id, p.id, 1
            FROM "system"."roles" r, "system"."permissions" p
            WHERE r.code IN ('01ADMLUP', '07BUSPREMLUP') AND p.code = 'INVMGMT'
            AND NOT EXISTS (
                SELECT 1 FROM "system"."role_permissions" rp
                WHERE rp.id_role = r.id AND rp.id_permission = p.id
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "system"."business_roles" WHERE id_role IN (SELECT id FROM "system"."roles" WHERE code = '07BUSPREMLUP')
        `);
    await queryRunner.query(`
            DELETE FROM "system"."role_permissions"
            WHERE id_permission = (SELECT id FROM "system"."permissions" WHERE code = 'INVMGMT')
        `);
    await queryRunner.query(`
            DELETE FROM "system"."permissions" WHERE code = 'INVMGMT'
        `);
    await queryRunner.query(`
            DELETE FROM "system"."roles" WHERE code = '07BUSPREMLUP'
        `);
    await queryRunner.query(`
            ALTER TYPE "system"."roles_code_enum" RENAME TO "roles_code_enum_old"
        `);
    await queryRunner.query(`
            CREATE TYPE "system"."roles_code_enum" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP', '05BUSSLUP', '06BUSADMLUP')
        `);
    await queryRunner.query(`
            ALTER TABLE "system"."roles" ALTER COLUMN "code" TYPE "system"."roles_code_enum" USING "code"::"text"::"system"."roles_code_enum"
        `);
    await queryRunner.query(`
            DROP TYPE "system"."roles_code_enum_old"
        `);
  }
}
