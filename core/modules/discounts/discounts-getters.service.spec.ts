import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DiscountsGettersService } from './discounts-getters.service';
import { Discount } from '../../entities';
import { DiscountProductsGettersService } from '../discount-products/discount-products-getters.service';
import { EntityAuditsGettersService } from '../entity-audits/entity-audits-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import {
  DiscountScopeEnum,
  DiscountTypeEnum,
  StatusEnum,
} from '../../common/enums';

/**
 * Unit tests for {@link DiscountsGettersService}.
 */
describe('DiscountsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const discountProductsGettersMock = {
    findByProductIdWithDiscount: jest.fn(),
    findAllByDiscountId: jest.fn(),
  };
  const entityAuditsGettersMock = {
    findByDiscountProductByProductId: jest.fn(),
    findByDiscountProductByDiscountId: jest.fn(),
  };
  const catalogsGettersMock = {
    checkIfExistsByIdAndBusinessId: jest.fn(),
  };
  const productsGettersMock = {
    findOneByBusinessId: jest.fn(),
  };
  let service: DiscountsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsGettersService,
        {
          provide: getRepositoryToken(Discount),
          useValue: repositoryMock,
        },
        {
          provide: DiscountProductsGettersService,
          useValue: discountProductsGettersMock,
        },
        {
          provide: EntityAuditsGettersService,
          useValue: entityAuditsGettersMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersMock,
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersMock,
        },
      ],
    }).compile();
    service = moduleRef.get(DiscountsGettersService);
  });

  describe('findOne', () => {
    it('returns discount when repository resolves', async () => {
      const d = { id: 1 } as Discount;
      repositoryMock.findOneOrFail.mockResolvedValue(d);
      await expect(service.findOne(1)).resolves.toBe(d);
    });
    it('throws NotFoundException when find fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('verifyBusinessOwnership', () => {
    it('allows BUSINESS scope when business matches', async () => {
      const discount = {
        scope: DiscountScopeEnum.BUSINESS,
        idCreationBusiness: 5,
      } as Discount;
      await expect(
        service.verifyBusinessOwnership(discount, 5),
      ).resolves.toBeUndefined();
    });
    it('throws ForbiddenException when BUSINESS scope business mismatches', async () => {
      const discount = {
        scope: DiscountScopeEnum.BUSINESS,
        idCreationBusiness: 5,
      } as Discount;
      await expect(
        service.verifyBusinessOwnership(discount, 99),
      ).rejects.toThrow(ForbiddenException);
    });
    it('delegates to catalogs for CATALOG scope', async () => {
      const discount = {
        scope: DiscountScopeEnum.CATALOG,
        idCatalog: 12,
      } as Discount;
      catalogsGettersMock.checkIfExistsByIdAndBusinessId.mockResolvedValue(
        undefined,
      );
      await service.verifyBusinessOwnership(discount, 3);
      expect(
        catalogsGettersMock.checkIfExistsByIdAndBusinessId,
      ).toHaveBeenCalledWith(12, 3);
    });
    it('delegates to products for PRODUCT scope', async () => {
      const discount = {
        id: 40,
        scope: DiscountScopeEnum.PRODUCT,
      } as Discount;
      discountProductsGettersMock.findAllByDiscountId.mockResolvedValue([
        { idProduct: 100 } as never,
      ]);
      productsGettersMock.findOneByBusinessId.mockResolvedValue({} as never);
      await service.verifyBusinessOwnership(discount, 7);
      expect(
        discountProductsGettersMock.findAllByDiscountId,
      ).toHaveBeenCalledWith(40);
      expect(productsGettersMock.findOneByBusinessId).toHaveBeenCalledWith(
        100,
        7,
      );
    });
    it('throws ForbiddenException for unknown scope', async () => {
      const discount = { scope: 'other' } as unknown as Discount;
      await expect(
        service.verifyBusinessOwnership(discount, 1),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAuditByProduct', () => {
    it('delegates to entity audits getters', async () => {
      const rows = [];
      entityAuditsGettersMock.findByDiscountProductByProductId.mockResolvedValue(
        rows,
      );
      await expect(service.findAuditByProduct(3, 25)).resolves.toBe(rows);
      expect(
        entityAuditsGettersMock.findByDiscountProductByProductId,
      ).toHaveBeenCalledWith(3, 25);
    });
  });

  describe('findActiveDiscountByProduct', () => {
    it('returns null when discount is missing on the row', async () => {
      discountProductsGettersMock.findByProductIdWithDiscount.mockResolvedValue(
        { idProduct: 1 } as never,
      );
      await expect(
        service.findActiveDiscountByProduct(1),
      ).resolves.toBeNull();
    });
    it('returns null when discount is not ACTIVE', async () => {
      const start = new Date(Date.now() - 86_400_000);
      const end = new Date(Date.now() + 86_400_000);
      discountProductsGettersMock.findByProductIdWithDiscount.mockResolvedValue(
        {
          discount: {
            status: StatusEnum.PENDING,
            startDate: start,
            endDate: end,
          },
        } as never,
      );
      await expect(
        service.findActiveDiscountByProduct(1),
      ).resolves.toBeNull();
    });
    it('returns discount when ACTIVE and within date range', async () => {
      const start = new Date(Date.now() - 86_400_000);
      const end = new Date(Date.now() + 86_400_000);
      const disc = {
        status: StatusEnum.ACTIVE,
        startDate: start,
        endDate: end,
        discountType: DiscountTypeEnum.PERCENTAGE,
      } as Discount;
      discountProductsGettersMock.findByProductIdWithDiscount.mockResolvedValue(
        {
          discount: disc,
        } as never,
      );
      await expect(service.findActiveDiscountByProduct(1)).resolves.toBe(
        disc,
      );
    });
  });

  describe('findAllByBusiness and findAllByCatalog', () => {
    it('findAllByBusiness calls find with correct where condition', async () => {
      const discounts = [{ id: 1 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllByBusiness(5);
      expect(res).toEqual(discounts);
    });

    it('findAllByCatalog calls find with correct where condition', async () => {
      const discounts = [{ id: 2 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllByCatalog(10);
      expect(res).toEqual(discounts);
    });
  });

  describe('findAllByIds, findAllByScopeCatalog, findAllByScopeProduct', () => {
    it('findAllByIds calls find with In(ids)', async () => {
      const discounts = [{ id: 1 }, { id: 2 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllByIds([1, 2]);
      expect(res).toEqual(discounts);
    });

    it('findAllByScopeCatalog calls find with CATALOG scope', async () => {
      const discounts = [{ id: 3 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllByScopeCatalog(10);
      expect(res).toEqual(discounts);
    });

    it('findAllByScopeProduct calls find with PRODUCT scope', async () => {
      const discounts = [{ id: 4 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllByScopeProduct(10);
      expect(res).toEqual(discounts);
    });
  });

  describe('findAllActiveWithEndDatePassed and findAllPendingWithStartDateReached', () => {
    it('findAllActiveWithEndDatePassed calls find', async () => {
      const discounts = [{ id: 5 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllActiveWithEndDatePassed();
      expect(res).toEqual(discounts);
    });

    it('findAllPendingWithStartDateReached calls find', async () => {
      const discounts = [{ id: 6 }] as Discount[];
      jest.spyOn(service, 'find').mockResolvedValue(discounts);
      const res = await service.findAllPendingWithStartDateReached();
      expect(res).toEqual(discounts);
    });
  });

  describe('findAuditByDiscount and findDiscountDateRangesForAdminStatistics', () => {
    it('findAuditByDiscount delegates to entityAuditsGettersService', async () => {
      const rows = [{ id: 1 }] as never[];
      entityAuditsGettersMock.findByDiscountProductByDiscountId.mockResolvedValue(rows);
      await expect(service.findAuditByDiscount(10, 20)).resolves.toBe(rows);
      expect(entityAuditsGettersMock.findByDiscountProductByDiscountId).toHaveBeenCalledWith(10, 20);
    });

    it('findDiscountDateRangesForAdminStatistics calls find with select', async () => {
      const rows = [{ startDate: new Date(), endDate: new Date() }] as never[];
      jest.spyOn(service, 'find').mockResolvedValue(rows);
      await expect(service.findDiscountDateRangesForAdminStatistics()).resolves.toBe(rows);
    });
  });

  describe('verifyBusinessOwnership edge cases', () => {
    it('throws NotFoundException if CATALOG scope has no idCatalog', async () => {
      const discount = { scope: DiscountScopeEnum.CATALOG } as Discount;
      await expect(service.verifyBusinessOwnership(discount, 1)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if PRODUCT scope has no discount products', async () => {
      const discount = { id: 10, scope: DiscountScopeEnum.PRODUCT } as Discount;
      discountProductsGettersMock.findAllByDiscountId.mockResolvedValue([]);
      await expect(service.verifyBusinessOwnership(discount, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByIdAndScope errors', () => {
    it('throws NotFoundException when findOneWithOptionsOrFail fails', async () => {
      jest.spyOn(service, 'findOneWithOptionsOrFail').mockRejectedValue(new Error('fail'));
      await expect(service.findOneByIdAndScope(99, DiscountScopeEnum.BUSINESS)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByScopePaginated', () => {
    it('returns empty items when no discount IDs found', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qbMock);

      const res = await service.findAllByScopePaginated(DiscountScopeEnum.PRODUCT, 1, { page: 1, limit: 10 });
      expect(res).toEqual({ items: [], total: 0, page: 1, limit: 10 });
    });

    it('returns populated items when discounts found', async () => {
      const qbMock1: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnFail ? jest.fn() : jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
        getCount: jest.fn().mockResolvedValue(1),
      };
      const items = [{ id: 1, name: 'Discount 1' }] as never[];
      const qbMock2: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(items),
      };
      jest.spyOn(service, 'createQueryBuilder')
        .mockReturnValueOnce(qbMock1)
        .mockReturnValueOnce(qbMock1)
        .mockReturnValueOnce(qbMock2);

      const res = await service.findAllByScopePaginated(DiscountScopeEnum.BUSINESS, 1, {});
      expect(res).toEqual({ items, total: 1, page: 1, limit: 10 });
    });
  });

  describe('statistics methods', () => {
    it('getByStatusForStatistics correctly classifies active, pending, expired', async () => {
      const rows = [
        { id: 1, status: StatusEnum.ACTIVE, startDate: new Date('2025-06-01'), endDate: new Date('2025-07-01'), isExpired: false },
        { id: 2, status: StatusEnum.PENDING, startDate: new Date('2025-07-01'), endDate: new Date('2025-08-01'), isExpired: false },
        { id: 3, status: StatusEnum.ACTIVE, startDate: new Date('2025-01-01'), endDate: new Date('2025-05-01'), isExpired: false },
      ];
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qbMock);

      const res = await service.getByStatusForStatistics(1, '2025-06-01', '2025-06-30');
      expect(res).toEqual([
        { label: 'active', count: 1 },
        { label: 'pending', count: 1 },
        { label: 'expired', count: 1 },
      ]);
    });

    it('getByTypeForStatistics returns percentage and fixed counts', async () => {
      const rows = [
        { discountType: DiscountTypeEnum.PERCENTAGE },
        { discountType: DiscountTypeEnum.PERCENTAGE },
        { discountType: DiscountTypeEnum.FIXED },
      ];
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qbMock);

      const res = await service.getByTypeForStatistics(1, '', '');
      expect(res).toEqual([
        { label: DiscountTypeEnum.PERCENTAGE, count: 2 },
        { label: DiscountTypeEnum.FIXED, count: 1 },
      ]);
    });

    it('getExpiringSoonStatsForStatistics counts active discounts expiring within window', async () => {
      const now = new Date();
      const inThreeDays = new Date(Date.now() + 3 * 86_400_000);
      const past = new Date(Date.now() - 86_400_000);
      const rows = [
        { status: StatusEnum.ACTIVE, startDate: past, endDate: inThreeDays },
        { status: StatusEnum.PENDING, startDate: past, endDate: inThreeDays },
      ];
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qbMock);

      const res = await service.getExpiringSoonStatsForStatistics(1, '2025-01-01', '2025-12-31');
      expect(res).toEqual({ total: 1 });
    });

    it('getGlobalDiscountsByTypeForAdminStatistics returns counts', async () => {
      const qbMock: any = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { type: DiscountTypeEnum.PERCENTAGE, count: '5' },
          { type: DiscountTypeEnum.FIXED, count: '3' },
        ]),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qbMock);

      const res = await service.getGlobalDiscountsByTypeForAdminStatistics();
      expect(res).toEqual([
        { label: DiscountTypeEnum.PERCENTAGE, count: 5 },
        { label: DiscountTypeEnum.FIXED, count: 3 },
      ]);
    });

    it('getGlobalExpiringSoonDiscountCountForAdminStatistics returns count', async () => {
      const qbMock: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(7),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qbMock);

      const res = await service.getGlobalExpiringSoonDiscountCountForAdminStatistics(7);
      expect(res).toBe(7);
    });
  });
});


