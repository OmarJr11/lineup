import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { Permissions, Response } from '../../../../core/common/decorators';
import { AdminPermissionsEnum } from '../../../../core/common/enums';
import { userResponses } from '../../../../core/common/responses';
import { AdminStatisticsGettersService } from '../../../../core/modules/admin-statistics/admin-statistics-getters.service';
import {
    ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS,
    AdminDiscountGlobalQueryInput,
    TimePeriodInput,
} from '../../../../core/modules/admin-statistics/dto';
import {
    AdminBusinessStatsSchema,
    AdminCatalogGlobalStatsSchema,
    AdminDiscountGlobalStatsSchema,
    AdminPlatformEngagementStatsSchema,
    AdminStatisticsRootSchema,
    AdminUserStatsSchema,
} from '../../../../core/schemas';

/**
 * GraphQL resolver for admin platform statistics (multiple root queries).
 */
@UsePipes(new ValidationPipe())
@Resolver(() => AdminStatisticsRootSchema)
export class AdminStatisticsResolver {
    constructor(
        private readonly adminStatisticsGettersService: AdminStatisticsGettersService,
    ) {}

    /**
     * Platform-wide user metrics (totals, by status, optional new registrations series).
     */
    @Query(() => AdminUserStatsSchema, { name: 'adminUserStats' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(AdminPermissionsEnum.STATS)
    @Response(userResponses.list)
    async adminUserStats(
        @Args('timePeriod', { nullable: true }) timePeriod?: TimePeriodInput,
    ): Promise<AdminUserStatsSchema> {
        return await this.adminStatisticsGettersService.getUserStats(timePeriod);
    }

    /**
     * Platform-wide business metrics (totals, online count, by status, optional new registrations).
     */
    @Query(() => AdminBusinessStatsSchema, { name: 'adminBusinessStats' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(AdminPermissionsEnum.STATS)
    @Response(userResponses.list)
    async adminBusinessStats(
        @Args('timePeriod', { nullable: true }) timePeriod?: TimePeriodInput,
    ): Promise<AdminBusinessStatsSchema> {
        return await this.adminStatisticsGettersService.getBusinessStats(timePeriod);
    }

    /**
     * Aggregated business, product, and catalog visit counts for the whole platform.
     */
    @Query(() => AdminPlatformEngagementStatsSchema, { name: 'adminPlatformEngagementStats' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(AdminPermissionsEnum.STATS)
    @Response(userResponses.list)
    async adminPlatformEngagementStats(
        @Args('timePeriod', { nullable: true }) timePeriod?: TimePeriodInput,
    ): Promise<AdminPlatformEngagementStatsSchema> {
        return await this.adminStatisticsGettersService.getPlatformEngagementStats(timePeriod);
    }

    /**
     * Totals for products, SKUs, and products without defined stock across the platform.
     */
    @Query(() => AdminCatalogGlobalStatsSchema, { name: 'adminCatalogGlobalStats' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(AdminPermissionsEnum.STATS)
    @Response(userResponses.list)
    async adminCatalogGlobalStats(): Promise<AdminCatalogGlobalStatsSchema> {
        return await this.adminStatisticsGettersService.getCatalogGlobalStats();
    }

    /**
     * Discounts grouped by lifecycle bucket and type, plus expiring-soon count.
     */
    @Query(() => AdminDiscountGlobalStatsSchema, { name: 'adminDiscountGlobalStats' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(AdminPermissionsEnum.STATS)
    @Response(userResponses.list)
    async adminDiscountGlobalStats(
        @Args('query', { type: () => AdminDiscountGlobalQueryInput, nullable: true })
        query?: AdminDiscountGlobalQueryInput,
    ): Promise<AdminDiscountGlobalStatsSchema> {
        const days = query?.days ?? ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS;
        return await this.adminStatisticsGettersService.getDiscountGlobalStats(days);
    }
}
