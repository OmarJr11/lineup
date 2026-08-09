import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductVariationsGettersService } from './product-variations-getters.service';
import { ProductVariation } from '../../entities';

/**
 * Unit tests for {@link ProductVariationsGettersService}.
 */
describe('ProductVariationsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: ProductVariationsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariationsGettersService,
        {
          provide: getRepositoryToken(ProductVariation),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductVariationsGettersService);
  });

  describe('findAll', () => {
    it('returns paginated rows', async () => {
      const rows = [{ id: 1 } as ProductVariation];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAll({ page: 1, limit: 10 })).resolves.toBe(
        rows,
      );
    });
  });

  describe('findOne', () => {
    it('returns variation when found', async () => {
      const row = { id: 2 } as ProductVariation;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(2)).resolves.toBe(row);
    });
    it('throws NotFoundException when not found', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOneWithRelations', () => {
    it('returns variation with relations', async () => {
      const row = { id: 3 } as ProductVariation;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOneWithRelations(3)).resolves.toBe(row);
    });
  });

  describe('findAllByProduct', () => {
    it('filters by product id', async () => {
      const rows: ProductVariation[] = [];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAllByProduct(8)).resolves.toBe(rows);
    });
  });
});
