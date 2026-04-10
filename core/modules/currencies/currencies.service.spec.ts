jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual = jest.requireActual<
    typeof import('typeorm-transactional-cls-hooked')
  >('typeorm-transactional-cls-hooked');
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
      ): PropertyDescriptor =>
        descriptor,
  };
});

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CurrenciesService } from './currencies.service';
import { CurrenciesGettersService } from './currencies-getters.service';
import { CurrenciesSettersService } from './currencies-setters.service';
import { PyCacheService } from '../py-cache/py-cache.service';
import { Currency } from '../../entities';
import { BCV_OFFICIAL_CONFIG } from '../scrapping/bcv.constants';

/**
 * Unit tests for {@link CurrenciesService}.
 */
describe('CurrenciesService', () => {
  const currenciesSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const currenciesGettersServiceMock = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
  };
  const pyCacheServiceMock = {
    getCache: jest.fn(),
  };
  let service: CurrenciesService;
  const userReq = { userId: 7, username: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(Currency),
          useValue: {},
        },
        {
          provide: CurrenciesSettersService,
          useValue: currenciesSettersServiceMock,
        },
        {
          provide: CurrenciesGettersService,
          useValue: currenciesGettersServiceMock,
        },
        {
          provide: PyCacheService,
          useValue: pyCacheServiceMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(CurrenciesService);
  });

  describe('create', () => {
    it('creates then reloads by id', async () => {
      const created = { id: 10, code: 'VES' } as Currency;
      const loaded = { id: 10, name: 'Bolívar' } as Currency;
      currenciesSettersServiceMock.create.mockResolvedValue(created);
      currenciesGettersServiceMock.findById.mockResolvedValue(loaded);
      const result = await service.create(
        { name: 'Bolívar', code: 'VES' },
        userReq,
      );
      expect(currenciesSettersServiceMock.create).toHaveBeenCalledWith(
        { name: 'Bolívar', code: 'VES' },
        userReq,
      );
      expect(currenciesGettersServiceMock.findById).toHaveBeenCalledWith(10);
      expect(result).toBe(loaded);
    });
  });

  describe('findById', () => {
    it('delegates to getters', async () => {
      const c = { id: 1 } as Currency;
      currenciesGettersServiceMock.findById.mockResolvedValue(c);
      await expect(service.findById(1)).resolves.toBe(c);
    });
  });

  describe('findByCode', () => {
    it('delegates to getters', async () => {
      const c = { id: 2 } as Currency;
      currenciesGettersServiceMock.findByCode.mockResolvedValue(c);
      await expect(service.findByCode('USD')).resolves.toBe(c);
    });
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const list: Currency[] = [];
      currenciesGettersServiceMock.findAll.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toBe(list);
    });
  });

  describe('findBcvOfficialRatesFromCache', () => {
    it('returns null when cache is null', async () => {
      pyCacheServiceMock.getCache.mockResolvedValue(null);
      await expect(service.findBcvOfficialRatesFromCache()).resolves.toBeNull();
      expect(pyCacheServiceMock.getCache).toHaveBeenCalledWith(
        BCV_OFFICIAL_CONFIG.cacheKey,
      );
    });
    it('returns parsed snapshot when present', async () => {
      const snapshot = { usd: 36.5, eur: 40.1 };
      pyCacheServiceMock.getCache.mockResolvedValue(snapshot);
      await expect(service.findBcvOfficialRatesFromCache()).resolves.toEqual(
        snapshot,
      );
    });
  });

  describe('update', () => {
    it('loads currency, updates, then reloads by id', async () => {
      const currency = { id: 4, name: 'Old' } as Currency;
      const reloaded = { id: 4, name: 'New' } as Currency;
      currenciesGettersServiceMock.findById
        .mockResolvedValueOnce(currency)
        .mockResolvedValueOnce(reloaded);
      currenciesSettersServiceMock.update.mockResolvedValue(undefined);
      const data = { id: 4, name: 'New' };
      const result = await service.update(data, userReq);
      expect(currenciesGettersServiceMock.findById).toHaveBeenCalledWith(4);
      expect(currenciesSettersServiceMock.update).toHaveBeenCalledWith(
        data,
        currency,
        userReq,
      );
      expect(result).toBe(reloaded);
    });
  });

  describe('remove', () => {
    it('loads entity, removes, returns true', async () => {
      const currency = { id: 8 } as Currency;
      currenciesGettersServiceMock.findById.mockResolvedValue(currency);
      currenciesSettersServiceMock.remove.mockResolvedValue(undefined);
      await expect(service.remove(8, userReq)).resolves.toBe(true);
      expect(currenciesSettersServiceMock.remove).toHaveBeenCalledWith(
        currency,
        userReq,
      );
    });
  });
});
