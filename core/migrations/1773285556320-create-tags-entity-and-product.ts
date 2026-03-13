import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTagsEntityAndProduct1773285556320 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasTagsTable = await queryRunner.hasTable("tags");
        if (!hasTagsTable) {
            await queryRunner.query(`
                CREATE TABLE "tags" (
                    "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                    "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                    "creation_ip" character varying(50),
                    "modification_ip" character varying(50),
                    "creation_coordinate" point,
                    "modification_coordinate" point,
                    "id" BIGSERIAL NOT NULL,
                    "name" character varying(100) NOT NULL,
                    "slug" character varying(120) NOT NULL,
                    CONSTRAINT "UQ_tags_name" UNIQUE ("name"),
                    CONSTRAINT "UQ_tags_slug" UNIQUE ("slug"),
                    CONSTRAINT "PK_tags" PRIMARY KEY ("id")
                )
            `);
        }
        const hasProductTagsTable = await queryRunner.hasTable("product_tags");
        if (!hasProductTagsTable) {
            await queryRunner.query(`
                CREATE TABLE "product_tags" (
                    "id_product" bigint NOT NULL,
                    "id_tag" bigint NOT NULL,
                    CONSTRAINT "PK_product_tags" PRIMARY KEY ("id_product", "id_tag")
                )
            `);
            await queryRunner.query(`
                ALTER TABLE "product_tags"
                ADD CONSTRAINT "FK_product_tags_product"
                FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);
            await queryRunner.query(`
                ALTER TABLE "product_tags"
                ADD CONSTRAINT "FK_product_tags_tag"
                FOREIGN KEY ("id_tag") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            `);
        }
        const hasTagsColumn = await queryRunner.query(
            `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'tags'`
        ).then((rows: unknown[]) => rows.length > 0);
        if (!hasTagsColumn) {
            return;
        }
        const products = await queryRunner.query(
            `SELECT id, tags FROM products WHERE tags IS NOT NULL AND tags != ''`
        );
        for (const row of products) {
            const tagNames = (String(row.tags || ''))
                .split(',')
                .map((s) => String(s).trim().toLowerCase())
                .filter((s) => s.length > 0);
            const uniqueNames = [...new Set(tagNames)];
            for (const name of uniqueNames) {
                const slug =
                    name
                        .toLowerCase()
                        .trim()
                        .replace(/\s+/g, '-')
                        .replace(/[^\w\u00C0-\u024F-]+/g, '')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '') || `tag-${row.id}-${name}`;
                await queryRunner.query(
                    `INSERT INTO tags (name, slug, creation_date) VALUES ($1, $2, NOW()) ON CONFLICT (name) DO NOTHING`,
                    [name, slug || `tag-${row.id}`]
                );
                const tagRows = await queryRunner.query(
                    `SELECT id FROM tags WHERE name = $1`,
                    [name]
                );
                if (tagRows.length > 0) {
                    await queryRunner.query(
                        `INSERT INTO product_tags (id_product, id_tag) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [row.id, tagRows[0].id]
                    );
                }
            }
        }
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "tags"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "tags" text NOT NULL DEFAULT ''`);
        const productTags = await queryRunner.query(
            `SELECT pt.id_product, t.name FROM product_tags pt JOIN tags t ON pt.id_tag = t.id ORDER BY pt.id_product`
        );
        const productTagsMap = new Map<number, string[]>();
        for (const row of productTags) {
            const arr = productTagsMap.get(row.id_product) || [];
            arr.push(row.name);
            productTagsMap.set(row.id_product, arr);
        }
        for (const [idProduct, names] of productTagsMap.entries()) {
            await queryRunner.query(
                `UPDATE products SET tags = $1 WHERE id = $2`,
                [names.join(','), idProduct]
            );
        }
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_tag"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_product"`);
        await queryRunner.query(`DROP TABLE "product_tags"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
