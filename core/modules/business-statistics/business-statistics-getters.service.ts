import { Injectable, Logger } from '@nestjs/common';
import { TimePeriodInput } from './dto/time-period.input';
import {
  IBusinessVisitsStats,
  ICatalogStats,
  IDiscountStats,
  IEngagementStats,
  IInventoryStats,
  IFrequencyDataPoint,
  IProductStats,
  IStatItemWithLikes,
  IStatItemWithRating,
  IStatItemWithVisits,
  ITimeSeriesStats,
  IVisitToLikeRatio,
  IVisitsByAuthType,
} from './interfaces';
import { StatisticsQueryHelper } from '../../common/helpers/statistics-query.helper';
import { BusinessVisitsGettersService } from '../business-visits/business-visits-getters.service';
import { BusinessFollowersGettersService } from '../business-followers/business-followers-getters.service';
import { ProductVisitsGettersService } from '../product-visits/product-visits-getters.service';
import { CatalogVisitsGettersService } from '../catalog-visits/catalog-visits-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { DiscountsGettersService } from '../discounts/discounts-getters.service';
import { ProductSkusGettersService } from '../product-skus/product-skus-getters.service';
import { StockMovementsGettersService } from '../stock-movements/stock-movements-getters.service';
import { IStockMovementStatItem } from '../stock-movements/interfaces/stock-movement-stat-item.interface';
import { TimePeriodGranularityEnum } from '../../common/enums';
import { ITimePeriodFilter } from '../../common/interfaces';

/** Default limit for top-N queries. */
const DEFAULT_TOP_LIMIT = 10;

/** Default low-stock threshold. */
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Service that provides business dashboard statistics.
 * Delegates data access to the corresponding module getters.
 */
@Injectable()
export class BusinessStatisticsGettersService {
  private readonly logger = new Logger(BusinessStatisticsGettersService.name);

  constructor(
    private readonly businessVisitsGettersService: BusinessVisitsGettersService,
    private readonly businessFollowersGettersService: BusinessFollowersGettersService,
    private readonly productVisitsGettersService: ProductVisitsGettersService,
    private readonly catalogVisitsGettersService: CatalogVisitsGettersService,
    private readonly productsGettersService: ProductsGettersService,
    private readonly catalogsGettersService: CatalogsGettersService,
    private readonly discountsGettersService: DiscountsGettersService,
    private readonly productSkusGettersService: ProductSkusGettersService,
    private readonly stockMovementsGettersService: StockMovementsGettersService,
  ) {}

  /**
   * Get business visits: total or time-series by period.
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<ITimeSeriesStats>} The business visits stats.
   */
  async getBusinessVisits(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<ITimeSeriesStats> {
    const total =
      await this.businessVisitsGettersService.getTimeSeriesByBusiness(
        idBusiness,
        startDate,
        endDate,
      );
    return { total };
  }

  /**
   * Get visits split by anonymous vs identified users.
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<IVisitsByAuthType>} The business visits by auth type.
   */
  async getBusinessVisitsByAuthType(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<IVisitsByAuthType> {
    const { anonymous, identified } =
      await this.businessVisitsGettersService.getCountByAuthType(
        idBusiness,
        startDate,
        endDate,
      );
    return { anonymous, identified };
  }

  /**
   * Get combined business visits stats: total visits and breakdown by auth type.
   * @param {number} idBusiness - The business ID..
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<IBusinessVisitsStats>} The business visits stats.
   */
  async getBusinessVisitsStats(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<IBusinessVisitsStats> {
    const [visits, visitsByAuthType] = await Promise.all([
      this.getBusinessVisits(idBusiness, startDate, endDate),
      this.getBusinessVisitsByAuthType(idBusiness, startDate, endDate),
    ]);
    return { visits, visitsByAuthType };
  }

  /**
   * Resolves dashboard time period to concrete ISO bounds (preset vs RANGE).
   * @param {TimePeriodInput} timePeriod - Client input.
   * @returns {{ startDate: string; endDate: string }} Inclusive range.
   */
  private resolveStatisticsTimeRange(timePeriod: TimePeriodInput): {
    startDate: string;
    endDate: string;
  } {
    const granularity = timePeriod.granularity ?? TimePeriodGranularityEnum.ALL;
    if (granularity !== TimePeriodGranularityEnum.RANGE) {
      return StatisticsQueryHelper.calculateTimePeriodRange(granularity);
    }

    const startDate = new Date(timePeriod.startDate);
    const endDate = new Date(timePeriod.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  /**
   * Get combined engagement stats: visits and new followers.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} timePeriod - Preset granularity or RANGE with explicit bounds.
   * @returns {Promise<IEngagementStats>} The engagement stats.
   */
  async getEngagementStats(
    idBusiness: number,
    timePeriod: TimePeriodInput,
  ): Promise<IEngagementStats> {
    const range = this.resolveStatisticsTimeRange(timePeriod);
    const [visits, newFollowers] = await Promise.all([
      this.getBusinessVisitsStats(idBusiness, range.startDate, range.endDate),
      this.getNewFollowers(idBusiness, range.startDate, range.endDate),
    ]);
    return { visits, newFollowers };
  }

  /**
   * Get new followers count in the given date range.
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<ITimeSeriesStats>} Total new followers in range.
   */
  async getNewFollowers(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<ITimeSeriesStats> {
    const total =
      await this.businessFollowersGettersService.getTimeSeriesForStatistics(
        idBusiness,
        startDate,
        endDate,
      );
    return { total };
  }

  /**
   * Get products by visits (with optional period filter), ordered by visits descending.
   *
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
   * @returns {Promise<IStatItemWithVisits[]>} Products with visit stats.
   */
  async getTopProductsByVisits(
    idBusiness: number,
    timePeriod?: ITimePeriodFilter,
  ): Promise<IStatItemWithVisits[]> {
    const visitData =
      await this.productVisitsGettersService.getTopProductsByVisits(
        idBusiness,
        timePeriod,
      );
    return await this.productsGettersService.getTopByVisitsForStatistics({
      visitData,
      idBusiness,
    });
  }

  /**
   * Get top products by rating (business products only).
   * @param {number} idBusiness - The business ID.
   * @param {number} limit - The limit of the top products.
   * @returns {Promise<IStatItemWithRating[]>} The top products by rating.
   */
  async getTopProductsByRating(
    idBusiness: number,
    limit: number = DEFAULT_TOP_LIMIT,
  ): Promise<IStatItemWithRating[]> {
    return await this.productsGettersService.getTopByRatingForStatistics(
      idBusiness,
      limit,
    );
  }

  /**
   * Get top products by likes (reactions count).
   *
   * @param {number} idBusiness - The business ID.
   * @param {number} limit - The limit of the top products.
   * @returns {Promise<IStatItemWithLikes[]>} The top products by likes.
   */
  async getTopProductsByLikes(
    idBusiness: number,
    limit: number = DEFAULT_TOP_LIMIT,
  ): Promise<IStatItemWithLikes[]> {
    return await this.productsGettersService.getTopByLikesForStatistics(
      idBusiness,
      limit,
    );
  }

  /**
   * Count products with zero visits.
   *
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number>} The count of products with zero visits.
   */
  async getProductsWithoutVisitsCount(idBusiness: number): Promise<number> {
    return await this.productsGettersService.getWithoutVisitsCountForStatistics(
      idBusiness,
    );
  }

  /**
   * Count products with no ratings.
   *
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number>} The count of products with no ratings.
   */
  async getProductsWithoutRatingsCount(idBusiness: number): Promise<number> {
    return await this.productsGettersService.getWithoutRatingsCountForStatistics(
      idBusiness,
    );
  }

  /**
   * Get visit-to-like ratio (aggregate for business products).
   *
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
   * @returns {Promise<IVisitToLikeRatio>} The visit-to-like ratio.
   */
  async getVisitToLikeRatio(
    idBusiness: number,
    timePeriod?: ITimePeriodFilter,
  ): Promise<IVisitToLikeRatio> {
    const products =
      await this.productsGettersService.getProductIdsAndLikesForStatistics(
        idBusiness,
      );
    const productIds = products.map((p) => p.id);
    if (productIds.length === 0) {
      return { totalVisits: 0, totalLikes: 0, ratio: 0 };
    }
    const totalVisits =
      await this.productVisitsGettersService.getVisitCountByProductIds(
        productIds,
        timePeriod,
      );
    const totalLikes =
      await this.productsGettersService.getTotalLikesByProductIds(productIds);
    const ratio = totalVisits > 0 ? totalLikes / totalVisits : 0;
    return { totalVisits, totalLikes, ratio };
  }

  /**
   * Get combined product statistics.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} timePeriod - Preset granularity or RANGE with explicit bounds (same as engagement).
   * @returns {Promise<IProductStats>} The product stats.
   */
  async getProductStats(
    idBusiness: number,
    timePeriod: TimePeriodInput,
  ): Promise<IProductStats> {
    const range = this.resolveStatisticsTimeRange(timePeriod);
    const visitPeriod: ITimePeriodFilter = {
      startDate: range.startDate,
      endDate: range.endDate,
    };
    const [
      topByVisits,
      topByRating,
      topByLikes,
      withoutVisitsCount,
      withoutRatingsCount,
      visitToLikeRatio,
    ] = await Promise.all([
      this.getTopProductsByVisits(idBusiness, visitPeriod),
      this.getTopProductsByRating(idBusiness),
      this.getTopProductsByLikes(idBusiness),
      this.getProductsWithoutVisitsCount(idBusiness),
      this.getProductsWithoutRatingsCount(idBusiness),
      this.getVisitToLikeRatio(idBusiness, visitPeriod),
    ]);
    return {
      topByVisits,
      topByRating,
      topByLikes,
      withoutVisitsCount,
      withoutRatingsCount,
      visitToLikeRatio,
    };
  }

  /**
   * Get catalogs by visits (ordered by visit count descending).
   *
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} [timePeriod] - Resolved date range (+ optional granularity for downstream).
   * @returns {Promise<IStatItemWithVisits[]>} Catalogs with visit stats.
   */
  async getTopCatalogsByVisits(
    idBusiness: number,
    timePeriod: ITimePeriodFilter,
    limit: number = DEFAULT_TOP_LIMIT,
  ): Promise<IStatItemWithVisits[]> {
    return this.catalogVisitsGettersService.getTopByVisits(
      idBusiness,
      timePeriod,
      limit,
    );
  }

  /**
   * Get products count per catalog (frequency data for charts).
   *
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<IFrequencyDataPoint[]>} The products per catalog.
   */
  async getProductsPerCatalog(
    idBusiness: number,
  ): Promise<IFrequencyDataPoint[]> {
    return this.catalogsGettersService.getProductsPerCatalogForStatistics(
      idBusiness,
    );
  }

  /**
   * Get total catalog visits in the resolved date range (no bucketing).
   *
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} timePeriod - Resolved range (`granularity` ignored).
   * @returns {Promise<ITimeSeriesStats>} Total visits in range.
   */
  async getCatalogVisitsOverTime(
    idBusiness: number,
    timePeriod: ITimePeriodFilter,
  ): Promise<ITimeSeriesStats> {
    const total = await this.catalogVisitsGettersService.getCountByBusiness(
      idBusiness,
      timePeriod,
    );
    return { total };
  }

  /**
   * Get combined catalog statistics.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} timePeriod - Preset granularity or RANGE (same as engagement / product stats).
   * @returns {Promise<ICatalogStats>} The catalog stats.
   */
  async getCatalogStats(
    idBusiness: number,
    timePeriod: TimePeriodInput,
  ): Promise<ICatalogStats> {
    const range = this.resolveStatisticsTimeRange(timePeriod);
    const visitPeriod: ITimePeriodFilter = {
      startDate: range.startDate,
      endDate: range.endDate,
      granularity: timePeriod.granularity,
    };
    const [topByVisits, productsPerCatalog, catalogVisitsOverTime] =
      await Promise.all([
        this.getTopCatalogsByVisits(idBusiness, visitPeriod),
        this.getProductsPerCatalog(idBusiness),
        this.getCatalogVisitsOverTime(idBusiness, visitPeriod),
      ]);
    return { topByVisits, productsPerCatalog, catalogVisitsOverTime };
  }

  /**
   * Get discounts by status (active, pending, expired).
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<IFrequencyDataPoint[]>} The discounts by status.
   */
  async getDiscountsByStatus(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<IFrequencyDataPoint[]> {
    return this.discountsGettersService.getByStatusForStatistics(
      idBusiness,
      startDate,
      endDate,
    );
  }

  /**
   * Get discounts by type (percentage vs fixed).
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<IFrequencyDataPoint[]>} The discounts by type.
   */
  async getDiscountsByType(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<IFrequencyDataPoint[]> {
    return this.discountsGettersService.getByTypeForStatistics(
      idBusiness,
      startDate,
      endDate,
    );
  }

  /**
   * Discounts **created** in `[startDate, endDate]` whose `end_date` also lies in that window.
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<ITimeSeriesStats>} Total and optional expiry time-series.
   */
  async getDiscountsExpiringSoonStats(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<ITimeSeriesStats> {
    return this.discountsGettersService.getExpiringSoonStatsForStatistics(
      idBusiness,
      startDate,
      endDate,
    );
  }

  /**
   * Get combined discount statistics.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - Range for status/type overlap and discount expiry window.
   * @returns {Promise<IDiscountStats>} The discount stats.
   */
  async getDiscountStats(
    idBusiness: number,
    timePeriod: TimePeriodInput,
  ): Promise<IDiscountStats> {
    const granularity =
      timePeriod?.granularity ?? TimePeriodGranularityEnum.ALL;
    const range =
      granularity !== TimePeriodGranularityEnum.RANGE
        ? StatisticsQueryHelper.calculateTimePeriodRange(granularity)
        : { startDate: timePeriod?.startDate, endDate: timePeriod?.endDate };
    const [byStatus, byType, expiringSoon] = await Promise.all([
      this.getDiscountsByStatus(idBusiness, range.startDate, range.endDate),
      this.getDiscountsByType(idBusiness, range.startDate, range.endDate),
      this.getDiscountsExpiringSoonStats(
        idBusiness,
        range.startDate,
        range.endDate,
      ),
    ]);

    return { byStatus, byType, expiringSoon };
  }

  /**
   * Count SKUs with low or out-of-stock quantity.
   *
   * @param {number} idBusiness - The business ID.
   * @param {number} threshold - The threshold for low or out-of-stock quantity.
   * @returns {Promise<number>} The count of SKUs with low or out-of-stock quantity.
   */
  async getSkusLowOrOutOfStockCount(
    idBusiness: number,
    threshold: number = DEFAULT_LOW_STOCK_THRESHOLD,
  ): Promise<number> {
    return this.productSkusGettersService.getLowOrOutOfStockCountForStatistics(
      idBusiness,
      threshold,
    );
  }

  /**
   * Get recent stock movements for the business.
   *
   * @param {number} idBusiness - The business ID.
   * @param {number} limit - The limit of the recent stock movements.
   * @returns {Promise<IStockMovementStatItem[]>} The recent stock movements.
   */
  async getRecentStockMovements(
    idBusiness: number,
    limit: number = 20,
  ): Promise<IStockMovementStatItem[]> {
    return this.stockMovementsGettersService.getRecentForStatistics(
      idBusiness,
      limit,
    );
  }

  /**
   * Get sales count (SALE type movements): total or time-series.
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} timePeriod - Resolved range and optional grouping granularity.
   * @returns {Promise<{ total: number; data?: ITimeSeriesDataPoint[] }>} Sales stats.
   */
  async getSalesCount(
    idBusiness: number,
    timePeriod: ITimePeriodFilter,
  ): Promise<ITimeSeriesStats> {
    return this.stockMovementsGettersService.getSalesCountForStatistics(
      idBusiness,
      timePeriod,
    );
  }

  /**
   * Count products with no stock defined (quantity IS NULL on all SKUs).
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number>} The count of products with no stock.
   */
  async getProductsWithoutStockCount(idBusiness: number): Promise<number> {
    return this.productsGettersService.getWithoutStockCountForStatistics(
      idBusiness,
    );
  }

  /**
   * Get combined inventory/stock statistics.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} timePeriod - Preset granularity or RANGE (same as other dashboard stats).
   * @param {number} threshold - The threshold for low or out-of-stock quantity.
   * @returns {Promise<IInventoryStats>} The inventory stats.
   */
  async getInventoryStats(
    idBusiness: number,
    timePeriod: TimePeriodInput,
    threshold?: number,
  ): Promise<IInventoryStats> {
    const range = this.resolveStatisticsTimeRange(timePeriod);
    const effectiveThreshold = threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const movementPeriod: ITimePeriodFilter = {
      startDate: range.startDate,
      endDate: range.endDate,
      granularity: timePeriod.granularity,
    };
    console.log('movementPeriod', movementPeriod);
    const [
      skusLowOrOutOfStockCount,
      recentStockMovements,
      salesCount,
      productsWithoutStockCount,
    ] = await Promise.all([
      this.getSkusLowOrOutOfStockCount(idBusiness, effectiveThreshold),
      this.getRecentStockMovements(idBusiness, 20),
      this.getSalesCount(idBusiness, movementPeriod),
      this.getProductsWithoutStockCount(idBusiness),
    ]);
    return {
      skusLowOrOutOfStockCount,
      recentStockMovements,
      salesCount,
      productsWithoutStockCount,
    };
  }
}
