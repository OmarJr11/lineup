import { StatisticsResolver } from './statistics.resolver';
import { BusinessStatisticsGettersService } from '../../../../core/modules/business-statistics/business-statistics-getters.service';
import { TimePeriodGranularityEnum } from '../../../../core/common/enums/time-period-granularity.enum';
import type { TimePeriodInput } from '../../../../core/modules/business-statistics/dto/time-period.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link StatisticsResolver}.
 */
describe('StatisticsResolver', () => {
  let resolver: StatisticsResolver;
  const gettersMock = {
    getEngagementStats: jest.fn(),
    getProductStats: jest.fn(),
    getCatalogStats: jest.fn(),
    getDiscountStats: jest.fn(),
    getInventoryStats: jest.fn(),
    getSalesInTimePeriod: jest.fn(),
  };

  const timePeriod: TimePeriodInput = {
    granularity: TimePeriodGranularityEnum.THIS_MONTH,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
  };

  const businessReq: IBusinessReq = { businessId: 10 } as IBusinessReq;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new StatisticsResolver(
      gettersMock as unknown as BusinessStatisticsGettersService,
    );
  });

  it('productStats delegates to getProductStats', async () => {
    const payload = { total: 1 };
    gettersMock.getProductStats.mockResolvedValue(payload);
    await expect(
      resolver.productStats(timePeriod, businessReq),
    ).resolves.toBe(payload);
    expect(gettersMock.getProductStats).toHaveBeenCalledWith(10, timePeriod);
  });

  it('inventoryStats passes optional threshold', async () => {
    gettersMock.getInventoryStats.mockResolvedValue({});
    await resolver.inventoryStats(timePeriod, businessReq, 5);
    expect(gettersMock.getInventoryStats).toHaveBeenCalledWith(
      10,
      timePeriod,
      5,
    );
  });

  it('businessSalesInTimePeriod delegates to getSalesInTimePeriod', async () => {
    const sales = { lineItems: [], movements: 0 };
    gettersMock.getSalesInTimePeriod.mockResolvedValue(sales);
    await expect(
      resolver.businessSalesInTimePeriod(timePeriod, businessReq),
    ).resolves.toBe(sales);
    expect(gettersMock.getSalesInTimePeriod).toHaveBeenCalledWith(
      10,
      timePeriod,
    );
  });
});
