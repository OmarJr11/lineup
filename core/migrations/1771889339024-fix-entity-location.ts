import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityLocation1771889339024 implements MigrationInterface {
    name = 'FixEntityLocation1771889339024'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "address_components"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "google_maps_url"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "lat" numeric(10,7) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "lng" numeric(10,7) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "formatted_address" text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "formatted_address"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "lng"`);
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "lat"`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "google_maps_url" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "locations" ADD "address_components" text`);
    }

}
