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
import { DiscountProductsService } from './discount-products.service';
import { DiscountProductsGettersService } from './discount-products-getters.service';
import { DiscountProductsSettersService } from './discount-products-setters.service';
import { DiscountProduct } from '../../entities';

/**
 * Unit tests for {@link DiscountProductsService}.
 */
describe('DiscountProductsService', () => {
  const gettersMock = {
    findByProductId: jest.fn(),
    findByProductIdWithDiscount: jest.fn(),
    findAllByDiscountId: jest.fn(),
  };
  const settersMock = {
    create: jest.fn(),
    updateDiscount: jest.fn(),
    removeMany: jest.fn(),
  };
  let service: DiscountProductsService;
  const businessReq = { path: '/b', businessId: 1 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountProductsService,
        { provide: REQUEST, useValue: { headers: {} } },
        {
          provide: getRepositoryToken(DiscountProduct),
          useValue: {},
        },
        {
          provide: DiscountProductsGettersService,
          useValue: gettersMock,
        },
        {
          provide: DiscountProductsSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(DiscountProductsService);
  });

  describe('findByProductId', () => {
    it('delegates to getters', async () => {
      const row = { id: 1 } as DiscountProduct;
      gettersMock.findByProductId.mockResolvedValue(row);
      await expect(service.findByProductId(5)).resolves.toBe(row);
    });
  });

  describe('findByProductIdWithDiscount', () => {
    it('delegates to getters', async () => {
      const row = { id: 1 } as DiscountProduct;
      gettersMock.findByProductIdWithDiscount.mockResolvedValue(row);
      await expect(service.findByProductIdWithDiscount(5)).resolves.toBe(row);
    });
  });

  describe('findAllByDiscountId', () => {
    it('delegates to getters', async () => {
      const list: DiscountProduct[] = [];
      gettersMock.findAllByDiscountId.mockResolvedValue(list);
      await expect(service.findAllByDiscountId(3)).resolves.toBe(list);
    });
  });

  describe('upsert', () => {
    it('updates when a row already exists for the product', async () => {
      const existing = { id: 1, idProduct: 7, idDiscount: 10 } as DiscountProduct;
      const reloaded = {
        ...existing,
        idDiscount: 20,
      } as DiscountProduct;
      gettersMock.findByProductId
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(reloaded);
      settersMock.updateDiscount.mockResolvedValue(undefined);
      const result = await service.upsert(7, 20, businessReq);
      expect(settersMock.updateDiscount).toHaveBeenCalledWith(
        existing,
        20,
        businessReq,
      );
      expect(settersMock.create).not.toHaveBeenCalled();
      expect(result).toBe(reloaded);
    });
    it('creates when no row exists for the product', async () => {
      const created = { id: 2, idProduct: 7, idDiscount: 30 } as DiscountProduct;
      gettersMock.findByProductId.mockResolvedValue(null);
      settersMock.create.mockResolvedValue(created);
      const result = await service.upsert(7, 30, businessReq);
      expect(settersMock.create).toHaveBeenCalledWith(7, 30, businessReq);
      expect(settersMock.updateDiscount).not.toHaveBeenCalled();
      expect(result).toBe(created);
    });
  });

  describe('removeByDiscountId', () => {
    it('loads assignments and calls removeMany', async () => {
      const rows = [{ id: 1 } as DiscountProduct];
      gettersMock.findAllByDiscountId.mockResolvedValue(rows);
      settersMock.removeMany.mockResolvedValue(undefined);
      await service.removeByDiscountId(9, businessReq);
      expect(gettersMock.findAllByDiscountId).toHaveBeenCalledWith(9);
      expect(settersMock.removeMany).toHaveBeenCalledWith(rows, businessReq);
    });
  });
});
