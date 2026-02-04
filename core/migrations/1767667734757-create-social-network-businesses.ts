import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialNetworkBusinesses1767667734757 implements MigrationInterface {
    name = 'CreateSocialNetworkBusinesses1767667734757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."social_network_businesses_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "social_network_businesses" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_social_network" bigint NOT NULL, "url" text NOT NULL, "status" "public"."social_network_businesses_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, "modification_business" bigint, CONSTRAINT "PK_9e99b424dc9b533715f6e90323d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_unique_active_social_network_business" ON "social_network_businesses" ("id_creation_business", "id_social_network") WHERE status != 'deleted'`);
        await queryRunner.query(`ALTER TABLE "social_network_businesses" ADD CONSTRAINT "FK_7ebf66f2556e74abedf97bafbe3" FOREIGN KEY ("id_social_network") REFERENCES "system"."social_networks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "social_network_businesses" ADD CONSTRAINT "FK_cc322e8671197cf3a59f32e8053" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "social_network_businesses" ADD CONSTRAINT "FK_0ffb4b5e6968c8761847173cc0a" FOREIGN KEY ("modification_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        //Create permissions
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES 
                ('SNWBUSCRE', 'Permission to create Social Network Businesses', 1),
                ('SNWBUSUPD', 'Permission to update Social Network Businesses', 1),
                ('SNWBUSDEL', 'Permission to delete Social Network Businesses', 1)
        `);

        // Permission codes to add
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('SNWBUSCRE', 'SNWBUSUPD', 'SNWBUSDEL')
        `);

        const business = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code = '05BUSSLUP'
        `);
        const businessRoleId = business[0].id;
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
            await queryRunner.query(`
                INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
                VALUES (${businessRoleId}, ${p.id}, 1)
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "social_network_businesses" DROP CONSTRAINT "FK_0ffb4b5e6968c8761847173cc0a"`);
        await queryRunner.query(`ALTER TABLE "social_network_businesses" DROP CONSTRAINT "FK_cc322e8671197cf3a59f32e8053"`);
        await queryRunner.query(`ALTER TABLE "social_network_businesses" DROP CONSTRAINT "FK_7ebf66f2556e74abedf97bafbe3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_unique_active_social_network_business"`);
        await queryRunner.query(`DROP TABLE "social_network_businesses"`);
        await queryRunner.query(`DROP TYPE "public"."social_network_businesses_status_enum"`);

        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('SNWBUSCRE', 'SNWBUSUPD', 'SNWBUSDEL')
        `);
        for (const permission of permissions) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions"
                WHERE "id_permission" = ${permission.id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions"
            WHERE code IN ('SNWBUSCRE', 'SNWBUSUPD', 'SNWBUSDEL')
        `);
    }

}
