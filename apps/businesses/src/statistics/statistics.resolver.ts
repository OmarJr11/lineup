import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  JwtAuthGuard,
  TokenGuard,
  PermissionsGuard,
} from '../../../../core/common/guards';
import {
  BusinessDec,
  Permissions,
  Response,
} from '../../../../core/common/decorators';
import { businessesResponses } from '../../../../core/common/responses';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { BusinessesPermissionsEnum } from '../../../../core/common/enums';
import { BusinessStatisticsGettersService } from '../../../../core/modules/business-statistics/business-statistics-getters.service';
import { TimePeriodInput } from '../../../../core/modules/business-statistics/dto/time-period.input';
import {
  EngagementStatsSchema,
  ProductStatsSchema,
  CatalogStatsSchema,
  DiscountStatsSchema,
  InventoryStatsSchema,
  StatisticsRootSchema,
} from '../../../../core/schemas';

/**
 * GraphQL resolver for business dashboard statistics.
 * All queries require authentication and BURLISOWN permission.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => StatisticsRootSchema)
export class StatisticsResolver {
  constructor(
    private readonly businessStatisticsGettersService: BusinessStatisticsGettersService,
  ) {}

  @Query(() => EngagementStatsSchema, { name: 'businessEngagementStats' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISOWN)
  @Response(businessesResponses.list)
  async businessEngagementStats(
    @BusinessDec() businessReq: IBusinessReq,
    @Args('timePeriod') timePeriod: TimePeriodInput,
  ) {
    return await this.businessStatisticsGettersService.getEngagementStats(
      businessReq.businessId,
      timePeriod,
    );
  }

  @Query(() => ProductStatsSchema, { name: 'productStats' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISOWN)
  @Response(businessesResponses.list)
  async productStats(
    @BusinessDec() businessReq: IBusinessReq,
    @Args('timePeriod') timePeriod: TimePeriodInput,
  ) {
    return await this.businessStatisticsGettersService.getProductStats(
      businessReq.businessId,
      timePeriod,
    );
  }

  @Query(() => CatalogStatsSchema, { name: 'catalogStats' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISOWN)
  @Response(businessesResponses.list)
  async catalogStats(
    @BusinessDec() businessReq: IBusinessReq,
    @Args('timePeriod') timePeriod: TimePeriodInput,
  ) {
    return await this.businessStatisticsGettersService.getCatalogStats(
      businessReq.businessId,
      timePeriod,
    );
  }

  @Query(() => DiscountStatsSchema, { name: 'discountStats' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISOWN)
  @Response(businessesResponses.list)
  async discountStats(
    @BusinessDec() businessReq: IBusinessReq,
    @Args('timePeriod') timePeriod: TimePeriodInput,
  ) {
    return await this.businessStatisticsGettersService.getDiscountStats(
      businessReq.businessId,
      timePeriod,
    );
  }

  @Query(() => InventoryStatsSchema, { name: 'inventoryStats' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISOWN)
  @Response(businessesResponses.list)
  async inventoryStats(
    @BusinessDec() businessReq: IBusinessReq,
    @Args('timePeriod') timePeriod: TimePeriodInput,
    @Args('threshold', { type: () => Int, nullable: true }) threshold?: number,
  ) {
    return await this.businessStatisticsGettersService.getInventoryStats(
      businessReq.businessId,
      timePeriod,
      threshold,
    );
  }
}
