import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductRatingsGettersService } from './product-ratings-getters.service';
import { ProductRating } from '../../entities';
import { StatusEnum } from '../../common/enums';

/**
 * Unit tests for {@link ProductRatingsGettersService}.
 */
describe('ProductRatingsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: ProductRatingsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRatingsGettersService,
        {
          provide: getRepositoryToken(ProductRating),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductRatingsGettersService);
  });

  describe('findOne', () => {
    it('returns formatted rating when repository resolves', async () => {
      const row = { id: 1, product: { productFiles: [] } } as ProductRating;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toMatchObject({ id: 1 });
    });
    it('throws NotFoundException when findOneOrFail fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByProductAndUser', () => {
    it('returns null when no row exists', async () => {
      repositoryMock.findOne.mockResolvedValue(undefined);
      await expect(
        service.findOneByProductAndUser(1, 2),
      ).resolves.toBeNull();
    });
    it('returns formatted rating when a row exists', async () => {
      const row = {
        id: 3,
        idProduct: 1,
        idCreationUser: 2,
        product: { productFiles: [] },
      } as ProductRating;
      repositoryMock.findOne.mockResolvedValue(row);
      await expect(
        service.findOneByProductAndUser(1, 2),
      ).resolves.toMatchObject({ id: 3 });
    });
  });

  describe('findAllByProduct', () => {
    it('returns list from repository.find', async () => {
      const list = [
        {
          id: 1,
          product: { productFiles: [] },
        },
      ] as ProductRating[];
      repositoryMock.find.mockResolvedValue(list);
      await expect(service.findAllByProduct(5)).resolves.toHaveLength(1);
      expect(repositoryMock.find).toHaveBeenCalled();
    });
  });

  describe('findAllByProductPaginated', () => {
    it('returns rows from paginated query', async () => {
      const rows = [{ id: 1 } as ProductRating];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.findAllByProductPaginated(8, { page: 1, limit: 5 }),
      ).resolves.toBe(rows);
    });
  });

  describe('findAllByUserPaginated', () => {
    it('returns rows using subquery builder', async () => {
      const rows = [{ id: 2 } as ProductRating];
      const subQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getQuery: jest.fn().mockReturnValue('SELECT sub.id FROM product_ratings sub'),
        getParameters: jest.fn().mockReturnValue({}),
      };
      const mainQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        setParameters: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockImplementation((alias: string) => {
        if (alias === 'sub') {
          return subQb;
        }
        return mainQb;
      });
      await expect(
        service.findAllByUserPaginated(4, { page: 1, limit: 10 }),
      ).resolves.toBe(rows);
    });
  });

  describe('formatProductRating (via findOne)', () => {
    it('filters out deleted product files from nested product', async () => {
      const row = {
        id: 1,
        product: {
          productFiles: [
            { id: 1, status: StatusEnum.ACTIVE },
            { id: 2, status: StatusEnum.DELETED },
          ],
        },
      } as ProductRating;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      const result = await service.findOne(1);
      expect(result.product?.productFiles).toHaveLength(1);
      expect(result.product?.productFiles?.[0].id).toBe(1);
    });
  });
});
