import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { ProductReactionsService } from '../../../../core/modules/product-reactions/product-reactions.service';
import { ProductReactionsGettersService } from '../../../../core/modules/product-reactions/product-reactions-getters.service';
import {
  PaginatedProducts,
  ProductReactionSchema,
  ProductSchema,
  TagSchema,
} from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { ReactionTypeEnum, StatusEnum } from '../../../../core/common/enums';
import {
  toProductReactionSchema,
  toProductSchema,
  toTagSchema,
} from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { ProductsService } from '../../../../core/modules/products/products.service';
import { TagsService } from '../../../../core/modules/tags/tags.service';

@UsePipes(new ValidationPipe())
@Resolver(() => ProductReactionSchema)
export class ProductsResolver {
  constructor(
    private readonly productReactionsService: ProductReactionsService,
    private readonly productReactionsGettersService: ProductReactionsGettersService,
    private readonly productsService: ProductsService,
    private readonly tagsService: TagsService,
  ) {}

  /**
   * Get all products.
   * @param {InfinityScrollInput} pagination - The pagination input.
   */
  @Query(() => PaginatedProducts, { name: 'findAllProducts' })
  async findAll(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (await this.productsService.findAll(pagination)).map(
      (product) => toProductSchema(product),
    );
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get all products by catalog.
   * @param {number} idCatalog - The ID of the catalog.
   * @param {string} search - The search query.
   */
  @Query(() => [ProductSchema], { name: 'getAllByCatalog' })
  async getAllByCatalog(
    @Args('idCatalog', { type: () => Int }) idCatalog: number,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ) {
    const items = await this.productsService.findAllByCatalog(
      idCatalog,
      search,
    );
    return items.map((product) => toProductSchema(product));
  }

  /**
   * Get all products by catalog with pagination.
   * @param {number} idCatalog - The ID of the catalog.
   * @param {InfinityScrollInput} pagination - The pagination input.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByCatalogPaginated' })
  async getAllByCatalogPaginated(
    @Args('idCatalog', { type: () => Int }) idCatalog: number,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.getAllByCatalogPaginated(idCatalog, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get all products by business with pagination.
   * @param {number} idBusiness - The ID of the business.
   * @param {InfinityScrollInput} pagination - The pagination input.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByBusiness' })
  async getAllByBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.findAllByBusiness(idBusiness, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get all primary products by business.
   * @param {number} idBusiness - The ID of the business.
   * @returns {Promise<ProductSchema[]>} Array of primary products.
   */
  @Query(() => [ProductSchema], { name: 'getAllPrimaryProductsByBusiness' })
  async getAllPrimaryProductsByBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
  ): Promise<ProductSchema[]> {
    const products = await this.productsService.findAllByBusinessAndIsPrimary(
      idBusiness,
      true,
    );
    return products.map((product) => toProductSchema(product));
  }

  /**
   * Get products filtered by tag name or slug.
   * @param {string} tagNameOrSlug - Tag name or slug (e.g. "pan" or "pan-artesanal").
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByTag' })
  async getAllByTag(
    @Args('tagNameOrSlug', { type: () => String }) tagNameOrSlug: string,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.findAllByTag(tagNameOrSlug, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get products filtered by multiple tag names or slugs.
   * Returns products that have at least one of the specified tags.
   * @param {string[]} tagNamesOrSlugs - Tag names or slugs (e.g. ["pan", "integral", "sin-gluten"]).
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByTags' })
  async getAllByTags(
    @Args('tagNamesOrSlugs', { type: () => [String] })
    tagNamesOrSlugs: string[],
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.findAllByTags(tagNamesOrSlugs, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  @Query(() => ProductSchema, { name: 'findOneProduct' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toProductSchema(await this.productsService.findOne(id));
  }

  /**
   * Get main tags (tags with the most products).
   * Only counts active, non-deleted products.
   * @param {number} limit - Maximum number of tags to return. Default 20.
   * @returns {Promise<TagSchema[]>} Tags ordered by product count descending.
   */
  @Query(() => [TagSchema], { name: 'getMainTags' })
  async getMainTags(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<TagSchema[]> {
    const tags = await this.tagsService.findMainTags(limit ?? 20);
    return tags.map((tag) => toTagSchema(tag));
  }

  /**
   * Add a like to a product.
   * @param {number} idProduct - The product ID.
   * @param {IUserReq} user - The authenticated user.
   * @returns {Promise<ProductReactionSchema>} The created or updated product reaction.
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => ProductReactionSchema, { name: 'likeProduct' })
  async likeProduct(
    @Args('idProduct', { type: () => Int }) idProduct: number,
    @UserDec() user: IUserReq,
  ): Promise<ProductReactionSchema> {
    const reaction = await this.productReactionsService.likeProduct(
      idProduct,
      user,
    );
    return toProductReactionSchema(reaction);
  }

  /**
   * Remove a like from a product.
   * @param {number} idProduct - The product ID.
   * @param {IUserReq} user - The authenticated user.
   * @returns {Promise<boolean>} True if the like was removed successfully.
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => Boolean, { name: 'unlikeProduct' })
  async unlikeProduct(
    @Args('idProduct', { type: () => Int }) idProduct: number,
    @UserDec() user: IUserReq,
  ): Promise<boolean> {
    return await this.productReactionsService.unlikeProduct(idProduct, user);
  }

  /**
   * Check if the current user has liked a product.
   * @param {number} idProduct - The product ID.
   * @param {IUserReq} user - The authenticated user.
   * @returns {Promise<boolean>} True if the user has liked the product.
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Query(() => Boolean, { name: 'hasLikedProduct' })
  async hasLikedProduct(
    @Args('idProduct', { type: () => Int }) idProduct: number,
    @UserDec() user: IUserReq,
  ): Promise<boolean> {
    const reaction =
      await this.productReactionsGettersService.findOneByProductAndUser(
        idProduct,
        ReactionTypeEnum.LIKE,
        user.userId,
      );
    return reaction !== null && reaction.status !== StatusEnum.DELETED;
  }
}
