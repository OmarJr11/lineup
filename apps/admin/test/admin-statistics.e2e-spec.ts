import type { INestApplication } from '@nestjs/common';
import { AdminStatisticsResolver } from '../src/admin-statistics/admin-statistics.resolver';
import { AdminStatisticsGettersService } from '../../../core/modules/admin-statistics/admin-statistics-getters.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin Statistics e2e', () => {
  const adminStatisticsGettersServiceMock = {
    getUserStats: jest.fn(),
    getBusinessStats: jest.fn(),
    getPlatformEngagementStats: jest.fn(),
    getCatalogGlobalStats: jest.fn(),
    getDiscountGlobalStats: jest.fn(),
  };

  const providers = [
    {
      provide: AdminStatisticsGettersService,
      useValue: adminStatisticsGettersServiceMock,
    },
  ];

  const adminUserStatsQuery = `
    query AdminUserStats($timePeriod: TimePeriodInput) {
      adminUserStats(timePeriod: $timePeriod) { __typename }
    }
  `;
  const adminBusinessStatsQuery = `
    query AdminBusinessStats($timePeriod: TimePeriodInput) {
      adminBusinessStats(timePeriod: $timePeriod) { __typename }
    }
  `;
  const adminPlatformEngagementStatsQuery = `
    query AdminPlatformEngagementStats($timePeriod: TimePeriodInput) {
      adminPlatformEngagementStats(timePeriod: $timePeriod) { __typename }
    }
  `;
  const adminCatalogGlobalStatsQuery = `
    query AdminCatalogGlobalStats {
      adminCatalogGlobalStats { __typename }
    }
  `;
  const adminDiscountGlobalStatsQuery = `
    query AdminDiscountGlobalStats($query: AdminDiscountGlobalQueryInput) {
      adminDiscountGlobalStats(query: $query) { __typename }
    }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    adminStatisticsGettersServiceMock.getUserStats.mockResolvedValue({
      __typename: 'AdminUserStatsSchema',
    });
    adminStatisticsGettersServiceMock.getBusinessStats.mockResolvedValue({
      __typename: 'AdminBusinessStatsSchema',
    });
    adminStatisticsGettersServiceMock.getPlatformEngagementStats.mockResolvedValue(
      {
        __typename: 'AdminPlatformEngagementStatsSchema',
      },
    );
    adminStatisticsGettersServiceMock.getCatalogGlobalStats.mockResolvedValue({
      __typename: 'AdminCatalogGlobalStatsSchema',
    });
    adminStatisticsGettersServiceMock.getDiscountGlobalStats.mockResolvedValue({
      __typename: 'AdminDiscountGlobalStatsSchema',
    });
    app = await createTestApp({
      resolvers: [AdminStatisticsResolver],
      providers,
    });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers adminUserStats', async () => {
    const response = await executeGraphql({
      app,
      query: adminUserStatsQuery,
      variables: {
        timePeriod: {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T23:59:59.000Z',
          granularity: 'TODAY',
        },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.adminUserStats.__typename).toBe('AdminUserStatsSchema');
  });

  it('covers adminBusinessStats', async () => {
    const response = await executeGraphql({
      app,
      query: adminBusinessStatsQuery,
      variables: {
        timePeriod: {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T23:59:59.000Z',
          granularity: 'TODAY',
        },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.adminBusinessStats.__typename).toBe(
      'AdminBusinessStatsSchema',
    );
  });

  it('covers adminPlatformEngagementStats', async () => {
    const response = await executeGraphql({
      app,
      query: adminPlatformEngagementStatsQuery,
      variables: {
        timePeriod: {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T23:59:59.000Z',
          granularity: 'TODAY',
        },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.adminPlatformEngagementStats.__typename).toBe(
      'AdminPlatformEngagementStatsSchema',
    );
  });

  it('covers adminCatalogGlobalStats', async () => {
    const response = await executeGraphql({
      app,
      query: adminCatalogGlobalStatsQuery,
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.adminCatalogGlobalStats.__typename).toBe(
      'AdminCatalogGlobalStatsSchema',
    );
  });

  it('covers adminDiscountGlobalStats', async () => {
    const response = await executeGraphql({
      app,
      query: adminDiscountGlobalStatsQuery,
      variables: { query: { days: 7 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.adminDiscountGlobalStats.__typename).toBe(
      'AdminDiscountGlobalStatsSchema',
    );
  });
});
