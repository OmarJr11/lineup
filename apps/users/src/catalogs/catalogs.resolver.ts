import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { CatalogSchema, PaginatedCatalogs } from '../../../../core/schemas';
import { toCatalogSchema } from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { CatalogsService } from '../../../../core/modules/catalogs/catalogs.service';

/**
 * Resolver for catalog queries in the users context.
 * Provides read-only access to business catalogs with infinite scroll support.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => CatalogSchema)
export class CatalogsResolver {
  constructor(private readonly catalogsService: CatalogsService) {}

  /**
   * Find a catalog by its ID.
   * @param {number} id - The catalog ID.
   */
  @Query(() => CatalogSchema, { name: 'findOneCatalog' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toCatalogSchema(await this.catalogsService.findOne(id));
  }

  /**
   * Get catalogs of a business by its ID with infinite scroll pagination.
   * @param {number} idBusiness - The business ID.
   * @param {InfinityScrollInput} pagination - Pagination parameters (page, limit, order, orderBy).
   */
  @Query(() => PaginatedCatalogs, { name: 'findCatalogsByBusinessId' })
  async findCatalogsByBusinessId(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.catalogsService.findAllByBusinessId(idBusiness, pagination)
    ).map((catalog) => toCatalogSchema(catalog));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit ?? 10,
    };
  }
}
