import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds optional price column to product_search_index for filtering search by price range.
 */
export class AddPriceToProductSearchIndex1773365635351 implements MigrationInterface {
    name = 'AddPriceToProductSearchIndex1773365635351';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "product_search_index" ADD "price" numeric(10,2)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_search_index" DROP COLUMN "price"`);
    }
}
