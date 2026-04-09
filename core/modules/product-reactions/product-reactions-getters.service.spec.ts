import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductReactionsGettersService } from './product-reactions-getters.service';
import { ProductReaction } from '../../entities';
import { ReactionTypeEnum } from '../../common/enums';

/**
 * Unit tests for {@link ProductReactionsGettersService}.
 */
describe('ProductReactionsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: ProductReactionsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductReactionsGettersService,
        {
          provide: getRepositoryToken(ProductReaction),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductReactionsGettersService);
  });

  describe('findOne', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 1 } as ProductReaction;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when findOneOrFail fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneByProductAndUser', () => {
    it('returns null when repository throws', async () => {
      repositoryMock.findOne.mockRejectedValue(new Error('db'));
      await expect(
        service.findOneByProductAndUser(1, ReactionTypeEnum.LIKE, 2),
      ).resolves.toBeNull();
    });
    it('returns row when repository resolves', async () => {
      const row = { id: 3 } as ProductReaction;
      repositoryMock.findOne.mockResolvedValue(row);
      await expect(
        service.findOneByProductAndUser(1, ReactionTypeEnum.LIKE, 2),
      ).resolves.toBe(row);
    });
  });

  describe('findAllByProduct', () => {
    it('returns list from repository.find', async () => {
      const list = [{ id: 1 } as ProductReaction];
      repositoryMock.find.mockResolvedValue(list);
      await expect(service.findAllByProduct(5)).resolves.toBe(list);
    });
  });

  describe('findAllLikedByUserPaginated', () => {
    it('maps reactions to products', async () => {
      const product = { id: 10 };
      const reactions = [{ id: 1, product } as ProductReaction];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(reactions),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.findAllLikedByUserPaginated(4, { page: 1, limit: 10 }),
      ).resolves.toEqual([product]);
    });
  });

  describe('getTagIdsFromLikedProducts', () => {
    it('returns unique numeric tag ids up to limit', async () => {
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ idTag: '5' }, { idTag: '5' }, { idTag: '7' }]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.getTagIdsFromLikedProducts(1, 2)).resolves.toEqual([
        5, 7,
      ]);
    });
  });

  describe('countByProductAndType', () => {
    it('returns count from query builder', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(4),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.countByProductAndType(9, ReactionTypeEnum.LIKE),
      ).resolves.toBe(4);
    });
    it('returns 0 when getCount throws', async () => {
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockRejectedValue(new Error('db')),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.countByProductAndType(9, ReactionTypeEnum.LIKE),
      ).resolves.toBe(0);
    });
  });
});
