import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityCurrencies1770419199392 implements MigrationInterface {
    name = 'CreateEntityCurrencies1770419199392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."currencies_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "currencies" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(10) NOT NULL, "id_creation_user" bigint NOT NULL, "status" "public"."currencies_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "UQ_9f8d0972aeeb5a2277e40332d29" UNIQUE ("code"), CONSTRAINT "PK_d528c54860c4182db13548e08c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "currencies" ADD CONSTRAINT "FK_66b8b2d3a683ccf4d0ea78642bc" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD "id_currency" bigint`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_4a098b475800a5c8586a173acc4" FOREIGN KEY ("id_currency") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "subtitle" DROP NOT NULL`);

        // Insert default currencies (id_creation_user = 1 corresponds to the system admin)
        await queryRunner.query(`
            INSERT INTO "currencies" (name, code, id_creation_user)
            VALUES
                ('Dolares', 'USD', 1),
                ('Bolivares', 'BS', 1),
                ('Euros', 'EUR', 1)
        `);

        // Assign USD to all existing products that have price but no id_currency
        await queryRunner.query(`
            UPDATE "products"
            SET id_currency = (SELECT id FROM "currencies" WHERE code = 'USD' LIMIT 1)
            WHERE id_currency IS NULL AND price IS NOT NULL
        `);

        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "CHK_c63e6a2acc1f1e6484389ed4df" CHECK ((price IS NULL AND id_currency IS NULL) OR (price IS NOT NULL AND id_currency IS NOT NULL))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "CHK_c63e6a2acc1f1e6484389ed4df"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_4a098b475800a5c8586a173acc4"`);
        await queryRunner.query(`ALTER TABLE "currencies" DROP CONSTRAINT "FK_66b8b2d3a683ccf4d0ea78642bc"`);
        await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "subtitle" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "id_currency"`);
        await queryRunner.query(`DROP TABLE "currencies"`);
        await queryRunner.query(`DROP TYPE "public"."currencies_status_enum"`);
    }

}
