import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InfinityScrollInput } from '../../common/dtos';
import { SearchTargetEnum } from '../../common/enums';
import { Business, Catalog, Product } from '../../entities';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';

/**
 * Raw row returned by the search index query.
 * Contains the entity ID, its type, and the relevance rank (ts_rank score).
 */
export interface SearchResultRow {
    id: number;
    type: 'business' | 'catalog' | 'product';
    rank: number;
}

/**
 * Search result item with the full entity and GraphQL typename for union resolution.
 * Used to resolve the SearchResultItem union (BusinessSchema | CatalogSchema | ProductSchema).
 */
export interface SearchResultItem {
    item: Business | Catalog | Product;
    __typename: 'BusinessSchema' | 'CatalogSchema' | 'ProductSchema';
}

/**
 * Full-text search service for businesses, catalogs, and products.
 *
 * Uses PostgreSQL full-text search (tsvector, ts_rank) against the search index tables:
 * - business_search_index
 * - catalog_search_index
 * - product_search_index
 *
 * The search vector in each index is built from the entity's text fields (name, description,
 * tags, etc.). Results are ranked by relevance and can be paginated with infinite scroll.
 *
 * Requires the search index tables to be populated and their search_vector columns
 * updated (via triggers or a sync service).
 */
@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    /** PostgreSQL text search configuration (e.g. 'spanish' for stemming and stop words). */
    private readonly TEXT_SEARCH_CONFIG = 'spanish';

    constructor(
        private readonly dataSource: DataSource,
        private readonly businessesGettersService: BusinessesGettersService,
        private readonly catalogsGettersService: CatalogsGettersService,
        private readonly productsGettersService: ProductsGettersService,
    ) {}

    /**
     * Performs full-text search across businesses, catalogs, and/or products.
     *
     * Validates and normalizes the search term, then delegates to the search index tables.
     * Returns entities ranked by relevance, with pagination metadata for infinite scroll.
     *
     * @param pagination - Pagination and search params: page, limit, search (query text).
     *                    Limit is capped at 50. Search term is trimmed; empty returns no results.
     * @param target - Scope: ALL (all three), BUSINESSES, CATALOGS, or PRODUCTS.
     * @returns Object with items (array of entities + __typename), total count, page, limit.
     *          On error or empty search, returns empty items and total 0.
     */
    async search(
        pagination: InfinityScrollInput,
        target: SearchTargetEnum,
    ): Promise<{ items: SearchResultItem[]; total: number; page: number; limit: number }> {
        const searchTerm = (pagination.search || '').trim();
        const page = pagination.page || 1;
        const limit = Math.min(pagination.limit || 10, 50);
        const offset = (page - 1) * limit;

        if (!searchTerm) {
            return { items: [], total: 0, page, limit };
        }

        try {
            const rows = await this.executeSearchQuery(target, searchTerm, limit, offset);
            const total = await this.executeCountQuery(target, searchTerm);
            const items = await this.fetchEntitiesFromRows(rows);
            return { items, total, page, limit };
        } catch (error) {
            this.logger.warn(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
            return { items: [], total: 0, page, limit };
        }
    }

    /**
     * Executes the full-text search against the search index tables.
     *
     * - For a single target (BUSINESSES, CATALOGS, PRODUCTS): runs one query with LIMIT/OFFSET.
     * - For ALL: runs three queries in parallel, merges results, sorts by ts_rank DESC,
     *   and paginates in memory (slice). Fetches extra rows (limit + offset + 200) per
     *   type to ensure enough merged results for the requested page.
     *
     * Uses plainto_tsquery for user input (handles phrases, multiple words).
     * Joins with main tables to filter out deleted entities. Also filters by related
     * entity status: catalogs exclude when business is deleted; products exclude when
     * product, catalog, or business is deleted.
     *
     * @param target - Which index(es) to query.
     * @param searchTerm - Normalized search text (trimmed, non-empty).
     * @param limit - Page size.
     * @param offset - Number of records to skip.
     * @returns Ordered array of SearchResultRow (id, type, rank) for the current page.
     */
    private async executeSearchQuery(
        target: SearchTargetEnum,
        searchTerm: string,
        limit: number,
        offset: number,
    ): Promise<SearchResultRow[]> {
        const tsQuery = 'plainto_tsquery($1, $2)';
        const config = this.TEXT_SEARCH_CONFIG;
        const allRows: SearchResultRow[] = [];

        const fetchLimit = target === SearchTargetEnum.ALL ? limit + offset + 200 : limit + offset;

        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.BUSINESSES) {
            const rows = await this.dataSource.query<SearchResultRow[]>(
                `SELECT bsi.id_business AS id, 'business' AS type,
                    ts_rank(bsi.search_vector, ${tsQuery}) AS rank
                FROM business_search_index bsi
                INNER JOIN businesses b ON b.id = bsi.id_business
                WHERE bsi.search_vector IS NOT NULL AND bsi.search_vector @@ ${tsQuery}
                    AND b.status <> 'deleted'
                ORDER BY rank DESC
                LIMIT $3`,
                [config, searchTerm, fetchLimit],
            );
            allRows.push(...(Array.isArray(rows) ? rows : []));
        }

        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.CATALOGS) {
            const rows = await this.dataSource.query<SearchResultRow[]>(
                `SELECT csi.id_catalog AS id, 'catalog' AS type,
                    ts_rank(csi.search_vector, ${tsQuery}) AS rank
                FROM catalog_search_index csi
                INNER JOIN catalogs c ON c.id = csi.id_catalog AND c.status <> 'deleted'
                INNER JOIN businesses b ON b.id = csi.id_business AND b.status <> 'deleted'
                WHERE csi.search_vector IS NOT NULL AND csi.search_vector @@ ${tsQuery}
                ORDER BY rank DESC
                LIMIT $3`,
                [config, searchTerm, fetchLimit],
            );
            allRows.push(...(Array.isArray(rows) ? rows : []));
        }

        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.PRODUCTS) {
            const rows = await this.dataSource.query<SearchResultRow[]>(
                `SELECT psi.id_product AS id, 'product' AS type,
                    ts_rank(psi.search_vector, ${tsQuery}) AS rank
                FROM product_search_index psi
                INNER JOIN products p ON p.id = psi.id_product AND p.status <> 'deleted'
                INNER JOIN catalogs c ON c.id = psi.id_catalog AND c.status <> 'deleted'
                INNER JOIN businesses b ON b.id = psi.id_business AND b.status <> 'deleted'
                WHERE psi.search_vector IS NOT NULL AND psi.search_vector @@ ${tsQuery}
                ORDER BY rank DESC
                LIMIT $3`,
                [config, searchTerm, fetchLimit],
            );
            allRows.push(...(Array.isArray(rows) ? rows : []));
        }

        allRows.sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));
        return allRows.slice(offset, offset + limit);
    }

    /**
     * Counts total matches for the given search term and target.
     *
     * Runs COUNT queries against the relevant search index tables, joining
     * with main tables and related entities to exclude deleted status. For ALL, sums the
     * counts of businesses, catalogs, and products.
     *
     * @param {SearchTargetEnum} target - Which index(es) to count.
     * @param {string} searchTerm - Normalized search text.
     * @returns {Promise<number>} Total number of matching records across the selected scope.
     */
    private async executeCountQuery(target: SearchTargetEnum, searchTerm: string): Promise<number> {
        const tsQuery = 'plainto_tsquery($1, $2)';
        const config = this.TEXT_SEARCH_CONFIG;
        let total = 0;

        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.BUSINESSES) {
            const result = await this.dataSource.query<{ c: number }[]>(
                `SELECT COUNT(*)::int AS c FROM business_search_index bsi
                INNER JOIN businesses b ON b.id = bsi.id_business
                WHERE bsi.search_vector IS NOT NULL AND bsi.search_vector @@ ${tsQuery}
                    AND b.status <> 'deleted'`,
                [config, searchTerm],
            );
            total += result?.[0]?.c ?? 0;
        }
        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.CATALOGS) {
            const result = await this.dataSource.query<{ c: number }[]>(
                `SELECT COUNT(*)::int AS c FROM catalog_search_index csi
                INNER JOIN catalogs c ON c.id = csi.id_catalog AND c.status <> 'deleted'
                INNER JOIN businesses b ON b.id = csi.id_business AND b.status <> 'deleted'
                WHERE csi.search_vector IS NOT NULL AND csi.search_vector @@ ${tsQuery}`,
                [config, searchTerm],
            );
            total += result?.[0]?.c ?? 0;
        }
        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.PRODUCTS) {
            const result = await this.dataSource.query<{ c: number }[]>(
                `SELECT COUNT(*)::int AS c FROM product_search_index psi
                INNER JOIN products p ON p.id = psi.id_product AND p.status <> 'deleted'
                INNER JOIN catalogs c ON c.id = psi.id_catalog AND c.status <> 'deleted'
                INNER JOIN businesses b ON b.id = psi.id_business AND b.status <> 'deleted'
                WHERE psi.search_vector IS NOT NULL AND psi.search_vector @@ ${tsQuery}`,
                [config, searchTerm],
            );
            total += result?.[0]?.c ?? 0;
        }
        return total;
    }

    /**
     * Fetches full entities from the main tables based on search result rows.
     *
     * Groups rows by type (business, catalog, product), fetches entities in parallel
     * via the corresponding getter services, and reconstructs the result list in the
     * original order with __typename for GraphQL union resolution. Skips entities
     * that are no longer found (e.g. soft-deleted).
     *
     * @param {SearchResultRow[]} rows - Ordered search result rows (id, type, rank).
     * @returns Array of SearchResultItem (entity + __typename) in the same order as rows.
     */
    private async fetchEntitiesFromRows(rows: SearchResultRow[]): Promise<SearchResultItem[]> {
        const items: SearchResultItem[] = [];
        const businessIds = rows.filter((r) => r.type === 'business').map((r) => r.id);
        const catalogIds = rows.filter((r) => r.type === 'catalog').map((r) => r.id);
        const productIds = rows.filter((r) => r.type === 'product').map((r) => r.id);

        const [businesses, catalogs, products] = await Promise.all([
            businessIds.length > 0 ? this.fetchBusinessesByIds(businessIds) : Promise.resolve(new Map<number, Business>()),
            catalogIds.length > 0 ? this.fetchCatalogsByIds(catalogIds) : Promise.resolve(new Map<number, Catalog>()),
            productIds.length > 0 ? this.fetchProductsByIds(productIds) : Promise.resolve(new Map<number, Product>()),
        ]);

        for (const row of rows) {
            if (row.type === 'business') {
                const entity = businesses.get(row.id);
                if (entity) items.push({ item: entity, __typename: 'BusinessSchema' });
            } else if (row.type === 'catalog') {
                const entity = catalogs.get(row.id);
                if (entity) items.push({ item: entity, __typename: 'CatalogSchema' });
            } else if (row.type === 'product') {
                const entity = products.get(row.id);
                if (entity) items.push({ item: entity, __typename: 'ProductSchema' });
            }
        }
        return items;
    }

    /**
     * Fetches businesses by IDs and returns a map for O(1) lookup.
     * Skips IDs that throw (e.g. not found or deleted).
     *
     * @param {number[]} ids - Business IDs to fetch.
     * @returns {Promise<Map<number, Business>>} Map of id -> Business.
     */
    private async fetchBusinessesByIds(ids: number[]): Promise<Map<number, Business>> {
        const map = new Map<number, Business>();
        for (const id of ids) {
            try {
                const b = await this.businessesGettersService.findOne(id);
                map.set(id, b);
            } catch {
                // skip not found
            }
        }
        return map;
    }

    /**
     * Fetches catalogs by IDs and returns a map for O(1) lookup.
     * Skips IDs that throw (e.g. not found or deleted).
     *
     * @param {number[]} ids - Catalog IDs to fetch.
     * @returns {Promise<Map<number, Catalog>>} Map of id -> Catalog.
     */
    private async fetchCatalogsByIds(ids: number[]): Promise<Map<number, Catalog>> {
        const map = new Map<number, Catalog>();
        for (const id of ids) {
            try {
                const c = await this.catalogsGettersService.findOne(id);
                map.set(id, c);
            } catch {
                // skip not found
            }
        }
        return map;
    }

    /**
     * Fetches products by IDs (with relations) and returns a map for O(1) lookup.
     * Skips IDs that throw (e.g. not found or deleted).
     *
     * @param {number[]} ids - Product IDs to fetch.
     * @returns {Promise<Map<number, Product>>} Map of id -> Product.
     */
    private async fetchProductsByIds(ids: number[]): Promise<Map<number, Product>> {
        const map = new Map<number, Product>();
        for (const id of ids) {
            try {
                const p = await this.productsGettersService.findOneWithRelations(id);
                map.set(id, p);
            } catch {
                // skip not found
            }
        }
        return map;
    }
}
