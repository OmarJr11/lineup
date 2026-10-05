import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CatalogsGettersService } from './catalogs-getters.service';
import { Catalog } from '../../entities';

/**
 * Unit tests for {@link CatalogsGettersService}.
 */
describe('CatalogsGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
  };
  let service: CatalogsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogsGettersService,
        {
          provide: getRepositoryToken(Catalog),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CatalogsGettersService);
  });

  describe('findByIds', () => {
    it('returns empty array when ids is empty', async () => {
      await expect(service.findByIds([])).resolves.toEqual([]);
      expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('returns catalogs when ids are provided', async () => {
      const catalogs = [{ id: 1 }, { id: 2 }] as Catalog[];
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(catalogs),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findByIds([1, 2]);
      expect(res).toEqual(catalogs);
    });
  });

  describe('findAll and findAllMyCatalogs', () => {
    it('findAll returns paginated catalogs', async () => {
      const catalogs = [{ id: 10 }] as Catalog[];
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(catalogs),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findAll({ page: 1, limit: 10 });
      expect(res).toEqual(catalogs);
    });

    it('findAllMyCatalogs filters by businessId', async () => {
      const catalogs = [{ id: 11 }] as Catalog[];
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(catalogs),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findAllMyCatalogs({ page: 1, limit: 10 }, {
        businessId: 5,
      } as any);
      expect(res).toEqual(catalogs);
    });
  });

  describe('findOne', () => {
    it('returns catalog when found', async () => {
      const catalog = { id: 1 } as Catalog;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue(catalog),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOne(1)).resolves.toEqual(catalog);
    });

    it('throws NotFoundException when not found', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockRejectedValue(new Error('not found')),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOneByPath and getOneByPathOrFail', () => {
    it('getOneByPath returns catalog or null', async () => {
      const catalog = { id: 1, path: 'my-catalog' } as Catalog;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(catalog),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getOneByPath('my-catalog')).resolves.toEqual(
        catalog,
      );
    });

    it('getOneByPathOrFail throws NotFoundException on failure', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockRejectedValue(new Error('not found')),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getOneByPathOrFail('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
