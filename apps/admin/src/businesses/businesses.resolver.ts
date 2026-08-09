import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { CreateBusinessInput } from '../../../../core/modules/businesses/dto/create-business.input';
import { UpdateBusinessInput } from '../../../../core/modules/businesses/dto/update-business.input';
import { businessesResponses } from '../../../../core/common/responses';
import {
  BusinessesPermissionsEnum,
  ProvidersEnum,
} from '../../../../core/common/enums';
import { IUserReq } from '../../../../core/common/interfaces';
import {
  Permissions,
  Response,
  UserDec,
} from '../../../../core/common/decorators';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TokenGuard,
} from '../../../../core/common/guards';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { BusinessSchema, PaginatedBusinesses } from '../../../../core/schemas';
import { toBusinessSchema } from '../../../../core/common/functions/businesses.function';

/**
 * Admin resolver for creating, listing, viewing, updating, and removing businesses.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => BusinessSchema)
export class BusinessesResolver {
  constructor(private readonly businessesService: BusinessesService) {}

  /**
   * Lists businesses with pagination (platform-wide).
   */
  @Query(() => PaginatedBusinesses, { name: 'findAllBusinesses' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISALL)
  @Response(businessesResponses.list)
  async findAllBusinesses(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ): Promise<PaginatedBusinesses> {
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
   * Returns a single business by id.
   */
  @Query(() => BusinessSchema, { name: 'findOneBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISALL)
  @Response(businessesResponses.list)
  async findOneBusiness(
    @Args('id', { type: () => Int }) id: number,
  ): Promise<BusinessSchema> {
    const business = await this.businessesService.findOne(id);
    return toBusinessSchema(business);
  }

  /**
   * Updates any business (admin).
   */
  @Mutation(() => BusinessSchema, { name: 'updateBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDALL)
  @Response(businessesResponses.update)
  async updateBusiness(
    @Args('data') data: UpdateBusinessInput,
    @UserDec() admin: IUserReq,
  ): Promise<BusinessSchema> {
    const updated = await this.businessesService.update(data, admin);
    return toBusinessSchema(updated);
  }

  /**
   * Soft-deletes a business by id (admin).
   */
  @Mutation(() => Boolean, { name: 'removeBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURDELALL)
  @Response(businessesResponses.delete)
  async removeBusiness(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() admin: IUserReq,
  ): Promise<boolean> {
    await this.businessesService.remove(id, admin);
    return true;
  }
}
