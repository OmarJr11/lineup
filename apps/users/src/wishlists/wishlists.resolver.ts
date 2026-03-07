import { Resolver, Query, Args } from '@nestjs/graphql';
import { BusinessFollowersGettersService } from '../../../../core/modules/business-followers/business-followers-getters.service';
import { ProductReactionsGettersService } from '../../../../core/modules/product-reactions/product-reactions-getters.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaginatedBusinesses, PaginatedProducts } from '../../../../core/schemas';
import { toBusinessSchema, toProductSchema } from '../../../../core/common/functions';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';

/**
 * Resolver for wishlist queries.
 * Provides read-only access to businesses the user follows and products the user likes.
 */
@UsePipes(new ValidationPipe())
@Resolver()
@UseGuards(JwtAuthGuard, TokenGuard)
export class WishlistsResolver {

  constructor(
    private readonly businessFollowersGettersService: BusinessFollowersGettersService,
    private readonly productReactionsGettersService: ProductReactionsGettersService,
  ) {}

  /**
   * Get businesses that the current user follows with infinite scroll pagination.
   * @param {IUserReq} user - The authenticated user.
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   */
  @Query(() => PaginatedBusinesses, { name: 'findFollowedBusinesses' })
  async findFollowedBusinesses(
    @UserDec() user: IUserReq,
    @Args('pagination', { type: () => InfinityScrollInput })pagination: InfinityScrollInput
  ) {
    const items = (
      await this.businessFollowersGettersService
        .findAllByUserPaginated(user.userId, pagination)
    ).map((business) => toBusinessSchema(business));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit ?? 10,
    };
  }

  /**
   * Get products that the current user has liked with infinite scroll pagination.
   * @param {IUserReq} user - The authenticated user.
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   */
  @Query(() => PaginatedProducts, { name: 'findLikedProducts' })
  async findLikedProducts(
    @UserDec() user: IUserReq,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput
  ) {
    const items = (
      await this.productReactionsGettersService
        .findAllLikedByUserPaginated(user.userId, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit ?? 10,
    };
  }
}
