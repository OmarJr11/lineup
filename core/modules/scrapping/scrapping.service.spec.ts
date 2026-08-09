import { ScrappingCacheService } from './scrapping.service';
import { PyCacheService } from '../py-cache/py-cache.service';
import { BCV_OFFICIAL_CONFIG } from './bcv.constants';

/**
 * Unit tests for {@link ScrappingCacheService}.
 */
describe('ScrappingCacheService', () => {
  const pyCacheServiceMock = {
    setCache: jest.fn().mockResolvedValue(undefined),
  };
  let service: ScrappingCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ScrappingCacheService(
      pyCacheServiceMock as unknown as PyCacheService,
    );
  });

  describe('fetchBcvOfficialRatesFromSite', () => {
    it('returns dollar, euro, and sourceDate from scraper', async () => {
      jest.spyOn(service as never as { getExchangeDivs: (u: string) => Promise<unknown> }, 'getExchangeDivs').mockResolvedValue({
        euro: 48.5,
        dollar: 46.2,
        date: '2026-04-09',
      });
      await expect(service.fetchBcvOfficialRatesFromSite()).resolves.toEqual({
        dollar: 46.2,
        euro: 48.5,
        sourceDate: '2026-04-09',
      });
    });
  });

  describe('syncBcvOfficialRatesToCache', () => {
    it('skips cache when source date is not the same calendar day in Caracas', async () => {
      jest.spyOn(service as never as { getExchangeDivs: (u: string) => Promise<unknown> }, 'getExchangeDivs').mockResolvedValue({
        euro: 1,
        dollar: 1,
        date: '2020-01-01',
      });
      jest
        .spyOn(
          service as never as {
            isSameCalendarDayInTimeZone: (
              a: Date,
              b: Date,
              tz: string,
            ) => boolean;
          },
          'isSameCalendarDayInTimeZone',
        )
        .mockReturnValue(false);
      await service.syncBcvOfficialRatesToCache();
      expect(pyCacheServiceMock.setCache).not.toHaveBeenCalled();
    });
    it('writes snapshot to Redis when calendar day matches', async () => {
      jest.spyOn(service as never as { getExchangeDivs: (u: string) => Promise<unknown> }, 'getExchangeDivs').mockResolvedValue({
        euro: 40,
        dollar: 36.5,
        date: '2026-04-09',
      });
      jest
        .spyOn(
          service as never as {
            isSameCalendarDayInTimeZone: (
              a: Date,
              b: Date,
              tz: string,
            ) => boolean;
          },
          'isSameCalendarDayInTimeZone',
        )
        .mockReturnValue(true);
      await service.syncBcvOfficialRatesToCache();
      expect(pyCacheServiceMock.setCache).toHaveBeenCalledWith(
        BCV_OFFICIAL_CONFIG.cacheKey,
        {
          dollar: 36.5,
          euro: 40,
          sourceDate: '2026-04-09',
        },
        BCV_OFFICIAL_CONFIG.cacheTtlSeconds,
      );
    });
  });
});
