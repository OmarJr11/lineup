import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { ProductReactionsService } from '../../../../core/modules/product-reactions/product-reactions.service';
import { ProductReactionsGettersService } from '../../../../core/modules/product-reactions/product-reactions-getters.service';
import { PaginatedProducts, ProductReactionSchema, ProductSchema } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { ReactionTypeEnum, StatusEnum } from '../../../../core/common/enums';
import { toProductReactionSchema, toProductSchema } from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { ProductsService } from '../../../../core/modules/products/products.service';

@UsePipes(new ValidationPipe())
@Resolver(() => ProductReactionSchema)
export class ProductsResolver {
    constructor(
        private readonly productReactionsService: ProductReactionsService,
        private readonly productReactionsGettersService: ProductReactionsGettersService,
        private readonly productsService: ProductsService
    ) {}

    
    @Query(() => PaginatedProducts, { name: 'findAllProducts' })
    async findAll(
      @Args('pagination', { type: () => InfinityScrollInput })
      pagination: InfinityScrollInput
    ) {
      const items = (await this.productsService.findAll(pagination))
        .map(product => toProductSchema(product));
      return {
        items,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit
      };
    }

    @Query(() => PaginatedProducts, { name: 'getAllByCatalog' })
    async getAllByCatalog(
      @Args('idCatalog', { type: () => Int }) idCatalog: number,
      @Args('pagination', { type: () => InfinityScrollInput })
      pagination: InfinityScrollInput
    ) {
      const items = (await this.productsService.findAllByCatalog(idCatalog, pagination))
        .map(product => toProductSchema(product));
      return {
        items,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit
      };
    }

    @Query(() => PaginatedProducts, { name: 'getAllByBusiness' })
    async getAllByBusiness(
      @Args('idBusiness', { type: () => Int }) idBusiness: number,
      @Args('pagination', { type: () => InfinityScrollInput })
      pagination: InfinityScrollInput
    ) {
      const items = (await this.productsService.findAllByBusiness(idBusiness, pagination))
        .map(product => toProductSchema(product));
      return {
        items,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit
      };
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
      pagination: InfinityScrollInput
    ) {
      const items = (await this.productsService.findAllByTag(tagNameOrSlug, pagination))
        .map(product => toProductSchema(product));
      return {
        items,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit
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
      @Args('tagNamesOrSlugs', { type: () => [String] }) tagNamesOrSlugs: string[],
      @Args('pagination', { type: () => InfinityScrollInput })
      pagination: InfinityScrollInput
    ) {
      const items = (await this.productsService.findAllByTags(tagNamesOrSlugs, pagination))
        .map(product => toProductSchema(product));
      return {
        items,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit
      };
    }

    @Query(() => ProductSchema, { name: 'findOneProduct' })
    async findOne(@Args('id', { type: () => Int }) id: number) {
      return toProductSchema(await this.productsService.findOne(id));
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
        const reaction = await this.productReactionsService.likeProduct(idProduct, user);
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
        const reaction = await this.productReactionsGettersService
            .findOneByProductAndUser(idProduct, ReactionTypeEnum.LIKE, user.userId);
        return reaction !== null && reaction.status !== StatusEnum.DELETED;
    }
}
