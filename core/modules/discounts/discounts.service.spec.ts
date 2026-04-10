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
import { DiscountsService } from './discounts.service';
import { DiscountsGettersService } from './discounts-getters.service';
import { DiscountsSettersService } from './discounts-setters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { Discount } from '../../entities';
import {
  DiscountScopeEnum,
  DiscountTypeEnum,
  StatusEnum,
} from '../../common/enums';

/**
 * Unit tests for {@link DiscountsService}.
 */
describe('DiscountsService', () => {
  const discountsGettersMock = {
    findOne: jest.fn(),
    findOneAndVerifyOwnership: jest.fn(),
    findAllByBusiness: jest.fn(),
    findAllByScopePaginated: jest.fn(),
    findActiveDiscountByProduct: jest.fn(),
    findAuditByProduct: jest.fn(),
    findAuditByDiscount: jest.fn(),
  };
  const discountsSettersMock = {
    createDiscount: jest.fn(),
    updateDiscount: jest.fn(),
    removeDiscount: jest.fn(),
    upsertDiscountProduct: jest.fn(),
  };
  const productsGettersMock = {
    findOneByBusinessId: jest.fn(),
    findProductIdsByBusiness: jest.fn(),
    findProductIdsByCatalog: jest.fn(),
  };
  const catalogsGettersMock = {
    checkIfExistsByIdAndBusinessId: jest.fn(),
  };
  const businessesGettersMock = {
    findOne: jest.fn(),
  };
  let service: DiscountsService;
  const businessReq = { path: '/shop', businessId: 5 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        { provide: REQUEST, useValue: { headers: {} } },
        {
          provide: getRepositoryToken(Discount),
          useValue: {},
        },
        {
          provide: DiscountsGettersService,
          useValue: discountsGettersMock,
        },
        {
          provide: DiscountsSettersService,
          useValue: discountsSettersMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersMock,
        },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(DiscountsService);
  });

  describe('create', () => {
    it('validates scope, creates discount, upserts products, returns loaded row', async () => {
      const today = new Date();
      const end = new Date(today.getTime() + 7 * 86_400_000);
      const created = {
        id: 8,
        scope: DiscountScopeEnum.BUSINESS,
      } as Discount;
      const loaded = {
        id: 8,
        scope: DiscountScopeEnum.BUSINESS,
        status: StatusEnum.ACTIVE,
      } as Discount;
      businessesGettersMock.findOne.mockResolvedValue({ id: 5 } as never);
      discountsSettersMock.createDiscount.mockResolvedValue(created);
      productsGettersMock.findProductIdsByBusiness.mockResolvedValue([101, 102]);
      discountsSettersMock.upsertDiscountProduct.mockResolvedValue({} as never);
      discountsGettersMock.findOne.mockResolvedValue(loaded);
      const data = {
        scope: DiscountScopeEnum.BUSINESS,
        discountType: DiscountTypeEnum.PERCENTAGE,
        value: 10,
        startDate: today,
        endDate: end,
      };
      const result = await service.create(data, businessReq);
      expect(businessesGettersMock.findOne).toHaveBeenCalledWith(5);
      expect(discountsSettersMock.createDiscount).toHaveBeenCalledWith(
        data,
        businessReq,
      );
      expect(productsGettersMock.findProductIdsByBusiness).toHaveBeenCalledWith(
        5,
      );
      expect(discountsSettersMock.upsertDiscountProduct).toHaveBeenCalledTimes(
        2,
      );
      expect(discountsGettersMock.findOne).toHaveBeenCalledWith(8);
      expect(result).toBe(loaded);
    });
  });

  describe('findOne', () => {
    it('delegates to getters ownership check', async () => {
      const d = { id: 1 } as Discount;
      discountsGettersMock.findOneAndVerifyOwnership.mockResolvedValue(d);
      await expect(service.findOne(1, businessReq)).resolves.toBe(d);
      expect(
        discountsGettersMock.findOneAndVerifyOwnership,
      ).toHaveBeenCalledWith(1, 5);
    });
  });

  describe('findAllMyDiscounts', () => {
    it('delegates to findAllByBusiness', async () => {
      const list: Discount[] = [];
      discountsGettersMock.findAllByBusiness.mockResolvedValue(list);
      await expect(service.findAllMyDiscounts(businessReq)).resolves.toBe(
        list,
      );
      expect(discountsGettersMock.findAllByBusiness).toHaveBeenCalledWith(5);
    });
  });

  describe('findAllMyDiscountsByScope', () => {
    it('delegates to paginated getter for BUSINESS scope', async () => {
      const paginated = { items: [], total: 0, page: 1, limit: 10 };
      discountsGettersMock.findAllByScopePaginated.mockResolvedValue(paginated);
      const pagination = { page: 1, limit: 10 };
      await expect(
        service.findAllMyDiscountsByScope(
          { scope: DiscountScopeEnum.BUSINESS },
          pagination,
          businessReq,
        ),
      ).resolves.toBe(paginated);
      expect(
        discountsGettersMock.findAllByScopePaginated,
      ).toHaveBeenCalledWith(
        DiscountScopeEnum.BUSINESS,
        5,
        pagination,
      );
    });
  });

  describe('findActiveDiscountByProduct', () => {
    it('checks product ownership then delegates', async () => {
      productsGettersMock.findOneByBusinessId.mockResolvedValue({} as never);
      const disc = { id: 1 } as Discount;
      discountsGettersMock.findActiveDiscountByProduct.mockResolvedValue(disc);
      await expect(
        service.findActiveDiscountByProduct(9, businessReq),
      ).resolves.toBe(disc);
      expect(productsGettersMock.findOneByBusinessId).toHaveBeenCalledWith(
        9,
        5,
      );
    });
  });

  describe('update', () => {
    it('loads with ownership and delegates to setters', async () => {
      const discount = { id: 3 } as Discount;
      const updated = { id: 3, value: 15 } as Discount;
      discountsGettersMock.findOneAndVerifyOwnership.mockResolvedValue(
        discount,
      );
      discountsSettersMock.updateDiscount.mockResolvedValue(updated);
      const data = { id: 3, value: 15 };
      await expect(service.update(data, businessReq)).resolves.toBe(updated);
      expect(discountsSettersMock.updateDiscount).toHaveBeenCalledWith(
        discount,
        data,
        businessReq,
      );
    });
  });

  describe('remove', () => {
    it('loads with ownership and delegates removal', async () => {
      const discount = { id: 4 } as Discount;
      discountsGettersMock.findOneAndVerifyOwnership.mockResolvedValue(
        discount,
      );
      discountsSettersMock.removeDiscount.mockResolvedValue(undefined);
      await service.remove(4, businessReq);
      expect(discountsSettersMock.removeDiscount).toHaveBeenCalledWith(
        discount,
        businessReq,
      );
    });
  });
});
