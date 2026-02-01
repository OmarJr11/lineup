import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPathToTheCategories1769972252921 implements MigrationInterface {
    name = 'AddPathToTheCategories1769972252921'

    /**
     * Generate a URL-friendly path from a catalog title.
     * - lowercases
     * - removes diacritics (accents)
     * - replaces any non-alphanumeric sequence with a single hyphen
     * - trims leading/trailing hyphens
     * @param {string} title - The catalog title
     * @returns {string} The generated path
     */
    private generatePathFromTitle(title: string): string {
        return title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .replace(/-+/g, '-');
    }

    /**
     * Check if a catalog path exists and generate a unique path if it does.
     * @param {QueryRunner} queryRunner - The query runner instance
     * @param {string} path - The initial catalog path to check
     * @param {number} [excludeId] - Optional catalog ID to exclude from the check
     * @returns {Promise<string>} A unique catalog path
     */
    private async checkCatalogPathExists(
        queryRunner: QueryRunner,
        path: string,
        excludeId?: number
    ): Promise<string> {
        let existingCatalog = await queryRunner.manager.query(
            `SELECT id FROM "catalogs" WHERE "path" = $1 AND ($2::bigint IS NULL OR id != $2) LIMIT 1`,
            [path, excludeId || null]
        );

        if (existingCatalog.length > 0) {
            let index = '01';
            let finalPath = `${path}-${index}`;
            
            while (existingCatalog.length > 0) {
                existingCatalog = await queryRunner.manager.query(
                    `SELECT id FROM "catalogs" WHERE "path" = $1 AND ($2::bigint IS NULL OR id != $2) LIMIT 1`,
                    [finalPath, excludeId || null]
                );

                if (existingCatalog.length > 0) {
                    const nextIndex = parseInt(index, 10) + 1;
                    index = nextIndex < 10 
                        ? nextIndex.toString().padStart(2, '0')
                        : nextIndex.toString();
                    finalPath = `${path}-${index}`;
                }
            }
            return finalPath;
        }

        return path;
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) Add path column as nullable first
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "path" character varying(255)`);

        // 2) Get all existing catalogs without path
        const catalogs = await queryRunner.manager.query(
            `SELECT id, title FROM "catalogs" WHERE "path" IS NULL ORDER BY id`
        );

        // 3) Generate unique paths for each catalog
        for (const catalog of catalogs) {
            const basePath = this.generatePathFromTitle(catalog.title);
            const uniquePath = await this.checkCatalogPathExists(queryRunner, basePath, catalog.id);
            
            await queryRunner.manager.query(
                `UPDATE "catalogs" SET "path" = $1 WHERE id = $2`,
                [uniquePath, catalog.id]
            );
        }

        // 4) Make path NOT NULL now that all records have paths
        await queryRunner.query(`ALTER TABLE "catalogs" ALTER COLUMN "path" SET NOT NULL`);
        
        // 5) Add unique constraint
        await queryRunner.query(`ALTER TABLE "catalogs" ADD CONSTRAINT "UQ_96264735a474e45d8c02524f768" UNIQUE ("path")`);
        
        // 6) Update title column length
        // Create temporary column to store current title values
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "titleCopy" character varying(255)`);
        await queryRunner.query(`UPDATE "catalogs" SET "titleCopy" = "title"`);
        
        // Handle NULL values in titleCopy (set a default value if needed)
        await queryRunner.query(`UPDATE "catalogs" SET "titleCopy" = 'Untitled Catalog' WHERE "titleCopy" IS NULL`);
        
        // Drop original title column
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "title"`);
        
        // Create new title column as nullable first
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "title" character varying(150)`);
        
        // Copy values from titleCopy to title (truncate if necessary)
        await queryRunner.query(`UPDATE "catalogs" SET "title" = LEFT("titleCopy", 150)`);
        
        // Handle any remaining NULL values (shouldn't happen, but just in case)
        await queryRunner.query(`UPDATE "catalogs" SET "title" = 'Untitled Catalog' WHERE "title" IS NULL`);
        
        // Now make title NOT NULL
        await queryRunner.query(`ALTER TABLE "catalogs" ALTER COLUMN "title" SET NOT NULL`);
        
        // Drop temporary column
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "titleCopy"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "title" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP CONSTRAINT "UQ_96264735a474e45d8c02524f768"`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "path"`);
    }

}
