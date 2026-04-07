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
});
