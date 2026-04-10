import { CurrenciesResolver } from './currencies.resolver';
import { CurrenciesService } from '../../../../core/modules/currencies/currencies.service';

/**
 * Unit tests for {@link CurrenciesResolver}.
 */
describe('CurrenciesResolver', () => {
  let resolver: CurrenciesResolver;
  const currenciesServiceMock = {
    findAll: jest.fn(),
    findBcvOfficialRatesFromCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new CurrenciesResolver(
      currenciesServiceMock as unknown as CurrenciesService,
    );
  });

  describe('findAll', () => {
    it('maps currencies through toCurrencySchema', async () => {
      const row = { id: 1, code: 'USD' };
      currenciesServiceMock.findAll.mockResolvedValue([row]);
      const result = await resolver.findAll();
      expect(currenciesServiceMock.findAll).toHaveBeenCalled();
      expect(result).toEqual([row]);
    });
  });

  describe('findBcvOfficialRates', () => {
    it('returns null when cache has no snapshot', async () => {
      currenciesServiceMock.findBcvOfficialRatesFromCache.mockResolvedValue(
        null,
      );
      await expect(resolver.findBcvOfficialRates()).resolves.toBeNull();
    });

    it('returns snapshot when present', async () => {
      const snapshot = { eur: 1, usd: 1 };
      currenciesServiceMock.findBcvOfficialRatesFromCache.mockResolvedValue(
        snapshot,
      );
      await expect(resolver.findBcvOfficialRates()).resolves.toBe(snapshot);
    });
  });
});
