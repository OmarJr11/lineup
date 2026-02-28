import { MigrationInterface, QueryRunner } from "typeorm";

export class AddColumnTotalInCatalogs1771687100223 implements MigrationInterface {
    name = 'AddColumnTotalInCatalogs1771687100223'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "products_count" bigint NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "products_count"`);
    }

}
