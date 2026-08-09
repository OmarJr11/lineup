import type { INestApplication } from '@nestjs/common';
import { CurrenciesResolver } from '../src/currencies/currencies.resolver';
import { CurrenciesService } from '../../../core/modules/currencies/currencies.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Currencies e2e', () => {
  const currenciesServiceMock = {
    findAll: jest.fn(),
    findBcvOfficialRatesFromCache: jest.fn(),
  };
  const providers = [{ provide: CurrenciesService, useValue: currenciesServiceMock }];

  const findAllCurrenciesQuery = `query FindAllCurrencies { findAllCurrencies { id } }`;
  const findBcvOfficialRatesQuery = `query FindBcvOfficialRates { findBcvOfficialRates { __typename } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [CurrenciesResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers findAllCurrencies', async () => {
    currenciesServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({ app, query: findAllCurrenciesQuery });
    expect(response.body.data.findAllCurrencies).toHaveLength(1);
  });

  it('covers findBcvOfficialRates', async () => {
    currenciesServiceMock.findBcvOfficialRatesFromCache.mockResolvedValue({
      eur: 1,
      usd: 1,
      source: 'BCV',
      fetchedAt: new Date().toISOString(),
    });
    const response = await executeGraphql({ app, query: findBcvOfficialRatesQuery });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
  });
});
