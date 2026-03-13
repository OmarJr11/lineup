import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds locations_text column to product_search_index for filtering by business location.
 * Denormalized from business.locations.formatted_address.
 */
export class AddLocationsTextToProductSearchIndex1773365635353 implements MigrationInterface {
    name = 'AddLocationsTextToProductSearchIndex1773365635353';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product_search_index" ADD "locations_text" text`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_search_index" DROP COLUMN "locations_text"`);
    }
}
