import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductSearchIndexGettersService } from './product-search-index-getters.service';
import { ProductSearchIndex } from '../../entities';

/**
 * Unit tests for {@link ProductSearchIndexGettersService}.
 */
describe('ProductSearchIndexGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: ProductSearchIndexGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSearchIndexGettersService,
        {
          provide: getRepositoryToken(ProductSearchIndex),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductSearchIndexGettersService);
  });

  const makeChain = (rawRows: { id: string }[]) => {
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawRows),
    };
    return qb;
  };

  describe('getTopRatedProductIds', () => {
    it('parses numeric ids from raw rows', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(
        makeChain([{ id: '5' }, { id: 'bad' }]),
      );
      await expect(service.getTopRatedProductIds(10)).resolves.toEqual([5]);
    });
  });

  describe('getMostVisitedProductIds', () => {
    it('parses numeric ids from raw rows', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(
        makeChain([{ id: '8' }]),
      );
      await expect(service.getMostVisitedProductIds(5)).resolves.toEqual([8]);
    });
  });

  describe('getProductIdsByLocation', () => {
    it('filters by locations text', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(
        makeChain([{ id: '12' }]),
      );
      await expect(
        service.getProductIdsByLocation('Miranda', 3),
      ).resolves.toEqual([12]);
    });
  });
});
