import { AdminStatisticsResolver } from './admin-statistics.resolver';
import { AdminStatisticsGettersService } from '../../../../core/modules/admin-statistics/admin-statistics-getters.service';
import {
  ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS,
  type TimePeriodInput,
} from '../../../../core/modules/admin-statistics/dto';
import { TimePeriodGranularityEnum } from '../../../../core/common/enums/time-period-granularity.enum';

/**
 * Unit tests for {@link AdminStatisticsResolver}.
 */
describe('AdminStatisticsResolver', () => {
  let resolver: AdminStatisticsResolver;
  const gettersMock = {
    getUserStats: jest.fn(),
    getBusinessStats: jest.fn(),
    getPlatformEngagementStats: jest.fn(),
    getCatalogGlobalStats: jest.fn(),
    getDiscountGlobalStats: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new AdminStatisticsResolver(
      gettersMock as unknown as AdminStatisticsGettersService,
    );
  });

  it('adminUserStats delegates to getters', async () => {
    const payload = { totalUsers: 1 };
    gettersMock.getUserStats.mockResolvedValue(payload);
    const period: TimePeriodInput = {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      granularity: TimePeriodGranularityEnum.RANGE,
    };
    await expect(resolver.adminUserStats(period)).resolves.toBe(payload);
    expect(gettersMock.getUserStats).toHaveBeenCalledWith(period);
  });

  it('adminBusinessStats delegates to getters', async () => {
    const payload = { totalBusinesses: 2 };
    gettersMock.getBusinessStats.mockResolvedValue(payload);
    await expect(resolver.adminBusinessStats()).resolves.toBe(payload);
    expect(gettersMock.getBusinessStats).toHaveBeenCalledWith(undefined);
  });

  it('adminPlatformEngagementStats delegates to getters', async () => {
    const payload = { visits: 3 };
    gettersMock.getPlatformEngagementStats.mockResolvedValue(payload);
    await expect(resolver.adminPlatformEngagementStats()).resolves.toBe(payload);
  });

  it('adminCatalogGlobalStats delegates to getters', async () => {
    const payload = { products: 4 };
    gettersMock.getCatalogGlobalStats.mockResolvedValue(payload);
    await expect(resolver.adminCatalogGlobalStats()).resolves.toBe(payload);
  });

  it('adminDiscountGlobalStats uses default days when query omitted', async () => {
    const payload = { buckets: [] };
    gettersMock.getDiscountGlobalStats.mockResolvedValue(payload);
    await expect(resolver.adminDiscountGlobalStats()).resolves.toBe(payload);
    expect(gettersMock.getDiscountGlobalStats).toHaveBeenCalledWith(
      ADMIN_DISCOUNT_EXPIRING_DEFAULT_DAYS,
    );
  });

  it('adminDiscountGlobalStats passes custom days from query', async () => {
    const payload = { buckets: [] };
    gettersMock.getDiscountGlobalStats.mockResolvedValue(payload);
    await expect(
      resolver.adminDiscountGlobalStats({ days: 14 }),
    ).resolves.toBe(payload);
    expect(gettersMock.getDiscountGlobalStats).toHaveBeenCalledWith(14);
  });
});
