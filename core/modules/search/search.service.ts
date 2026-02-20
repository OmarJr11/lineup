import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InfinityScrollInput } from '../../common/dtos';
import { IPaginatedResult } from '../../common/interfaces';
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
    ): Promise<IPaginatedResult<SearchResultItem>> {
        const searchTerm = (pagination.search || '').trim();
        const page = pagination.page || 1;
        const limit = Math.min(pagination.limit || 10, 50);
        const offset = (page - 1) * limit;

        if (!searchTerm) {
            return this.fetchRandomItems(target, limit, offset, page);
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
     * Fetches featured businesses ordered by a calculated score.
     * Score formula: followers × 3 + visits × 1 + catalogVisitsTotal × 1 + productVisitsTotal × 1 + productLikesTotal × 2.
     * Results are ordered descending by score.
     *
     * @param pagination - InfinityScrollInput (page, limit).
     * @returns Object with items (Business[]), total count, page, limit.
     */
    async getFeaturedBusinesses(
        pagination: InfinityScrollInput,
    ): Promise<IPaginatedResult<Business>> {
        const page = Number(pagination.page) || 1;
        const limit = Number(pagination.limit) || 10;
        const offset = (page - 1) * limit;
        try {
            const rows = await this.dataSource.query<{ id: number }[]>(
                `SELECT bsi.id_business AS id
                FROM business_search_index bsi
                INNER JOIN businesses b ON b.id = bsi.id_business
                WHERE b.status <> 'deleted'
                ORDER BY (bsi.followers * 3 + bsi.visits + bsi.catalog_visits_total
                    + bsi.product_visits_total + bsi.product_likes_total * 2) DESC
                LIMIT $1 OFFSET $2`,
                [limit, offset],
            );
            const totalResult = await this.dataSource.query<{ total: number }[]>(
                `SELECT COUNT(*)::int AS total
                FROM business_search_index bsi
                INNER JOIN businesses b ON b.id = bsi.id_business
                WHERE b.status <> 'deleted'`,
            );
            const total = totalResult?.[0]?.total ?? 0;
            const ids = Array.isArray(rows) ? rows.map((r) => r.id) : [];
            const businesses = ids.length > 0 ? await this.fetchBusinessesByIds(ids) : new Map<number, Business>();
            const items = ids.map((id) => businesses.get(id)).filter((b): b is Business => b != null);
            return { items, total, page, limit };
        } catch (error) {
            this.logger.warn(
                `Featured businesses fetch failed: ${error instanceof Error ? error.message : String(error)}`,
            );
            return { items: [], total: 0, page, limit };
        }
    }

    /**
     * Fetches random items when search term is empty.
     *
     * @param target - Scope: ALL, BUSINESSES, CATALOGS, or PRODUCTS.
     * @param limit - Page size.
     * @param offset - Number of records to skip.
     * @param page - Current page number.
     * @returns Object with items (random entities + __typename), total count, page, limit.
     */
    private async fetchRandomItems(
        target: SearchTargetEnum,
        limit: number,
        offset: number,
        page: number,
    ): Promise<IPaginatedResult<SearchResultItem>> {
        try {
            const rows = await this.executeRandomQuery(target, limit, offset);
            const total = await this.executeRandomCountQuery(target);
            const items = await this.fetchEntitiesFromRows(rows);
            return { items, total, page, limit };
        } catch (error) {
            this.logger.warn(`Random fetch failed: ${error instanceof Error ? error.message : String(error)}`);
            return { items: [], total: 0, page, limit };
        }
    }

    /**
     * Executes random query against businesses, catalogs, and/or products.
     *
     * @param target - Which entities to query.
     * @param limit - Page size.
     * @param offset - Number of records to skip.
     * @returns Ordered array of SearchResultRow (id, type) in random order.
     */
    private async executeRandomQuery(
        target: SearchTargetEnum,
        limit: number,
        offset: number,
    ): Promise<SearchResultRow[]> {
        const parts: string[] = [];
        const params: unknown[] = [];

        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.BUSINESSES) {
            parts.push(`(SELECT id, 'business' AS type, 0::float AS rank FROM businesses WHERE status <> 'deleted')`);
        }
        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.CATALOGS) {
            parts.push(`(SELECT c.id, 'catalog' AS type, 0::float AS rank FROM catalogs c
                INNER JOIN businesses b ON b.id = c.id_creation_business AND b.status <> 'deleted'
                WHERE c.status <> 'deleted')`);
        }
        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.PRODUCTS) {
            parts.push(`(SELECT p.id, 'product' AS type, 0::float AS rank FROM products p
                INNER JOIN catalogs c ON c.id = p.id_catalog AND c.status <> 'deleted'
                INNER JOIN businesses b ON b.id = p.id_creation_business AND b.status <> 'deleted'
                WHERE p.status <> 'deleted')`);
        }

        if (parts.length === 0) {
            return [];
        }

        const sql = `SELECT * FROM (${parts.join(' UNION ALL ')}) AS combined ORDER BY RANDOM() LIMIT $1 OFFSET $2`;
        const rows = await this.dataSource.query<SearchResultRow[]>(sql, [limit, offset]);
        return Array.isArray(rows) ? rows : [];
    }

    /**
     * Counts total records for random fetch (businesses + catalogs + products).
     *
     * @param target - Which entities to count.
     * @returns Total number of records across the selected scope.
     */
    private async executeRandomCountQuery(target: SearchTargetEnum): Promise<number> {
        const parts: string[] = [];

        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.BUSINESSES) {
            parts.push(`(SELECT COUNT(*)::int FROM businesses WHERE status <> 'deleted')`);
        }
        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.CATALOGS) {
            parts.push(`(SELECT COUNT(*)::int FROM catalogs c
                INNER JOIN businesses b ON b.id = c.id_creation_business AND b.status <> 'deleted'
                WHERE c.status <> 'deleted')`);
        }
        if (target === SearchTargetEnum.ALL || target === SearchTargetEnum.PRODUCTS) {
            parts.push(`(SELECT COUNT(*)::int FROM products p
                INNER JOIN catalogs c ON c.id = p.id_catalog AND c.status <> 'deleted'
                INNER JOIN businesses b ON b.id = p.id_creation_business AND b.status <> 'deleted'
                WHERE p.status <> 'deleted')`);
        }

        if (parts.length === 0) {
            return 0;
        }

        const sql = `SELECT (${parts.join(' + ')}) AS total`;
        const result = await this.dataSource.query<{ total: number }[]>(sql);
        return result?.[0]?.total ?? 0;
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
        const businesses = await this.businessesGettersService.findByIds(ids);
        return new Map(businesses.map((b) => [b.id, b]));
    }

    /**
     * Fetches catalogs by IDs and returns a map for O(1) lookup.
     * Skips IDs that throw (e.g. not found or deleted).
     *
     * @param {number[]} ids - Catalog IDs to fetch.
     * @returns {Promise<Map<number, Catalog>>} Map of id -> Catalog.
     */
    private async fetchCatalogsByIds(ids: number[]): Promise<Map<number, Catalog>> {
        const catalogs = await this.catalogsGettersService.findByIds(ids);
        return new Map(catalogs.map((c) => [c.id, c]));
    }

    /**
     * Fetches products by IDs (with relations) and returns a map for O(1) lookup.
     * Skips IDs that throw (e.g. not found or deleted).
     *
     * @param {number[]} ids - Product IDs to fetch.
     * @returns {Promise<Map<number, Product>>} Map of id -> Product.
     */
    private async fetchProductsByIds(ids: number[]): Promise<Map<number, Product>> {
        const products = await this.productsGettersService.findManyWithRelations(ids);
        return new Map(products.map((p) => [p.id, p]));
    }
}
