import { Injectable } from '@nestjs/common';
import {
    IAdminBusinessStats,
    IAdminCatalogGlobalStats,
    IAdminDiscountGlobalStats,
    IAdminLabeledCount,
    IAdminPlatformEngagementStats,
    IAdminTimeSeriesStats,
    IAdminUserStats,
    ITimePeriodFilter,
} from '../../common/interfaces';
import { Discount } from '../../entities';
import { ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS } from './dto/admin-discount-global-query.input';
import { UsersGettersService } from '../users/users.getters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessVisitsGettersService } from '../business-visits/business-visits-getters.service';
import { ProductVisitsGettersService } from '../product-visits/product-visits-getters.service';
import { CatalogVisitsGettersService } from '../catalog-visits/catalog-visits-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductSkusGettersService } from '../product-skus/product-skus-getters.service';
import { DiscountsGettersService } from '../discounts/discounts-getters.service';

/**
 * Platform-wide statistics for the admin application (no single-business scope).
 * Delegates persistence to entity getters services.
 */
@Injectable()
export class AdminStatisticsGettersService {
    constructor(
        private readonly usersGettersService: UsersGettersService,
        private readonly businessesGettersService: BusinessesGettersService,
        private readonly businessVisitsGettersService: BusinessVisitsGettersService,
        private readonly productVisitsGettersService: ProductVisitsGettersService,
        private readonly catalogVisitsGettersService: CatalogVisitsGettersService,
        private readonly productsGettersService: ProductsGettersService,
        private readonly productSkusGettersService: ProductSkusGettersService,
        private readonly discountsGettersService: DiscountsGettersService,
    ) {}

    /**
     * Returns user totals, breakdown by status, and optional new-user series.
     * @param {ITimePeriodFilter} [timePeriod] - When start/end are set, includes new registrations.
     * @returns {Promise<IAdminUserStats>} Aggregated user stats.
     */
    async getUserStats(timePeriod?: ITimePeriodFilter): Promise<IAdminUserStats> {
        const totalUsers = await this.usersGettersService.getNonDeletedUsersCountForAdminStatistics();
        const usersByStatus = await this.usersGettersService.getUsersGroupedByStatusForAdminStatistics();
        let newUsersInPeriod: IAdminTimeSeriesStats | undefined;
        if (timePeriod?.startDate && timePeriod?.endDate) {
            newUsersInPeriod = await this.usersGettersService.getNewUsersStatsForAdminStatistics(
                timePeriod,
            );
        }
        return { totalUsers, usersByStatus, newUsersInPeriod };
    }

    /**
     * Returns business totals, online count, status breakdown, and optional new-business series.
     * @param {ITimePeriodFilter} [timePeriod] - When start/end are set, includes new registrations.
     * @returns {Promise<IAdminBusinessStats>} Aggregated business stats.
     */
    async getBusinessStats(timePeriod?: ITimePeriodFilter): Promise<IAdminBusinessStats> {
        const totalBusinesses = await this.businessesGettersService
            .getNonDeletedBusinessesCountForAdminStatistics();
        const onlineBusinessesCount = await this.businessesGettersService
            .getOnlineNonDeletedBusinessesCountForAdminStatistics();
        const businessesByStatus = await this.businessesGettersService
            .getBusinessesGroupedByStatusForAdminStatistics();
        let newBusinessesInPeriod: IAdminTimeSeriesStats | undefined;
        if (timePeriod?.startDate && timePeriod?.endDate) {
            newBusinessesInPeriod = await this.businessesGettersService
                .getNewBusinessesStatsForAdminStatistics(timePeriod);
        }
        return {
            totalBusinesses,
            onlineBusinessesCount,
            businessesByStatus,
            newBusinessesInPeriod,
        };
    }

    /**
     * Aggregates visit counts across businesses, products, and catalogs.
     * @param {ITimePeriodFilter} [timePeriod] - Optional date range and granularity.
     * @returns {Promise<IAdminPlatformEngagementStats>} Visit aggregates.
     */
    async getPlatformEngagementStats(
        timePeriod?: ITimePeriodFilter,
    ): Promise<IAdminPlatformEngagementStats> {
        const businessVisits = await this.businessVisitsGettersService
            .getGlobalVisitStatsForAdminStatistics(timePeriod);
        const productVisits = await this.productVisitsGettersService
            .getGlobalVisitStatsForAdminStatistics(timePeriod);
        const catalogVisits = await this.catalogVisitsGettersService
            .getGlobalVisitStatsForAdminStatistics(timePeriod);
        return { businessVisits, productVisits, catalogVisits };
    }

    /**
     * Global catalog figures: products, SKUs, and products without usable stock.
     * @returns {Promise<IAdminCatalogGlobalStats>} Catalog aggregates.
     */
    async getCatalogGlobalStats(): Promise<IAdminCatalogGlobalStats> {
        const totalProducts = await this.productsGettersService
            .getNonDeletedProductsCountForAdminStatistics();
        const totalSkus = await this.productSkusGettersService
            .getActiveSkusForNonDeletedProductsCountForAdminStatistics();
        const productsWithoutStock = await this.productsGettersService
            .getGlobalProductsWithoutStockCountForAdminStatistics();
        return { totalProducts, totalSkus, productsWithoutStock };
    }

    /**
     * Global discount breakdowns and expiring-soon count.
     * @param {number} [days] - Horizon in days for expiring soon (default 7).
     * @returns {Promise<IAdminDiscountGlobalStats>} Discount aggregates.
     */
    async getDiscountGlobalStats(
        days: number = ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS,
    ): Promise<IAdminDiscountGlobalStats> {
        const discounts = await this.discountsGettersService.findDiscountDateRangesForAdminStatistics();
        const discountsByStatus = this.bucketDiscountsByLifecycle(discounts);
        const discountsByType = await this.discountsGettersService
            .getGlobalDiscountsByTypeForAdminStatistics();
        const expiringSoonCount = await this.discountsGettersService
            .getGlobalExpiringSoonDiscountCountForAdminStatistics(days);
        return { discountsByStatus, discountsByType, expiringSoonCount };
    }

    /**
     * Builds active / pending / expired buckets from discount dates.
     * @param {Pick<Discount, 'startDate' | 'endDate'>[]} discounts - Discount rows.
     * @returns {IAdminLabeledCount[]} Labeled counts.
     */
    private bucketDiscountsByLifecycle(
        discounts: Pick<Discount, 'startDate' | 'endDate'>[],
    ): IAdminLabeledCount[] {
        const now = new Date();
        const buckets = { active: 0, pending: 0, expired: 0 };
        for (const d of discounts) {
            if (d.endDate < now) { buckets.expired++; }
            else if (d.startDate > now) { buckets.pending++; } 
            else { buckets.active++; }
        }
        return [
            { label: 'active', count: buckets.active },
            { label: 'pending', count: buckets.pending },
            { label: 'expired', count: buckets.expired },
        ];
    }
}
