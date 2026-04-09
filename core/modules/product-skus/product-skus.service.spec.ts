jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual =
    jest.requireActual<typeof import('typeorm-transactional-cls-hooked')>(
      'typeorm-transactional-cls-hooked',
    );
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
import { BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductSkusService } from './product-skus.service';
import { ProductSkusGettersService } from './product-skus-getters.service';
import { ProductSkusSettersService } from './product-skus-setters.service';
import { StockMovementsSettersService } from '../stock-movements/stock-movements-setters.service';
import { ProductSku } from '../../entities';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductSkusService}.
 */
describe('ProductSkusService', () => {
  const productSkusGettersServiceMock = {
    findOneWithRelations: jest.fn(),
    findOneByBusinessId: jest.fn(),
    findAllByProduct: jest.fn(),
    findAllByProductAndBusiness: jest.fn(),
    getTotalStockByProduct: jest.fn(),
  };
  const productSkusSettersServiceMock = {
    update: jest.fn(),
    remove: jest.fn(),
  };
  const stockMovementsSettersServiceMock = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  let service: ProductSkusService;
  const businessReq: IBusinessReq = { businessId: 99, path: '/shop' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSkusService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(ProductSku),
          useValue: {},
        },
        {
          provide: ProductSkusGettersService,
          useValue: productSkusGettersServiceMock,
        },
        {
          provide: ProductSkusSettersService,
          useValue: productSkusSettersServiceMock,
        },
        {
          provide: StockMovementsSettersService,
          useValue: stockMovementsSettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductSkusService);
  });

  describe('findOne', () => {
    it('delegates to getters.findOneWithRelations', async () => {
      const sku = { id: 1 } as ProductSku;
      productSkusGettersServiceMock.findOneWithRelations.mockResolvedValue(sku);
      await expect(service.findOne(1)).resolves.toBe(sku);
    });
  });

  describe('findOneByBusinessId', () => {
    it('delegates to getters', async () => {
      const sku = { id: 2 } as ProductSku;
      productSkusGettersServiceMock.findOneByBusinessId.mockResolvedValue(sku);
      await expect(service.findOneByBusinessId(2, 99)).resolves.toBe(sku);
    });
  });

  describe('findAllByProduct', () => {
    it('delegates to getters', async () => {
      const list: ProductSku[] = [];
      productSkusGettersServiceMock.findAllByProduct.mockResolvedValue(list);
      await expect(service.findAllByProduct(5)).resolves.toBe(list);
    });
  });

  describe('findAllByProductAndBusiness', () => {
    it('delegates to getters', async () => {
      const list: ProductSku[] = [];
      productSkusGettersServiceMock.findAllByProductAndBusiness.mockResolvedValue(
        list,
      );
      await expect(
        service.findAllByProductAndBusiness(5, 99),
      ).resolves.toBe(list);
    });
  });

  describe('getTotalStock', () => {
    it('delegates to getters.getTotalStockByProduct', async () => {
      productSkusGettersServiceMock.getTotalStockByProduct.mockResolvedValue(12);
      await expect(service.getTotalStock(8)).resolves.toBe(12);
    });
  });

  describe('updateSku', () => {
    it('loads sku by business, updates, and reloads with relations', async () => {
      const sku = { id: 7, idCreationBusiness: 99 } as ProductSku;
      const reloaded = { id: 7, price: 10 } as ProductSku;
      productSkusGettersServiceMock.findOneByBusinessId.mockResolvedValue(sku);
      productSkusSettersServiceMock.update.mockResolvedValue(sku);
      productSkusGettersServiceMock.findOneWithRelations.mockResolvedValue(
        reloaded,
      );
      const input = { id: 7, price: 10, idCurrency: 1 };
      await expect(service.updateSku(input, businessReq)).resolves.toBe(
        reloaded,
      );
      expect(productSkusSettersServiceMock.update).toHaveBeenCalledWith(
        sku,
        input,
        businessReq,
      );
    });
  });

  describe('adjustStock', () => {
    it('throws BadRequestException when adjustment would make quantity negative', async () => {
      const sku = { id: 1, quantity: 2 } as ProductSku;
      productSkusGettersServiceMock.findOneByBusinessId.mockResolvedValue(sku);
      await expect(
        service.adjustStock(
          {
            idProductSku: 1,
            quantityDelta: -5,
            notes: 'test',
          },
          businessReq,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(stockMovementsSettersServiceMock.create).not.toHaveBeenCalled();
    });
    it('records movement and updates quantity when valid', async () => {
      const sku = { id: 3, quantity: 10 } as ProductSku;
      const updated = { id: 3, quantity: 13 } as ProductSku;
      productSkusGettersServiceMock.findOneByBusinessId.mockResolvedValue(sku);
      productSkusSettersServiceMock.update.mockResolvedValue(updated);
      await expect(
        service.adjustStock(
          {
            idProductSku: 3,
            quantityDelta: 3,
            notes: 'in',
          },
          businessReq,
        ),
      ).resolves.toBe(updated);
      expect(stockMovementsSettersServiceMock.create).toHaveBeenCalled();
    });
  });

  describe('registerSale', () => {
    it('decreases stock and records sale movement', async () => {
      const sku = { id: 4, quantity: 20 } as ProductSku;
      const updated = { id: 4, quantity: 17 } as ProductSku;
      productSkusGettersServiceMock.findOneByBusinessId.mockResolvedValue(sku);
      productSkusSettersServiceMock.update.mockResolvedValue(updated);
      const result = await service.registerSale(
        { idProductSku: 4, quantity: 3, notes: 'sale' },
        businessReq,
      );
      expect(result).toBe(updated);
      expect(stockMovementsSettersServiceMock.create).toHaveBeenCalled();
    });
  });

  describe('removeProductSku', () => {
    it('writes removal movement and calls setters.remove', async () => {
      const sku = { id: 6, quantity: 4 } as ProductSku;
      productSkusGettersServiceMock.findOneByBusinessId.mockResolvedValue(sku);
      productSkusSettersServiceMock.remove.mockResolvedValue(undefined);
      await service.removeProductSku(6, businessReq);
      expect(stockMovementsSettersServiceMock.create).toHaveBeenCalled();
      expect(productSkusSettersServiceMock.remove).toHaveBeenCalledWith(
        sku,
        businessReq,
      );
    });
  });
});
