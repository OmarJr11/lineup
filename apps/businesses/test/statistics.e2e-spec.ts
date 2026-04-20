import type { INestApplication } from '@nestjs/common';
import { StatisticsResolver } from '../src/statistics/statistics.resolver';
import { BusinessStatisticsGettersService } from '../../../core/modules/business-statistics/business-statistics-getters.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Statistics e2e', () => {
  const businessStatisticsGettersServiceMock = {
    getEngagementStats: jest.fn(),
    getProductStats: jest.fn(),
    getCatalogStats: jest.fn(),
    getDiscountStats: jest.fn(),
    getInventoryStats: jest.fn(),
    getSalesInTimePeriod: jest.fn(),
  };
  const providers = [
    {
      provide: BusinessStatisticsGettersService,
      useValue: businessStatisticsGettersServiceMock,
    },
  ];

  const businessEngagementStatsQuery = `query BusinessEngagementStats($timePeriod: TimePeriodInput!) { businessEngagementStats(timePeriod: $timePeriod) { __typename } }`;
  const productStatsQuery = `query ProductStats($timePeriod: TimePeriodInput!) { productStats(timePeriod: $timePeriod) { __typename } }`;
  const catalogStatsQuery = `query CatalogStats($timePeriod: TimePeriodInput!) { catalogStats(timePeriod: $timePeriod) { __typename } }`;
  const discountStatsQuery = `query DiscountStats($timePeriod: TimePeriodInput!) { discountStats(timePeriod: $timePeriod) { __typename } }`;
  const inventoryStatsQuery = `query InventoryStats($timePeriod: TimePeriodInput!, $threshold: Int) { inventoryStats(timePeriod: $timePeriod, threshold: $threshold) { __typename } }`;
  const businessSalesInTimePeriodQuery = `query BusinessSalesInTimePeriod($timePeriod: TimePeriodInput!) { businessSalesInTimePeriod(timePeriod: $timePeriod) { __typename } }`;

  const timePeriod = { granularity: 'THIS_MONTH' };

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [StatisticsResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers businessEngagementStats', async () => {
    businessStatisticsGettersServiceMock.getEngagementStats.mockResolvedValue({
      profileViews: 1,
    });
    const response = await executeGraphql({
      app,
      query: businessEngagementStatsQuery,
      variables: { timePeriod },
    });
    expect(response.body.data.businessEngagementStats.__typename).toBeDefined();
  });
  it('covers productStats', async () => {
    businessStatisticsGettersServiceMock.getProductStats.mockResolvedValue({
      totalProducts: 1,
    });
    const response = await executeGraphql({
      app,
      query: productStatsQuery,
      variables: { timePeriod },
    });
    expect(response.body.data.productStats.__typename).toBeDefined();
  });
  it('covers catalogStats', async () => {
    businessStatisticsGettersServiceMock.getCatalogStats.mockResolvedValue({
      totalCatalogs: 1,
    });
    const response = await executeGraphql({
      app,
      query: catalogStatsQuery,
      variables: { timePeriod },
    });
    expect(response.body.data.catalogStats.__typename).toBeDefined();
  });
  it('covers discountStats', async () => {
    businessStatisticsGettersServiceMock.getDiscountStats.mockResolvedValue({
      totalDiscounts: 1,
    });
    const response = await executeGraphql({
      app,
      query: discountStatsQuery,
      variables: { timePeriod },
    });
    expect(response.body.data.discountStats.__typename).toBeDefined();
  });
  it('covers inventoryStats', async () => {
    businessStatisticsGettersServiceMock.getInventoryStats.mockResolvedValue({
      lowStockItems: 1,
    });
    const response = await executeGraphql({
      app,
      query: inventoryStatsQuery,
      variables: { timePeriod, threshold: 5 },
    });
    expect(response.body.data.inventoryStats.__typename).toBeDefined();
  });
  it('covers businessSalesInTimePeriod', async () => {
    businessStatisticsGettersServiceMock.getSalesInTimePeriod.mockResolvedValue({
      totalSales: 10,
      sales: [],
    });
    const response = await executeGraphql({
      app,
      query: businessSalesInTimePeriodQuery,
      variables: { timePeriod },
    });
    expect(response.body.data.businessSalesInTimePeriod.__typename).toBeDefined();
  });
});
