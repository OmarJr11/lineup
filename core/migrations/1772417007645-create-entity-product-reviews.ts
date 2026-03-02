import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityProductReviews1772417007645 implements MigrationInterface {
    name = 'CreateEntityProductReviews1772417007645'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."product_ratings_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "product_ratings" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "id_product" bigint NOT NULL, "id_creation_user" bigint NOT NULL, "stars" smallint NOT NULL, "comment" text, "status" "public"."product_ratings_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "CHK_4558bcdb0137560cf169e8c69c" CHECK (stars >= 1 AND stars <= 5), CONSTRAINT "PK_f8bd94404fc1d160bdb075dc435" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "system"."users" ADD "image_code" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "rating_average" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "product_search_index" ADD "rating_average" numeric(3,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "system"."users" ADD CONSTRAINT "FK_47ee7274a6f938446f7b6b8cf74" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_ratings" ADD CONSTRAINT "FK_c17c65d6a37a28f4c9ff462c3b0" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_ratings" ADD CONSTRAINT "FK_9da092346bdb7257039f386f299" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // Insert permissions
        await queryRunner.query(`
            INSERT INTO "system"."permissions" (code, description, id_creation_user)
            VALUES
                ('PRODRATCRE', 'Permission to create or update a product rating', 1),
                ('PRODRATLIS', 'Permission to list product ratings', 1)
        `);

        // Assign permissions to the user role (02USERLUP) and admin role (01ADMLUP)
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('PRODRATCRE', 'PRODRATLIS')
        `);
        const roles = await queryRunner.query(`
            SELECT id FROM "system"."roles" WHERE code IN ('02USERLUP', '01ADMLUP')
        `);
        for (const role of roles) {
            for (const p of permissions) {
                await queryRunner.query(`
                    INSERT INTO "system"."role_permissions" ("id_role", "id_permission", "id_creation_user")
                    VALUES (${role.id}, ${p.id}, 1)
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const permissions = await queryRunner.query(`
            SELECT id FROM "system"."permissions"
            WHERE code IN ('PRODRATCRE', 'PRODRATLIS')
        `);
        for (const p of permissions) {
            await queryRunner.query(`
                DELETE FROM "system"."role_permissions" WHERE "id_permission" = ${p.id}
            `);
        }
        await queryRunner.query(`
            DELETE FROM "system"."permissions" WHERE code IN ('PRODRATCRE', 'PRODRATLIS')
        `);
        await queryRunner.query(`ALTER TABLE "product_ratings" DROP CONSTRAINT "FK_9da092346bdb7257039f386f299"`);
        await queryRunner.query(`ALTER TABLE "product_ratings" DROP CONSTRAINT "FK_c17c65d6a37a28f4c9ff462c3b0"`);
        await queryRunner.query(`ALTER TABLE "system"."users" DROP CONSTRAINT "FK_47ee7274a6f938446f7b6b8cf74"`);
        await queryRunner.query(`ALTER TABLE "product_search_index" DROP COLUMN "rating_average"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "rating_average"`);
        await queryRunner.query(`ALTER TABLE "system"."users" DROP COLUMN "image_code"`);
        await queryRunner.query(`DROP TABLE "product_ratings"`);
        await queryRunner.query(`DROP TYPE "public"."product_ratings_status_enum"`);
    }

}
