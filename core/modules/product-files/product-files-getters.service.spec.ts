import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductFilesGettersService } from './product-files-getters.service';
import { ProductFile } from '../../entities';

/**
 * Unit tests for {@link ProductFilesGettersService}.
 */
describe('ProductFilesGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    findOneOrFail: jest.fn(),
  };
  let service: ProductFilesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductFilesGettersService,
        {
          provide: getRepositoryToken(ProductFile),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductFilesGettersService);
  });

  describe('findAll', () => {
    it('returns paginated rows from query builder', async () => {
      const rows = [{ id: 1 } as ProductFile];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(
        service.findAll({ page: 1, limit: 10 }),
      ).resolves.toBe(rows);
      expect(qb.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('findByProductId', () => {
    it('returns files for product ordered by order ASC', async () => {
      const rows = [{ id: 1, idProduct: 9 } as ProductFile];
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(rows),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findByProductId(9)).resolves.toBe(rows);
      expect(qb.where).toHaveBeenCalledWith('pf.idProduct = :idProduct', {
        idProduct: 9,
      });
    });
  });

  describe('findOne', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 3 } as ProductFile;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(3)).resolves.toBe(row);
    });
    it('throws NotFoundException when findOneOrFail fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });
});
