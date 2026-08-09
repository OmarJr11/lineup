import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { SearchService } from '../../../../core/modules/search/search.service';
import { UserSearchesService } from '../../../../core/modules/user-searches/user-searches.service';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import {
  InfinityScrollInput,
  ProductSearchFiltersInput,
} from '../../../../core/common/dtos';
import { SearchTargetEnum } from '../../../../core/common/enums';
import { PaginatedSearchResults } from '../../../../core/schemas/paginated.schema';
import { FeaturedCollectionsSchema } from '../../../../core/schemas/featured-collections.schema';
import {
  toBusinessSchema,
  toCatalogSchema,
  toProductSchema,
} from '../../../../core/common/functions';
import type { SearchResultItem } from '../../../../core/modules/search/search.service';
import type { Business } from '../../../../core/entities';
import type { Catalog } from '../../../../core/entities';
import type { Product } from '../../../../core/entities';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Resolver for full-text search over businesses, catalogs, and products.
 * Supports both authenticated users and anonymous visitors.
 * Records search terms for logged-in users to build personalized collections.
 */
@UsePipes(new ValidationPipe())
@Resolver()
export class SearchResolver {
  constructor(
    private readonly searchService: SearchService,
    private readonly userSearchesService: UserSearchesService,
  ) {}

  /**
   * Performs full-text search across businesses, catalogs, and/or products.
   * @param pagination - InfinityScrollInput (page, limit, search text)
   * @param target - Search target: ALL, BUSINESSES, CATALOGS, or PRODUCTS
   * @param productFilters - Optional filters for products: minPrice, maxPrice, location, minRating
   * @returns Paginated search results with items (Business | Catalog | Product)
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Query(() => PaginatedSearchResults, { name: 'search' })
  async search(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
    @Args('target', { type: () => SearchTargetEnum }) target: SearchTargetEnum,
    @Args('productFilters', {
      type: () => ProductSearchFiltersInput,
      nullable: true,
    })
    productFilters?: ProductSearchFiltersInput,
    @UserDec() user?: IUserReq | null,
  ): Promise<PaginatedSearchResults> {
    const result = await this.searchService.search(
      pagination,
      target,
      productFilters,
    );
    const searchTerm = (pagination?.search ?? '').trim();
    if (user && searchTerm.length > 0) {
      void this.userSearchesService.recordSearch(searchTerm, user);
    }
    const items = result.items.map(({ item, __typename }: SearchResultItem) => {
      const schema =
        __typename === 'BusinessSchema'
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
   * Returns all featured collections in one request.
   * @param pagination - InfinityScrollInput (page, limit)
   * @returns Object with featured businesses, featured catalogs, featured products and recently added products
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Query(() => FeaturedCollectionsSchema, { name: 'featured' })
  async getFeaturedResults(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
    @UserDec() user?: IUserReq | null,
  ): Promise<FeaturedCollectionsSchema> {
    const [
      featuredBusinesses,
      featuredCatalogs,
      featuredProducts,
      recentlyAddedProducts,
    ] = await Promise.all([
      this.searchService.getFeaturedBusinesses(pagination),
      this.searchService.getFeaturedCatalogs(pagination),
      this.searchService.getFeaturedProducts(pagination, user),
      this.searchService.getRecentlyAddedProducts(pagination, user),
    ]);
    return {
      featuredBusinesses: this.mapFeaturedBusinessesItems(featuredBusinesses),
      featuredCatalogs: this.mapFeaturedCatalogsItems(featuredCatalogs),
      featuredProducts: this.mapFeaturedProductsItems(featuredProducts),
      recentlyAddedProducts: this.mapFeaturedProductsItems(
        recentlyAddedProducts,
      ),
      total: featuredProducts.total,
      page: featuredBusinesses.page,
      limit: featuredBusinesses.limit,
    };
  }

  /**
   * Maps featured business entities to GraphQL business schema.
   * @param result - Paginated business entities
   * @returns Array of business schema items
   */
  private mapFeaturedBusinessesItems(
    result: Awaited<ReturnType<SearchService['getFeaturedBusinesses']>>,
  ): ReturnType<typeof toBusinessSchema>[] {
    return result.items.map((business) => ({
      ...toBusinessSchema(business),
    }));
  }

  /**
   * Maps featured catalog entities to GraphQL catalog schema.
   * @param result - Paginated catalog entities
   * @returns Array of catalog schema items
   */
  private mapFeaturedCatalogsItems(
    result: Awaited<ReturnType<SearchService['getFeaturedCatalogs']>>,
  ): ReturnType<typeof toCatalogSchema>[] {
    return result.items.map((catalog) => ({
      ...toCatalogSchema(catalog),
    }));
  }

  /**
   * Maps featured/recently-added products to GraphQL product schema.
   * @param result - Paginated product entities
   * @returns Array of product schema items
   */
  private mapFeaturedProductsItems(
    result: Awaited<ReturnType<SearchService['getFeaturedProducts']>>,
  ): ReturnType<typeof toProductSchema>[] {
    return result.items.map((product) => ({
      ...toProductSchema(product),
    }));
  }
}
