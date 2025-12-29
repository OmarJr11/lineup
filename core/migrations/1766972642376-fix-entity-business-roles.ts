import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityBusinessRoles1766972642376 implements MigrationInterface {
    name = 'FixEntityBusinessRoles1766972642376'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) add column as nullable to avoid failures on tables with existing rows
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD "id_business" bigint`);

        // 2) populate the new column using the current creation business (adjust if you prefer another source)
        await queryRunner.query(`UPDATE "system"."business_roles" SET "id_business" = "id_creation_business" WHERE "id_business" IS NULL`);

        // NOTE: If there are duplicate rows that would conflict with the new composite PK (id_role,id_business),
        // this migration will fail when creating the PK. Please clean duplicates before running, or
        // add deduplication logic here intentionally.

        // 3) make column NOT NULL now that it's populated
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ALTER COLUMN "id_business" SET NOT NULL`);

        // 4) replace primary key with composite primary key
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "PK_73f2557c9a0e7bc04d6e6c0cc90"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "PK_85f53f59160618e6d86396aacac" PRIMARY KEY ("id_role", "id_business")`);

        // 5) add foreign key to businesses
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "FK_cac4e8b4b825c9ec56e9bfb866c" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "FK_cac4e8b4b825c9ec56e9bfb866c"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "PK_85f53f59160618e6d86396aacac"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "PK_73f2557c9a0e7bc04d6e6c0cc90" PRIMARY KEY ("id_role")`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP COLUMN "id_business"`);
    }

}
