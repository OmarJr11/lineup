import { Test, TestingModule } from '@nestjs/testing';
import { TimePeriodGranularityEnum } from '../../common/enums/time-period-granularity.enum';
import type { ITimePeriodFilter } from '../../common/interfaces';
import { BusinessStatisticsGettersService } from './business-statistics-getters.service';
import { BusinessVisitsGettersService } from '../business-visits/business-visits-getters.service';
import { BusinessFollowersGettersService } from '../business-followers/business-followers-getters.service';
import { ProductVisitsGettersService } from '../product-visits/product-visits-getters.service';
import { CatalogVisitsGettersService } from '../catalog-visits/catalog-visits-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { DiscountsGettersService } from '../discounts/discounts-getters.service';
import { ProductSkusGettersService } from '../product-skus/product-skus-getters.service';
import { StockMovementsGettersService } from '../stock-movements/stock-movements-getters.service';

/**
 * Unit tests for {@link BusinessStatisticsGettersService} (mocked downstream getters).
 */
describe('BusinessStatisticsGettersService', () => {
  const businessVisitsGettersServiceMock = {
    getTimeSeriesByBusiness: jest.fn(),
    getCountByAuthType: jest.fn(),
  };
  const businessFollowersGettersServiceMock = {
    getTimeSeriesForStatistics: jest.fn(),
  };
  const productVisitsGettersServiceMock = {
    getTopProductsByVisits: jest.fn(),
    getVisitCountByProductIds: jest.fn(),
  };
  const catalogVisitsGettersServiceMock = {
    getTopByVisits: jest.fn(),
    getCountByBusiness: jest.fn(),
  };
  const productsGettersServiceMock = {
    getTopByVisitsForStatistics: jest.fn(),
    getTopByRatingForStatistics: jest.fn(),
    getTopByLikesForStatistics: jest.fn(),
    getWithoutVisitsCountForStatistics: jest.fn(),
    getWithoutRatingsCountForStatistics: jest.fn(),
    getProductIdsAndLikesForStatistics: jest.fn(),
    getTotalLikesByProductIds: jest.fn(),
    getWithoutStockCountForStatistics: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    getProductsPerCatalogForStatistics: jest.fn(),
  };
  const discountsGettersServiceMock = {
    getByStatusForStatistics: jest.fn(),
    getByTypeForStatistics: jest.fn(),
    getExpiringSoonStatsForStatistics: jest.fn(),
  };
  const productSkusGettersServiceMock = {
    getLowOrOutOfStockCountForStatistics: jest.fn(),
  };
  const stockMovementsGettersServiceMock = {
    getRecentForStatistics: jest.fn(),
    getSalesCountForStatistics: jest.fn(),
    getSalesInPeriodForStatistics: jest.fn(),
  };
  let service: BusinessStatisticsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessStatisticsGettersService,
        {
          provide: BusinessVisitsGettersService,
          useValue: businessVisitsGettersServiceMock,
        },
        {
          provide: BusinessFollowersGettersService,
          useValue: businessFollowersGettersServiceMock,
        },
        {
          provide: ProductVisitsGettersService,
          useValue: productVisitsGettersServiceMock,
        },
        {
          provide: CatalogVisitsGettersService,
          useValue: catalogVisitsGettersServiceMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersServiceMock,
        },
        {
          provide: DiscountsGettersService,
          useValue: discountsGettersServiceMock,
        },
        {
          provide: ProductSkusGettersService,
          useValue: productSkusGettersServiceMock,
        },
        {
          provide: StockMovementsGettersService,
          useValue: stockMovementsGettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessStatisticsGettersService);
  });

  describe('getBusinessVisits', () => {
    it('returns total from visit time series', async () => {
      businessVisitsGettersServiceMock.getTimeSeriesByBusiness.mockResolvedValue(
        12,
      );
      const result = await service.getBusinessVisits(
        1,
        '2024-01-01',
        '2024-01-31',
      );
      expect(result).toEqual({ total: 12 });
    });
  });

  describe('getBusinessVisitsByAuthType', () => {
    it('passes through anonymous and identified counts', async () => {
      businessVisitsGettersServiceMock.getCountByAuthType.mockResolvedValue({
        anonymous: 3,
        identified: 7,
      });
      const result = await service.getBusinessVisitsByAuthType(
        1,
        '2024-01-01',
        '2024-01-31',
      );
      expect(result).toEqual({ anonymous: 3, identified: 7 });
    });
  });

  describe('getNewFollowers', () => {
    it('wraps follower time-series count', async () => {
      businessFollowersGettersServiceMock.getTimeSeriesForStatistics.mockResolvedValue(
        5,
      );
      const result = await service.getNewFollowers(
        2,
        '2024-06-01',
        '2024-06-07',
      );
      expect(result).toEqual({ total: 5 });
    });
  });

  describe('getEngagementStats', () => {
    it('combines visits stats and new followers for a RANGE input', async () => {
      businessVisitsGettersServiceMock.getTimeSeriesByBusiness.mockResolvedValue(
        10,
      );
      businessVisitsGettersServiceMock.getCountByAuthType.mockResolvedValue({
        anonymous: 1,
        identified: 9,
      });
      businessFollowersGettersServiceMock.getTimeSeriesForStatistics.mockResolvedValue(
        4,
      );
      const result = await service.getEngagementStats(3, {
        granularity: TimePeriodGranularityEnum.RANGE,
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-01-20T23:59:59.999Z',
      });
      expect(result.visits.visits.total).toBe(10);
      expect(result.visits.visitsByAuthType).toEqual({
        anonymous: 1,
        identified: 9,
      });
      expect(result.newFollowers).toEqual({ total: 4 });
    });
  });

  describe('getVisitToLikeRatio', () => {
    it('returns zeros when the business has no products', async () => {
      productsGettersServiceMock.getProductIdsAndLikesForStatistics.mockResolvedValue(
        [],
      );
      const result = await service.getVisitToLikeRatio(1);
      expect(result).toEqual({ totalVisits: 0, totalLikes: 0, ratio: 0 });
      expect(
        productVisitsGettersServiceMock.getVisitCountByProductIds,
      ).not.toHaveBeenCalled();
    });
    it('computes ratio from visits and likes', async () => {
      productsGettersServiceMock.getProductIdsAndLikesForStatistics.mockResolvedValue(
        [{ id: 1, likes: 0 }],
      );
      productVisitsGettersServiceMock.getVisitCountByProductIds.mockResolvedValue(
        8,
      );
      productsGettersServiceMock.getTotalLikesByProductIds.mockResolvedValue(2);
      const period: ITimePeriodFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const result = await service.getVisitToLikeRatio(1, period);
      expect(result.totalVisits).toBe(8);
      expect(result.totalLikes).toBe(2);
      expect(result.ratio).toBe(0.25);
    });
  });

  describe('getTopProductsByRating', () => {
    it('delegates to products getters with default limit', async () => {
      const rows = [{ id: 1, rating: 5 }] as never[];
      productsGettersServiceMock.getTopByRatingForStatistics.mockResolvedValue(
        rows,
      );
      const result = await service.getTopProductsByRating(9);
      expect(result).toBe(rows);
      expect(productsGettersServiceMock.getTopByRatingForStatistics).toHaveBeenCalledWith(
        9,
        10,
      );
    });
  });

  describe('getSkusLowOrOutOfStockCount', () => {
    it('forwards threshold to SKU getters', async () => {
      productSkusGettersServiceMock.getLowOrOutOfStockCountForStatistics.mockResolvedValue(
        3,
      );
      const n = await service.getSkusLowOrOutOfStockCount(2, 7);
      expect(n).toBe(3);
      expect(
        productSkusGettersServiceMock.getLowOrOutOfStockCountForStatistics,
      ).toHaveBeenCalledWith(2, 7);
    });
  });

  describe('getSalesCount', () => {
    it('delegates to stock movements getters', async () => {
      const stats = { total: 100, data: [] };
      stockMovementsGettersServiceMock.getSalesCountForStatistics.mockResolvedValue(
        stats,
      );
      const period: ITimePeriodFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const result = await service.getSalesCount(4, period);
      expect(result).toBe(stats);
    });
  });

  describe('getInventoryStats', () => {
    it('aggregates SKU, movements, and products-without-stock counts', async () => {
      productSkusGettersServiceMock.getLowOrOutOfStockCountForStatistics.mockResolvedValue(
        1,
      );
      stockMovementsGettersServiceMock.getRecentForStatistics.mockResolvedValue(
        [],
      );
      productsGettersServiceMock.getWithoutStockCountForStatistics.mockResolvedValue(
        2,
      );
      const result = await service.getInventoryStats(5, {
        granularity: TimePeriodGranularityEnum.ALL,
      });
      expect(result).toEqual({
        skusLowOrOutOfStockCount: 1,
        recentStockMovements: [],
        productsWithoutStockCount: 2,
      });
    });
  });
});
