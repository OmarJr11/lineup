import type { INestApplication } from '@nestjs/common';
import { SeedResolver } from '../src/seed/seed.resolver';
import { SeedService } from '../../../core/modules/seed/seed.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin Seed e2e', () => {
  const seedServiceMock = {
    seedOneBusiness: jest.fn(),
    seedOneCatalog: jest.fn(),
    seedOneProduct: jest.fn(),
  };

  const providers = [{ provide: SeedService, useValue: seedServiceMock }];

  const seedDevelopmentBusinessesMutation = `
    mutation SeedDevelopmentBusinesses {
      seedDevelopmentBusinesses
    }
  `;
  const seedDevelopmentCatalogsMutation = `
    mutation SeedDevelopmentCatalogs {
      seedDevelopmentCatalogs
    }
  `;
  const seedDevelopmentProductsMutation = `
    mutation SeedDevelopmentProducts {
      seedDevelopmentProducts
    }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    seedServiceMock.seedOneBusiness.mockResolvedValue(undefined);
    seedServiceMock.seedOneCatalog.mockResolvedValue(undefined);
    seedServiceMock.seedOneProduct.mockResolvedValue(undefined);
    app = await createTestApp({ resolvers: [SeedResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers seedDevelopmentBusinesses', async () => {
    const response = await executeGraphql({
      app,
      query: seedDevelopmentBusinessesMutation,
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.seedDevelopmentBusinesses).toBe(true);
  });

  it('covers seedDevelopmentCatalogs', async () => {
    const response = await executeGraphql({
      app,
      query: seedDevelopmentCatalogsMutation,
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.seedDevelopmentCatalogs).toBe(true);
  });

  it('covers seedDevelopmentProducts', async () => {
    const response = await executeGraphql({
      app,
      query: seedDevelopmentProductsMutation,
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.seedDevelopmentProducts).toBe(true);
  });
});
