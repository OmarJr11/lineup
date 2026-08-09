import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type {
  IAdminTimeSeriesStats,
  ITimePeriodFilter,
} from '../../common/interfaces';
import { AdminStatisticsGettersService } from './admin-statistics-getters.service';
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
 * Unit tests for {@link AdminStatisticsGettersService} (mocked downstream getters).
 */
describe('AdminStatisticsGettersService', () => {
  const usersGettersServiceMock = {
    getNonDeletedUsersCountForAdminStatistics: jest.fn(),
    getUsersGroupedByStatusForAdminStatistics: jest.fn(),
    getNewUsersStatsForAdminStatistics: jest.fn(),
  };
  const businessesGettersServiceMock = {
    getNonDeletedBusinessesCountForAdminStatistics: jest.fn(),
    getOnlineNonDeletedBusinessesCountForAdminStatistics: jest.fn(),
    getBusinessesGroupedByStatusForAdminStatistics: jest.fn(),
    getNewBusinessesStatsForAdminStatistics: jest.fn(),
  };
  const businessVisitsGettersServiceMock = {
    getGlobalVisitStatsForAdminStatistics: jest.fn(),
  };
  const productVisitsGettersServiceMock = {
    getGlobalVisitStatsForAdminStatistics: jest.fn(),
  };
  const catalogVisitsGettersServiceMock = {
    getGlobalVisitStatsForAdminStatistics: jest.fn(),
  };
  const productsGettersServiceMock = {
    getNonDeletedProductsCountForAdminStatistics: jest.fn(),
    getGlobalProductsWithoutStockCountForAdminStatistics: jest.fn(),
  };
  const productSkusGettersServiceMock = {
    getActiveSkusForNonDeletedProductsCountForAdminStatistics: jest.fn(),
  };
  const discountsGettersServiceMock = {
    findDiscountDateRangesForAdminStatistics: jest.fn(),
    getGlobalDiscountsByTypeForAdminStatistics: jest.fn(),
    getGlobalExpiringSoonDiscountCountForAdminStatistics: jest.fn(),
  };
  let service: AdminStatisticsGettersService;

  /**
   * Builds a Nest testing module with mocked getter services.
   * @returns {Promise<void>}
   */
  async function createService(): Promise<void> {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminStatisticsGettersService,
        { provide: UsersGettersService, useValue: usersGettersServiceMock },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersServiceMock,
        },
        {
          provide: BusinessVisitsGettersService,
          useValue: businessVisitsGettersServiceMock,
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
          provide: ProductSkusGettersService,
          useValue: productSkusGettersServiceMock,
        },
        {
          provide: DiscountsGettersService,
          useValue: discountsGettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(AdminStatisticsGettersService);
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await createService();
  });

  describe('getUserStats', () => {
    it('returns totals and status breakdown without new-user series when range is omitted', async () => {
      usersGettersServiceMock.getNonDeletedUsersCountForAdminStatistics.mockResolvedValue(
        100,
      );
      usersGettersServiceMock.getUsersGroupedByStatusForAdminStatistics.mockResolvedValue(
        [{ status: 'active', count: 80 }],
      );
      const result = await service.getUserStats();
      expect(result.totalUsers).toBe(100);
      expect(result.usersByStatus).toEqual([{ status: 'active', count: 80 }]);
      expect(result.newUsersInPeriod).toBeUndefined();
      expect(
        usersGettersServiceMock.getNewUsersStatsForAdminStatistics,
      ).not.toHaveBeenCalled();
    });
    it('includes new-user series when start and end dates are set', async () => {
      const period: ITimePeriodFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const series: IAdminTimeSeriesStats = { total: 5, data: [] };
      usersGettersServiceMock.getNonDeletedUsersCountForAdminStatistics.mockResolvedValue(
        100,
      );
      usersGettersServiceMock.getUsersGroupedByStatusForAdminStatistics.mockResolvedValue(
        [],
      );
      usersGettersServiceMock.getNewUsersStatsForAdminStatistics.mockResolvedValue(
        series,
      );
      const result = await service.getUserStats(period);
      expect(result.newUsersInPeriod).toEqual(series);
      expect(
        usersGettersServiceMock.getNewUsersStatsForAdminStatistics,
      ).toHaveBeenCalledWith(period);
    });
    it('does not load new-user series when only one bound is set', async () => {
      usersGettersServiceMock.getNonDeletedUsersCountForAdminStatistics.mockResolvedValue(
        1,
      );
      usersGettersServiceMock.getUsersGroupedByStatusForAdminStatistics.mockResolvedValue(
        [],
      );
      await service.getUserStats({ startDate: '2024-01-01' });
      expect(
        usersGettersServiceMock.getNewUsersStatsForAdminStatistics,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getBusinessStats', () => {
    it('aggregates counts and omits new-business series without a full period', async () => {
      businessesGettersServiceMock.getNonDeletedBusinessesCountForAdminStatistics.mockResolvedValue(
        40,
      );
      businessesGettersServiceMock.getOnlineNonDeletedBusinessesCountForAdminStatistics.mockResolvedValue(
        25,
      );
      businessesGettersServiceMock.getBusinessesGroupedByStatusForAdminStatistics.mockResolvedValue(
        [],
      );
      const result = await service.getBusinessStats();
      expect(result.totalBusinesses).toBe(40);
      expect(result.onlineBusinessesCount).toBe(25);
      expect(result.newBusinessesInPeriod).toBeUndefined();
      expect(
        businessesGettersServiceMock.getNewBusinessesStatsForAdminStatistics,
      ).not.toHaveBeenCalled();
    });
    it('includes new-business series when period has both bounds', async () => {
      const period: ITimePeriodFilter = {
        startDate: '2024-02-01',
        endDate: '2024-02-28',
      };
      const series: IAdminTimeSeriesStats = { total: 3 };
      businessesGettersServiceMock.getNonDeletedBusinessesCountForAdminStatistics.mockResolvedValue(
        40,
      );
      businessesGettersServiceMock.getOnlineNonDeletedBusinessesCountForAdminStatistics.mockResolvedValue(
        25,
      );
      businessesGettersServiceMock.getBusinessesGroupedByStatusForAdminStatistics.mockResolvedValue(
        [],
      );
      businessesGettersServiceMock.getNewBusinessesStatsForAdminStatistics.mockResolvedValue(
        series,
      );
      const result = await service.getBusinessStats(period);
      expect(result.newBusinessesInPeriod).toEqual(series);
      expect(
        businessesGettersServiceMock.getNewBusinessesStatsForAdminStatistics,
      ).toHaveBeenCalledWith(period);
    });
  });

  describe('getPlatformEngagementStats', () => {
    it('merges visit aggregates from business, product, and catalog getters', async () => {
      const businessSeries: IAdminTimeSeriesStats = { total: 10 };
      const productSeries: IAdminTimeSeriesStats = { total: 20 };
      const catalogSeries: IAdminTimeSeriesStats = { total: 30 };
      businessVisitsGettersServiceMock.getGlobalVisitStatsForAdminStatistics.mockResolvedValue(
        businessSeries,
      );
      productVisitsGettersServiceMock.getGlobalVisitStatsForAdminStatistics.mockResolvedValue(
        productSeries,
      );
      catalogVisitsGettersServiceMock.getGlobalVisitStatsForAdminStatistics.mockResolvedValue(
        catalogSeries,
      );
      const period: ITimePeriodFilter = {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      };
      const result = await service.getPlatformEngagementStats(period);
      expect(result).toEqual({
        businessVisits: businessSeries,
        productVisits: productSeries,
        catalogVisits: catalogSeries,
      });
      expect(
        businessVisitsGettersServiceMock.getGlobalVisitStatsForAdminStatistics,
      ).toHaveBeenCalledWith(period);
      expect(
        productVisitsGettersServiceMock.getGlobalVisitStatsForAdminStatistics,
      ).toHaveBeenCalledWith(period);
      expect(
        catalogVisitsGettersServiceMock.getGlobalVisitStatsForAdminStatistics,
      ).toHaveBeenCalledWith(period);
    });
  });

  describe('getCatalogGlobalStats', () => {
    it('returns product, SKU, and out-of-stock counts', async () => {
      productsGettersServiceMock.getNonDeletedProductsCountForAdminStatistics.mockResolvedValue(
        500,
      );
      productSkusGettersServiceMock.getActiveSkusForNonDeletedProductsCountForAdminStatistics.mockResolvedValue(
        1200,
      );
      productsGettersServiceMock.getGlobalProductsWithoutStockCountForAdminStatistics.mockResolvedValue(
        12,
      );
      const result = await service.getCatalogGlobalStats();
      expect(result).toEqual({
        totalProducts: 500,
        totalSkus: 1200,
        productsWithoutStock: 12,
      });
    });
  });

  describe('getDiscountGlobalStats', () => {
    afterEach(() => {
      jest.useRealTimers();
    });
    it('uses default expiring horizon and merges type and lifecycle buckets', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      discountsGettersServiceMock.findDiscountDateRangesForAdminStatistics.mockResolvedValue(
        [
          {
            startDate: new Date('2024-06-01T00:00:00.000Z'),
            endDate: new Date('2024-06-10T00:00:00.000Z'),
          },
          {
            startDate: new Date('2024-07-01T00:00:00.000Z'),
            endDate: new Date('2024-07-31T00:00:00.000Z'),
          },
          {
            startDate: new Date('2024-06-01T00:00:00.000Z'),
            endDate: new Date('2024-06-30T00:00:00.000Z'),
          },
        ],
      );
      const byType = [
        { label: 'percentage', count: 2 },
        { label: 'fixed', count: 1 },
      ];
      discountsGettersServiceMock.getGlobalDiscountsByTypeForAdminStatistics.mockResolvedValue(
        byType,
      );
      discountsGettersServiceMock.getGlobalExpiringSoonDiscountCountForAdminStatistics.mockResolvedValue(
        4,
      );
      const result = await service.getDiscountGlobalStats();
      expect(result.discountsByType).toEqual(byType);
      expect(result.expiringSoonCount).toBe(4);
      expect(result.discountsByStatus).toEqual([
        { label: 'active', count: 1 },
        { label: 'pending', count: 1 },
        { label: 'expired', count: 1 },
      ]);
      expect(
        discountsGettersServiceMock.getGlobalExpiringSoonDiscountCountForAdminStatistics,
      ).toHaveBeenCalledWith(ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS);
    });
    it('passes custom days to expiring-soon count', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
      discountsGettersServiceMock.findDiscountDateRangesForAdminStatistics.mockResolvedValue(
        [],
      );
      discountsGettersServiceMock.getGlobalDiscountsByTypeForAdminStatistics.mockResolvedValue(
        [],
      );
      discountsGettersServiceMock.getGlobalExpiringSoonDiscountCountForAdminStatistics.mockResolvedValue(
        0,
      );
      await service.getDiscountGlobalStats(14);
      expect(
        discountsGettersServiceMock.getGlobalExpiringSoonDiscountCountForAdminStatistics,
      ).toHaveBeenCalledWith(14);
    });
  });
});
