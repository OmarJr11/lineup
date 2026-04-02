import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { BusinessFollowersService } from '../../../../core/modules/business-followers/business-followers.service';
import { BusinessFollowersGettersService } from '../../../../core/modules/business-followers/business-followers-getters.service';
import {
  BusinessFollowerSchema,
  BusinessSchema,
  PaginatedBusinesses,
} from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, TokenGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { StatusEnum } from '../../../../core/common/enums';
import {
  toBusinessFollowerSchema,
  toBusinessSchema,
} from '../../../../core/common/functions';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { InfinityScrollInput } from '../../../../core/common/dtos';

@UsePipes(new ValidationPipe())
@Resolver(() => BusinessFollowerSchema)
export class BusinessesResolver {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly businessFollowersService: BusinessFollowersService,
    private readonly businessFollowersGettersService: BusinessFollowersGettersService,
  ) {}

  /**
   * Follow a business.
   * @param {number} idBusiness - The business ID.
   * @param {IUserReq} user - The authenticated user.
   * @returns {Promise<BusinessFollowerSchema>} The created or existing business follower.
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => BusinessFollowerSchema, { name: 'followBusiness' })
  async followBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
    @UserDec() user: IUserReq,
  ): Promise<BusinessFollowerSchema> {
    const follower = await this.businessFollowersService.followBusiness(
      idBusiness,
      user,
    );
    return toBusinessFollowerSchema(follower);
  }

  /**
   * Unfollow a business.
   * @param {number} idBusiness - The business ID.
   * @param {IUserReq} user - The authenticated user.
   * @returns {Promise<boolean>} True if the unfollow was successful.
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Mutation(() => Boolean, { name: 'unfollowBusiness' })
  async unfollowBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
    @UserDec() user: IUserReq,
  ): Promise<boolean> {
    return await this.businessFollowersService.unfollowBusiness(
      idBusiness,
      user,
    );
  }

  @Query(() => BusinessSchema, { name: 'findOneBusiness' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toBusinessSchema(await this.businessesService.findOne(id));
  }

  @Query(() => BusinessSchema, { name: 'findBusinessByPath' })
  async findByPath(@Args('path', { type: () => String }) path: string) {
    return toBusinessSchema(await this.businessesService.findOneByPath(path));
  }

  @Query(() => PaginatedBusinesses, { name: 'findAllBusinesses' })
  async findAll(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (await this.businessesService.findAll(pagination)).map(
      (business) => toBusinessSchema(business),
    );
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Check if the current user follows a business.
   * @param {number} idBusiness - The business ID.
   * @param {IUserReq} user - The authenticated user.
   * @returns {Promise<boolean>} True if the user follows the business.
   */
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Query(() => Boolean, { name: 'isFollowingBusiness' })
  async isFollowingBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
    @UserDec() user: IUserReq,
  ): Promise<boolean> {
    const follower =
      await this.businessFollowersGettersService.findOneByBusinessAndUser(
        idBusiness,
        user.userId,
      );
    return follower !== null && follower.status !== StatusEnum.DELETED;
  }
}
