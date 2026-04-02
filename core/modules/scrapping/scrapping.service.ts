import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { LogError, LogWarn } from '../../common/helpers/logger.helper';
import { PyCacheService } from '../py-cache/py-cache.service';
import { BCV_OFFICIAL_CONFIG } from './bcv.constants';
import type { BcvOfficialRatesSnapshot } from './bcv-official-rates.interface';

const CARACAS_TIME_ZONE = 'America/Caracas';
const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PUPPETEER_DOCKER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
] as const;

/**
 * Scrapes official USD/EUR rates from the BCV website and stores a snapshot in Redis.
 */
@Injectable()
export class ScrappingCacheService {
  private readonly logger = new Logger(ScrappingCacheService.name);

  /**
   * @param pyCacheService - Redis JSON cache for the BCV snapshot.
   */
  constructor(private readonly pyCacheService: PyCacheService) {}

  /**
   * Scrapes the BCV site and refreshes the Redis snapshot when the published date
   * matches the current calendar day in Caracas.
   */
  async syncBcvOfficialRatesToCache(): Promise<void> {
    const { euro, dollar, date } = await this.getExchangeDivs(
      BCV_OFFICIAL_CONFIG.url,
    );
    const referenceDate = this.parseToVenezuelaDate(date);
    const now = new Date();
    if (
      !this.isSameCalendarDayInTimeZone(referenceDate, now, CARACAS_TIME_ZONE)
    ) {
      LogWarn(
        this.logger,
        `BCV source date does not match today in ${CARACAS_TIME_ZONE}; skipping cache update. source=${date ?? 'null'}`,
        this.syncBcvOfficialRatesToCache.name,
      );
      return;
    }
    const snapshot: BcvOfficialRatesSnapshot = {
      dollar,
      euro,
      sourceDate: date,
    };
    await this.pyCacheService.setCache(
      BCV_OFFICIAL_CONFIG.cacheKey,
      snapshot,
      BCV_OFFICIAL_CONFIG.cacheTtlSeconds,
    );
    LogWarn(
      this.logger,
      `BCV snapshot cached (USD=${String(dollar)}, EUR=${String(euro)}, date=${String(date)})`,
      this.syncBcvOfficialRatesToCache.name,
    );
  }

  /**
   * Fetches live rates from the BCV page without writing cache.
   */
  async fetchBcvOfficialRatesFromSite(): Promise<BcvOfficialRatesSnapshot> {
    const { euro, dollar, date } = await this.getExchangeDivs(
      BCV_OFFICIAL_CONFIG.url,
    );
    return {
      dollar,
      euro,
      sourceDate: date,
    };
  }

  /**
   * @param dateStr - Raw date string from the page.
   * @returns Instant interpreted in Venezuela (UTC−4) when no offset is present.
   */
  private parseToVenezuelaDate(dateStr: string | null): Date {
    if (!dateStr) {
      return new Date();
    }
    if (/[+-]\d{2}:\d{2}$|Z$/i.test(dateStr)) {
      return new Date(dateStr);
    }
    const dateWithTime = dateStr.includes('T')
      ? dateStr
      : `${dateStr}T00:00:00`;
    return new Date(`${dateWithTime}-04:00`);
  }

  /**
   * @returns Whether `a` and `b` fall on the same local date in `timeZone`.
   */
  private isSameCalendarDayInTimeZone(
    a: Date,
    b: Date,
    timeZone: string,
  ): boolean {
    const opts: Intl.DateTimeFormatOptions = {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    const fmt = (d: Date): string =>
      new Intl.DateTimeFormat('en-CA', opts).format(d);
    return fmt(a) === fmt(b);
  }

  /**
   * Opens the URL with Puppeteer and reads EUR/USD blocks and the displayed date.
   *
   * @param url - BCV (or compatible) page URL.
   */
  private async getExchangeDivs(url: string): Promise<{
    euro: number | null;
    dollar: number | null;
    date: string | null;
  }> {
    let browser: puppeteer.Browser | null = null;
    try {
      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
      browser = await puppeteer.launch({
        ...(executablePath ? { executablePath } : {}),
        args: [...PUPPETEER_DOCKER_ARGS],
      });
      const page = await browser.newPage();
      await page.setUserAgent(DESKTOP_USER_AGENT);
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45_000 });
      const normalizeNumber = (raw: string | null): number | null => {
        if (!raw) {
          return null;
        }
        let str = raw.replace(/\s+/g, '');
        const hasComma = str.includes(',');
        const hasDot = str.includes('.');
        if (hasComma && !hasDot) {
          str = str.replace(/,/g, '.');
        } else if (hasComma && hasDot) {
          str = str.replace(/\./g, '').replace(/,/g, '.');
        }
        str = str.replace(/[^0-9.-]/g, '');
        const n = parseFloat(str);
        return Number.isNaN(n) ? null : n;
      };
      const getText = async (
        sel: string,
        wait = 5000,
      ): Promise<string | null> => {
        try {
          await page.waitForSelector(sel, { timeout: wait });
        } catch {
          /* selector may be absent */
        }
        try {
          const t = await page.$eval(sel, (el) =>
            (el.textContent || '').trim(),
          );
          return t || null;
        } catch {
          return null;
        }
      };
      const euroText = await getText('#euro strong', 7000);
      const dolarText = await getText('#dolar strong', 7000);
      const euro = normalizeNumber(euroText);
      const dollar = normalizeNumber(dolarText);
      let date: string | null = null;
      try {
        await page.waitForSelector(
          '.pull-right.dinpro.center .date-display-single',
          { timeout: 4000 },
        );
        try {
          const content = await page.$eval(
            '.pull-right.dinpro.center .date-display-single',
            (el) => (el.getAttribute('content') || '').trim(),
          );
          date = content || null;
        } catch {
          const txt = await page.$eval(
            '.pull-right.dinpro.center .date-display-single',
            (el) => (el.textContent || '').trim(),
          );
          date = txt || null;
        }
      } catch {
        try {
          const txt = await getText('.pull-right.dinpro.center', 2000);
          date = txt || null;
        } catch {
          date = null;
        }
      }
      await browser.close();
      browser = null;
      return { euro, dollar, date };
    } catch (error) {
      LogError(this.logger, error as Error, this.getExchangeDivs.name);
      if (browser !== null) {
        try {
          await browser.close();
        } catch {
          throw new InternalServerErrorException(
            'Error closing browser after failure',
          );
        }
      }
      throw new InternalServerErrorException(
        'Error extracting exchange data from BCV',
      );
    }
  }
}
