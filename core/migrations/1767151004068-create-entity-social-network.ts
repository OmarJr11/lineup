import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntitySocialNetwork1767151004068 implements MigrationInterface {
    name = 'CreateEntitySocialNetwork1767151004068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."social_networks_code_enum" AS ENUM('facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'github', 'pinterest', 'snapchat', 'reddit', 'whatsapp', 'telegram', 'discord', 'phone', 'email', 'other')`);
        await queryRunner.query(`CREATE TYPE "system"."social_networks_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."social_networks" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" "system"."social_networks_code_enum" NOT NULL, "image_code" character varying(255) NOT NULL, "status" "system"."social_networks_status_enum" NOT NULL DEFAULT 'active', "id_creation_user" bigint NOT NULL, "id_modification_user" bigint, CONSTRAINT "UQ_c583d61759c0d1c11095b81032c" UNIQUE ("name"), CONSTRAINT "PK_973974c10fd4f3f1625c24178cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "system"."social_networks" ADD CONSTRAINT "FK_6979d2d49379f5aac211f1734b8" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."social_networks" ADD CONSTRAINT "FK_5f98533cf0756aecbf331116c1b" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."social_networks" ADD CONSTRAINT "FK_5c985d44bc888fddbf8ea4509c7" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        //Create permissions
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES 
                ('SNWCRE', 'Permission to create Social Networks', 1),
                ('SNWUPD', 'Permission to update Social Networks', 1),
                ('SNWDEL', 'Permission to delete Social Networks', 1)
        `);

        // Permission codes to add
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('SNWCRE', 'SNWUPD', 'SNWDEL')
        `);

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
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."social_networks" DROP CONSTRAINT "FK_5c985d44bc888fddbf8ea4509c7"`);
        await queryRunner.query(`ALTER TABLE "system"."social_networks" DROP CONSTRAINT "FK_5f98533cf0756aecbf331116c1b"`);
        await queryRunner.query(`ALTER TABLE "system"."social_networks" DROP CONSTRAINT "FK_6979d2d49379f5aac211f1734b8"`);
        await queryRunner.query(`DROP TABLE "system"."social_networks"`);
        await queryRunner.query(`DROP TYPE "system"."social_networks_status_enum"`);
        await queryRunner.query(`DROP TYPE "system"."social_networks_code_enum"`);

        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('SNWCRE', 'SNWUPD', 'SNWDEL')
        `);
        for (const permission of permissions) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permission.id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code IN ('SNWCRE', 'SNWUPD', 'SNWDEL')
        `);
    }

}
