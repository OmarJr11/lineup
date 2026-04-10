import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsGettersService } from './products-getters.service';
import { Product, ProductRating } from '../../entities';

/**
 * Unit tests for {@link ProductsGettersService}.
 */
describe('ProductsGettersService', () => {
  const productRepositoryMock = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const productRatingRepositoryMock = {};
  let service: ProductsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsGettersService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepositoryMock,
        },
        {
          provide: getRepositoryToken(ProductRating),
          useValue: productRatingRepositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductsGettersService);
  });

  describe('findOne', () => {
    it('returns product when found', async () => {
      const row = { id: 1 } as Product;
      productRepositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when not found', async () => {
      productRepositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(0)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByBusinessId', () => {
    it('returns product scoped to business', async () => {
      const row = { id: 2, idCreationBusiness: 5 } as Product;
      productRepositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOneByBusinessId(2, 5)).resolves.toBe(row);
    });
  });

  describe('findManyWithRelations', () => {
    it('returns empty array when ids is empty', async () => {
      await expect(service.findManyWithRelations([])).resolves.toEqual([]);
    });
    it('uses repository.find when query builder returns no rows', async () => {
      const p = { id: 7 } as Product;
      const qb = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      qb.leftJoinAndSelect.mockReturnValue(qb);
      qb.where.mockReturnValue(qb);
      qb.andWhere.mockReturnValue(qb);
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      productRepositoryMock.find.mockResolvedValue([p]);
      await expect(service.findManyWithRelations([7])).resolves.toEqual([p]);
      expect(productRepositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('findOneWithRelations', () => {
    it('returns product when getOneOrFail succeeds', async () => {
      const row = { id: 3 } as Product;
      const qb = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        andWhere: jest.fn(),
        getOneOrFail: jest.fn().mockResolvedValue(row),
      };
      qb.leftJoinAndSelect.mockReturnValue(qb);
      qb.where.mockReturnValue(qb);
      qb.andWhere.mockReturnValue(qb);
      productRepositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findOneWithRelations(3)).resolves.toBe(row);
    });
  });
});
