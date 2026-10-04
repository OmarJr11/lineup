import { NotAcceptableException } from '@nestjs/common';
import type { SelectQueryBuilder } from 'typeorm';
import { StatisticsQueryHelper } from './statistics-query.helper';
import { TimePeriodGranularityEnum } from '../enums/time-period-granularity.enum';

describe('StatisticsQueryHelper', () => {
  describe('shouldGroupByTime', () => {
    it('returns true when startDate, endDate, and granularity are provided', () => {
      const result = StatisticsQueryHelper.shouldGroupByTime({
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        granularity: TimePeriodGranularityEnum.THIS_MONTH,
      });
      expect(result).toBe(true);
    });

    it('returns false when any required field is missing', () => {
      expect(StatisticsQueryHelper.shouldGroupByTime(undefined)).toBe(false);
      expect(
        StatisticsQueryHelper.shouldGroupByTime({
          startDate: '2026-01-01',
        } as any),
      ).toBe(false);
      expect(
        StatisticsQueryHelper.shouldGroupByTime({
          startDate: '2026-01-01',
          endDate: '2026-01-31',
        } as any),
      ).toBe(false);
    });
  });

  describe('buildDateFilter', () => {
    it('constructs the expected SQL predicate using the alias', () => {
      expect(StatisticsQueryHelper.buildDateFilter('user')).toBe(
        'user.creationDate >= :startDate AND user.creationDate <= :endDate',
      );
    });
  });

  describe('applyTimeFilter', () => {
    it('does nothing when bounds are missing', () => {
      const andWhere = jest.fn();
      StatisticsQueryHelper.applyTimeFilter({ andWhere }, 'u', undefined);
      StatisticsQueryHelper.applyTimeFilter({ andWhere }, 'u', {
        startDate: '2026-01-01',
      } as any);
      expect(andWhere).not.toHaveBeenCalled();
    });

    it('applies andWhere with startDate and endDate when both bounds exist', () => {
      const andWhere = jest.fn();
      StatisticsQueryHelper.applyTimeFilter({ andWhere }, 'u', {
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T23:59:59.999Z',
      });
      expect(andWhere).toHaveBeenCalledWith(
        'u.creationDate >= :startDate AND u.creationDate <= :endDate',
        {
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-01-31T23:59:59.999Z',
        },
      );
    });
  });

  describe('getPostgresTruncUnitForTimeSeries', () => {
    it('returns month for THIS_YEAR', () => {
      expect(
        StatisticsQueryHelper.getPostgresTruncUnitForTimeSeries(
          TimePeriodGranularityEnum.THIS_YEAR,
        ),
      ).toBe('month');
    });

    it('returns day for other granularities', () => {
      expect(
        StatisticsQueryHelper.getPostgresTruncUnitForTimeSeries(
          TimePeriodGranularityEnum.TODAY,
        ),
      ).toBe('day');
      expect(
        StatisticsQueryHelper.getPostgresTruncUnitForTimeSeries(undefined),
      ).toBe('day');
    });
  });

  describe('getTimeSeriesFromQuery', () => {
    it('executes query builder chain and formats output', async () => {
      const qbMock: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { period: '2026-01-01', value: '15' },
          { period: '2026-01-02', value: null },
        ]),
      };

      const result = await StatisticsQueryHelper.getTimeSeriesFromQuery(
        qbMock as SelectQueryBuilder<unknown>,
        'alias',
        {
          startDate: '2026-01-01',
          endDate: '2026-01-02',
          granularity: TimePeriodGranularityEnum.TODAY,
        },
      );

      expect(qbMock.select).toHaveBeenCalled();
      expect(qbMock.addSelect).toHaveBeenCalledWith('COUNT(*)', 'value');
      expect(result).toEqual([
        { period: '2026-01-01', value: 15 },
        { period: '2026-01-02', value: 0 },
      ]);
    });
  });

  describe('calculateTimePeriodRange', () => {
    it('calculates ranges for TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, THIS_YEAR, and ALL', () => {
      const today = StatisticsQueryHelper.calculateTimePeriodRange(
        TimePeriodGranularityEnum.TODAY,
      );
      expect(today.startDate).toBeDefined();
      expect(today.endDate).toBeDefined();

      const yesterday = StatisticsQueryHelper.calculateTimePeriodRange(
        TimePeriodGranularityEnum.YESTERDAY,
      );
      expect(yesterday.startDate).toBeDefined();
      expect(yesterday.endDate).toBeDefined();

      const thisWeek = StatisticsQueryHelper.calculateTimePeriodRange(
        TimePeriodGranularityEnum.THIS_WEEK,
      );
      expect(thisWeek.startDate).toBeDefined();
      expect(thisWeek.endDate).toBeDefined();

      const thisMonth = StatisticsQueryHelper.calculateTimePeriodRange(
        TimePeriodGranularityEnum.THIS_MONTH,
      );
      expect(thisMonth.startDate).toBeDefined();
      expect(thisMonth.endDate).toBeDefined();

      const thisYear = StatisticsQueryHelper.calculateTimePeriodRange(
        TimePeriodGranularityEnum.THIS_YEAR,
      );
      expect(thisYear.startDate).toBeDefined();
      expect(thisYear.endDate).toBeDefined();

      const all = StatisticsQueryHelper.calculateTimePeriodRange(
        TimePeriodGranularityEnum.ALL,
      );
      expect(all.startDate).toBe('1970-01-01T00:00:00.000Z');
      expect(all.endDate).toBeDefined();
    });

    it('throws NotAcceptableException for invalid granularity', () => {
      expect(() =>
        StatisticsQueryHelper.calculateTimePeriodRange('UNKNOWN' as any),
      ).toThrow(NotAcceptableException);
    });
  });

  describe('getThisWeek, getThisMonth, getThisYear', () => {
    it('calculates monday to sunday for a given date', () => {
      const wednesday = new Date(2026, 4, 6); // May 6, 2026 is Wednesday
      const week = StatisticsQueryHelper.getThisWeek(wednesday);
      expect(week.start.getDay()).toBe(1); // Monday
      expect(week.end.getDay()).toBe(0); // Sunday

      const sunday = new Date(2026, 4, 10); // May 10, 2026 is Sunday
      const weekFromSunday = StatisticsQueryHelper.getThisWeek(sunday);
      expect(weekFromSunday.start.getDay()).toBe(1);
      expect(weekFromSunday.end.getDay()).toBe(0);
    });

    it('calculates month bounds', () => {
      const midMonth = new Date(2026, 1, 15); // Feb 15, 2026
      const bounds = StatisticsQueryHelper.getThisMonth(midMonth);
      expect(bounds.start.getDate()).toBe(1);
      expect(bounds.end.getDate()).toBe(28); // 2026 is not a leap year
    });

    it('calculates year bounds', () => {
      const date = new Date(2026, 5, 20);
      const bounds = StatisticsQueryHelper.getThisYear(date);
      expect(bounds.start.getMonth()).toBe(0);
      expect(bounds.start.getDate()).toBe(1);
      expect(bounds.end.getMonth()).toBe(11);
      expect(bounds.end.getDate()).toBe(31);
    });
  });
});
