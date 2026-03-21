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
  ITimeSeriesDataPoint,
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

/** Default limit for top-N queries. */
const DEFAULT_TOP_LIMIT = 10;

/** Default low-stock threshold. */
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/** Default days for "expiring soon" discounts. */
const DEFAULT_EXPIRING_DAYS = 7;

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
   * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
   * @returns {Promise<ITimeSeriesStats>} The business visits stats.
   */
  async getBusinessVisits(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<ITimeSeriesStats> {
    if (StatisticsQueryHelper.shouldGroupByTime(timePeriod)) {
      const data =
        await this.businessVisitsGettersService.getTimeSeriesByBusiness(
          idBusiness,
          timePeriod,
        );
      const total = data.reduce((sum, d) => sum + d.value, 0);
      return { total, data };
    }
    const total = await this.businessVisitsGettersService.getCountByBusiness(
      idBusiness,
      timePeriod,
    );
    return { total };
  }

  /**
   * Get visits split by anonymous vs identified users.
   *
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} [timePeriod] - The time period filter.
   * @returns {Promise<IVisitsByAuthType>} The business visits by auth type.
   */
  async getBusinessVisitsByAuthType(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<IVisitsByAuthType> {
    const { anonymous, identified } =
      await this.businessVisitsGettersService.getCountByAuthType(
        idBusiness,
        timePeriod,
      );
    let data: ITimeSeriesDataPoint[] | undefined;
    if (StatisticsQueryHelper.shouldGroupByTime(timePeriod)) {
      data = await this.businessVisitsGettersService.getTimeSeriesByBusiness(
        idBusiness,
        timePeriod,
      );
    }
    return { anonymous, identified, data };
  }

  /**
   * Get combined business visits stats: total visits and breakdown by auth type.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @returns {Promise<IBusinessVisitsStats>} The business visits stats.
   */
  async getBusinessVisitsStats(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<IBusinessVisitsStats> {
    const [visits, visitsByAuthType] = await Promise.all([
      this.getBusinessVisits(idBusiness, timePeriod),
      this.getBusinessVisitsByAuthType(idBusiness, timePeriod),
    ]);
    return { visits, visitsByAuthType };
  }

  /**
   * Get combined engagement stats: visits and new followers.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @returns {Promise<IEngagementStats>} The engagement stats.
   */
  async getEngagementStats(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<IEngagementStats> {
    const [visits, newFollowers] = await Promise.all([
      this.getBusinessVisitsStats(idBusiness, timePeriod),
      this.getNewFollowers(idBusiness, timePeriod),
    ]);
    return { visits, newFollowers };
  }

  /**
   * Get new followers: total or time-series by period.
   *
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @returns {Promise<ITimeSeriesStats>} The new followers stats.
   */
  async getNewFollowers(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<ITimeSeriesStats> {
    if (StatisticsQueryHelper.shouldGroupByTime(timePeriod)) {
      const data =
        await this.businessFollowersGettersService.getTimeSeriesForStatistics(
          idBusiness,
          timePeriod,
        );
      const total = data.reduce((sum, d) => sum + d.value, 0);
      return { total, data };
    }
    const total =
      await this.businessFollowersGettersService.getCountForStatistics(
        idBusiness,
        timePeriod,
      );
    return { total };
  }

  /**
   * Get top products by visits (with optional period filter).
   *
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @param {number} limit - The limit of the top products.
   * @returns {Promise<IStatItemWithVisits[]>} The top products by visits.
   */
  async getTopProductsByVisits(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
    limit: number = DEFAULT_TOP_LIMIT,
  ): Promise<IStatItemWithVisits[]> {
    const visitData =
      await this.productVisitsGettersService.getTopProductsByVisits(
        idBusiness,
        timePeriod,
        limit,
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
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @returns {Promise<IVisitToLikeRatio>} The visit-to-like ratio.
   */
  async getVisitToLikeRatio(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
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
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @param {number} [limit] - The limit for top-N lists.
   * @returns {Promise<IProductStats>} The product stats.
   */
  async getProductStats(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
    limit: number = DEFAULT_TOP_LIMIT,
  ): Promise<IProductStats> {
    const [
      topByVisits,
      topByRating,
      topByLikes,
      withoutVisitsCount,
      withoutRatingsCount,
      visitToLikeRatio,
    ] = await Promise.all([
      this.getTopProductsByVisits(idBusiness, timePeriod, limit),
      this.getTopProductsByRating(idBusiness, limit),
      this.getTopProductsByLikes(idBusiness, limit),
      this.getProductsWithoutVisitsCount(idBusiness),
      this.getProductsWithoutRatingsCount(idBusiness),
      this.getVisitToLikeRatio(idBusiness, timePeriod),
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
   * Get top catalogs by visits.
   *
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @param {number} limit - The limit of the top catalogs.
   * @returns {Promise<IStatItemWithVisits[]>} The top catalogs by visits.
   */
  async getTopCatalogsByVisits(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
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
   * Get catalog visits over time (time-series).
   *
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @returns {Promise<ITimeSeriesStats>} The catalog visits over time.
   */
  async getCatalogVisitsOverTime(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<ITimeSeriesStats> {
    if (StatisticsQueryHelper.shouldGroupByTime(timePeriod)) {
      const data =
        await this.catalogVisitsGettersService.getTimeSeriesByBusiness(
          idBusiness,
          timePeriod,
        );
      const total = data.reduce((sum, d) => sum + d.value, 0);
      return { total, data };
    }
    const total = await this.catalogVisitsGettersService.getCountByBusiness(
      idBusiness,
      timePeriod,
    );
    return { total };
  }

  /**
   * Get combined catalog statistics.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @param {number} [limit] - The limit for top-N lists.
   * @returns {Promise<ICatalogStats>} The catalog stats.
   */
  async getCatalogStats(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
    limit: number = DEFAULT_TOP_LIMIT,
  ): Promise<ICatalogStats> {
    const [topByVisits, productsPerCatalog, catalogVisitsOverTime] =
      await Promise.all([
        this.getTopCatalogsByVisits(idBusiness, timePeriod, limit),
        this.getProductsPerCatalog(idBusiness),
        this.getCatalogVisitsOverTime(idBusiness, timePeriod),
      ]);
    return { topByVisits, productsPerCatalog, catalogVisitsOverTime };
  }

  /**
   * Get discounts by status (active, pending, expired).
   *
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<IFrequencyDataPoint[]>} The discounts by status.
   */
  async getDiscountsByStatus(
    idBusiness: number,
  ): Promise<IFrequencyDataPoint[]> {
    return this.discountsGettersService.getByStatusForStatistics(idBusiness);
  }

  /**
   * Get discounts by type (percentage vs fixed).
   *
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<IFrequencyDataPoint[]>} The discounts by type.
   */
  async getDiscountsByType(idBusiness: number): Promise<IFrequencyDataPoint[]> {
    return this.discountsGettersService.getByTypeForStatistics(idBusiness);
  }

  /**
   * Count discounts expiring within the given days.
   *
   * @param {number} idBusiness - The business ID.
   * @param {number} days - The number of days.
   * @returns {Promise<number>} The count of discounts expiring within the given days.
   */
  async getDiscountsExpiringSoonCount(
    idBusiness: number,
    days: number = DEFAULT_EXPIRING_DAYS,
  ): Promise<number> {
    return this.discountsGettersService.getExpiringSoonCountForStatistics(
      idBusiness,
      days,
    );
  }

  /**
   * Get combined discount statistics.
   * @param {number} idBusiness - The business ID.
   * @param {number} [days] - The number of days for expiring soon count.
   * @returns {Promise<IDiscountStats>} The discount stats.
   */
  async getDiscountStats(
    idBusiness: number,
    days: number = DEFAULT_EXPIRING_DAYS,
  ): Promise<IDiscountStats> {
    const [byStatus, byType, expiringSoonCount] = await Promise.all([
      this.getDiscountsByStatus(idBusiness),
      this.getDiscountsByType(idBusiness),
      this.getDiscountsExpiringSoonCount(idBusiness, days),
    ]);
    return { byStatus, byType, expiringSoonCount };
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
   */
  async getSalesCount(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
  ): Promise<{ total: number; data?: ITimeSeriesDataPoint[] }> {
    return this.stockMovementsGettersService.getSalesCountForStatistics(
      idBusiness,
      timePeriod,
    );
  }

  /**
   * Count products with no stock defined (quantity IS NULL on all SKUs).
   */
  async getProductsWithoutStockCount(idBusiness: number): Promise<number> {
    return this.productsGettersService.getWithoutStockCountForStatistics(
      idBusiness,
    );
  }

  /**
   * Get combined inventory/stock statistics.
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter for sales.
   * @param {number} [threshold] - The threshold for low/out-of-stock SKUs.
   * @param {number} [limit] - The limit for recent stock movements.
   * @returns {Promise<IInventoryStats>} The inventory stats.
   */
  async getInventoryStats(
    idBusiness: number,
    timePeriod?: TimePeriodInput,
    threshold?: number,
    limit?: number,
  ): Promise<IInventoryStats> {
    const effectiveThreshold = threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
    const effectiveLimit = limit ?? 20;
    const [
      skusLowOrOutOfStockCount,
      recentStockMovements,
      salesCount,
      productsWithoutStockCount,
    ] = await Promise.all([
      this.getSkusLowOrOutOfStockCount(idBusiness, effectiveThreshold),
      this.getRecentStockMovements(idBusiness, effectiveLimit),
      this.getSalesCount(idBusiness, timePeriod),
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
