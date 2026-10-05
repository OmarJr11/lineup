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
      jest
        .spyOn(
          service as never as {
            getExchangeDivs: (u: string) => Promise<unknown>;
          },
          'getExchangeDivs',
        )
        .mockResolvedValue({
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
      jest
        .spyOn(
          service as never as {
            getExchangeDivs: (u: string) => Promise<unknown>;
          },
          'getExchangeDivs',
        )
        .mockResolvedValue({
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
      jest
        .spyOn(
          service as never as {
            getExchangeDivs: (u: string) => Promise<unknown>;
          },
          'getExchangeDivs',
        )
        .mockResolvedValue({
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

  describe('parseToVenezuelaDate', () => {
    it('returns a new date when dateStr is null', () => {
      const fn = (service as any).parseToVenezuelaDate.bind(service);
      const res = fn(null);
      expect(res).toBeInstanceOf(Date);
    });

    it('returns date parsed directly when offset or Z is provided', () => {
      const fn = (service as any).parseToVenezuelaDate.bind(service);
      const res = fn('2026-04-09T14:30:00Z');
      expect(res.toISOString()).toBe('2026-04-09T14:30:00.000Z');

      const res2 = fn('2026-04-09T10:30:00-04:00');
      expect(res2.toISOString()).toBe('2026-04-09T14:30:00.000Z');
    });

    it('appends -04:00 when dateStr contains T but no offset', () => {
      const fn = (service as any).parseToVenezuelaDate.bind(service);
      const res = fn('2026-04-09T10:30:00');
      expect(res.toISOString()).toBe('2026-04-09T14:30:00.000Z');
    });

    it('appends T00:00:00-04:00 when dateStr has no T and no offset', () => {
      const fn = (service as any).parseToVenezuelaDate.bind(service);
      const res = fn('2026-04-09');
      expect(res.toISOString()).toBe('2026-04-09T04:00:00.000Z');
    });
  });

  describe('isSameCalendarDayInTimeZone', () => {
    it('compares local dates in specified time zone correctly', () => {
      const fn = (service as any).isSameCalendarDayInTimeZone.bind(service);
      const d1 = new Date('2026-04-09T12:00:00Z');
      const d2 = new Date('2026-04-09T16:00:00Z');
      const d3 = new Date('2026-04-10T12:00:00Z');

      expect(fn(d1, d2, 'America/Caracas')).toBe(true);
      expect(fn(d1, d3, 'America/Caracas')).toBe(false);
    });
  });

  describe('getExchangeDivs error handling', () => {
    it('throws InternalServerErrorException when puppeteer fails', async () => {
      const puppeteer = require('puppeteer');
      const launchSpy = jest
        .spyOn(puppeteer, 'launch')
        .mockRejectedValue(new Error('Puppeteer launch failed'));

      await expect(
        (service as any).getExchangeDivs('http://example.com'),
      ).rejects.toThrow('Error extracting exchange data from BCV');

      launchSpy.mockRestore();
    });

    it('attempts to close browser when page operations fail', async () => {
      const puppeteer = require('puppeteer');
      const browserMock = {
        newPage: jest.fn().mockRejectedValue(new Error('Page open fail')),
        close: jest.fn().mockResolvedValue(undefined),
      };
      const launchSpy = jest
        .spyOn(puppeteer, 'launch')
        .mockResolvedValue(browserMock as any);

      await expect(
        (service as any).getExchangeDivs('http://example.com'),
      ).rejects.toThrow('Error extracting exchange data from BCV');
      expect(browserMock.close).toHaveBeenCalled();

      launchSpy.mockRestore();
    });

    it('throws InternalServerErrorException if closing browser also fails', async () => {
      const puppeteer = require('puppeteer');
      const browserMock = {
        newPage: jest.fn().mockRejectedValue(new Error('Page open fail')),
        close: jest.fn().mockRejectedValue(new Error('Close fail')),
      };
      const launchSpy = jest
        .spyOn(puppeteer, 'launch')
        .mockResolvedValue(browserMock as any);

      await expect(
        (service as any).getExchangeDivs('http://example.com'),
      ).rejects.toThrow('Error closing browser after failure');

      launchSpy.mockRestore();
    });
  });
});
