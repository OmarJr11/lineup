import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SearchService } from '../../../../core/modules/search/search.service';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { SearchTargetEnum } from '../../../../core/common/enums';
import { PaginatedSearchResults, PaginatedBusinesses, PaginatedCatalogs, PaginatedProducts } from '../../../../core/schemas';
import { toBusinessSchema, toCatalogSchema, toProductSchema } from '../../../../core/common/functions';
import type { SearchResultItem } from '../../../../core/modules/search/search.service';
import type { Business } from '../../../../core/entities';
import type { Catalog } from '../../../../core/entities';
import type { Product } from '../../../../core/entities';

/**
 * Resolver for full-text search over businesses, catalogs, and products.
 * Supports both authenticated users and anonymous visitors.
 */
@UsePipes(new ValidationPipe())
@Resolver()
export class SearchResolver {
    constructor(private readonly searchService: SearchService) {}

    /**
     * Performs full-text search across businesses, catalogs, and/or products.
     * @param pagination - InfinityScrollInput (page, limit, search text)
     * @param target - Search target: ALL, BUSINESSES, CATALOGS, or PRODUCTS
     * @returns Paginated search results with items (Business | Catalog | Product)
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Query(() => PaginatedSearchResults, { name: 'search' })
    async search(
        @Args('pagination', { type: () => InfinityScrollInput }) pagination: InfinityScrollInput,
        @Args('target', { type: () => SearchTargetEnum }) target: SearchTargetEnum,
    ): Promise<PaginatedSearchResults> {
        const result = await this.searchService.search(pagination, target);
        const items = result.items.map(({ item, __typename }: SearchResultItem) => {
            const schema = __typename === 'BusinessSchema'
                ? toBusinessSchema(item as Business)
                : __typename === 'CatalogSchema'
                    ? toCatalogSchema(item as Catalog)
                    : toProductSchema(item as Product);
            return { ...schema, __typename };
        });
        return {
            items,
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    /**
     * Returns featured businesses ordered by score (followers×3 + visits + catalogVisits + productVisits + productLikes×2).
     * @param pagination - InfinityScrollInput (page, limit)
     * @returns Paginated businesses sorted by score descending
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Query(() => PaginatedBusinesses, { name: 'featuredBusinesses' })
    async featuredBusinesses(
        @Args('pagination', { type: () => InfinityScrollInput }) pagination: InfinityScrollInput,
    ): Promise<PaginatedBusinesses> {
        const result = await this.searchService.getFeaturedBusinesses(pagination);
        const items = result.items.map((b) => toBusinessSchema(b));
        return {
            items,
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    /**
     * Returns featured catalogs ordered by score (visits×3 + productLikesTotal×2 + productVisitsTotal×1).
     * @param pagination - InfinityScrollInput (page, limit)
     * @returns Paginated catalogs sorted by score descending
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Query(() => PaginatedCatalogs, { name: 'featuredCatalogs' })
    async featuredCatalogs(
        @Args('pagination', { type: () => InfinityScrollInput }) pagination: InfinityScrollInput,
    ): Promise<PaginatedCatalogs> {
        const result = await this.searchService.getFeaturedCatalogs(pagination);
        const items = result.items.map((c) => toCatalogSchema(c));
        return {
            items,
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    /**
     * Returns featured products ordered by score (likes×2 + visits×1).
     * @param pagination - InfinityScrollInput (page, limit)
     * @returns Paginated products sorted by score descending
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Query(() => PaginatedProducts, { name: 'featuredProducts' })
    async featuredProducts(
        @Args('pagination', { type: () => InfinityScrollInput }) pagination: InfinityScrollInput,
    ): Promise<PaginatedProducts> {
        const result = await this.searchService.getFeaturedProducts(pagination);
        const items = result.items.map((p) => toProductSchema(p));
        return {
            items,
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }
}
