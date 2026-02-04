import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { ProductReactionsService } from '../../../../core/modules/product-reactions/product-reactions.service';
import { ProductReactionsGettersService } from '../../../../core/modules/product-reactions/product-reactions-getters.service';
import { ProductReactionSchema } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { ReactionTypeEnum, StatusEnum } from '../../../../core/common/enums';
import { toProductReactionSchema } from '../../../../core/common/functions';

@UsePipes(new ValidationPipe())
@Resolver(() => ProductReactionSchema)
@UseGuards(JwtAuthGuard, TokenGuard)
export class ProductsResolver {
    constructor(
        private readonly productReactionsService: ProductReactionsService,
        private readonly productReactionsGettersService: ProductReactionsGettersService,
    ) {}

    /**
     * Add a like to a product.
     * @param {number} idProduct - The product ID.
     * @param {IUserReq} user - The authenticated user.
     * @returns {Promise<ProductReactionSchema>} The created or updated product reaction.
     */
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
