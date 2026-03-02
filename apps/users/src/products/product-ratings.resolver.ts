import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { Permissions, UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { ProductRatingsPermissionsEnum } from '../../../../core/common/enums';
import { ProductRatingsService } from '../../../../core/modules/product-ratings/product-ratings.service';
import { ProductRatingsGettersService } from '../../../../core/modules/product-ratings/product-ratings-getters.service';
import { ProductRatingSchema } from '../../../../core/schemas';
import { RateProductInput } from '../../../../core/modules/product-ratings/dto/rate-product.input';
import { toProductRatingSchema } from '../../../../core/common/functions';

/**
 * Resolver that exposes product rating operations to authenticated users.
 * Users can submit a 1–5 star rating with an optional comment for any product.
 * Submitting a rating twice updates the existing one.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => ProductRatingSchema)
export class ProductRatingsResolver {
    constructor(
        private readonly productRatingsService: ProductRatingsService,
        private readonly productRatingsGettersService: ProductRatingsGettersService,
    ) {}

    /**
     * Rate a product with a star score (1–5) and an optional comment.
     * If the user has already rated the product, the existing rating is updated.
     * @param {RateProductInput} input - The rating data.
     * @param {IUserReq} user - The authenticated user.
     * @returns {Promise<ProductRatingSchema>} The created or updated rating.
     */
    @Mutation(() => ProductRatingSchema, { name: 'rateProduct' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(ProductRatingsPermissionsEnum.PRODRATCRE)
    async rateProduct(
        @Args('input') input: RateProductInput,
        @UserDec() user: IUserReq,
    ): Promise<ProductRatingSchema> {
        const rating = await this.productRatingsService.rateProduct(input, user);
        return toProductRatingSchema(rating);
    }

    /**
     * Get all ratings for a specific product.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<ProductRatingSchema[]>} List of ratings for the product.
     */
    @Query(() => [ProductRatingSchema], { name: 'productRatings' })
    async productRatings(
        @Args('idProduct', { type: () => Int }) idProduct: number,
    ): Promise<ProductRatingSchema[]> {
        const ratings = await this.productRatingsGettersService.findAllByProduct(idProduct);
        return ratings.map(toProductRatingSchema);
    }

    /**
     * Get the current user's rating for a specific product, if any.
     * @param {number} idProduct - The product ID.
     * @param {IUserReq} user - The authenticated user.
     * @returns {Promise<ProductRatingSchema | null>} The user's rating or null.
     */
    @Query(() => ProductRatingSchema, { name: 'myProductRating', nullable: true })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(ProductRatingsPermissionsEnum.PRODRATLIS)
    async myProductRating(
        @Args('idProduct', { type: () => Int }) idProduct: number,
        @UserDec() user: IUserReq,
    ): Promise<ProductRatingSchema | null> {
        const rating = await this.productRatingsGettersService
            .findOneByProductAndUser(idProduct, user.userId);
        if (!rating) return null;
        return toProductRatingSchema(rating);
    }
}
