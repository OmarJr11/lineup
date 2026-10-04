import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotAcceptableException } from '@nestjs/common';
import { BusinessesGettersService } from './businesses-getters.service';
import { Business } from '../../entities';

/**
 * Unit tests for {@link BusinessesGettersService}.
 */
describe('BusinessesGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
  };
  let service: BusinessesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesGettersService,
        {
          provide: getRepositoryToken(Business),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessesGettersService);
  });

  describe('findByIds', () => {
    it('returns empty array when ids is empty', async () => {
      await expect(service.findByIds([])).resolves.toEqual([]);
      expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('returns formatted businesses when ids provided', async () => {
      const b = { id: 1, name: 'Biz', businessFollowers: [] } as Business;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([b]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findByIds([1]);
      expect(res).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('returns paginated businesses', async () => {
      const b = { id: 1, name: 'Biz' } as Business;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([b]),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findAll({ page: 1, limit: 10 });
      expect(res).toHaveLength(1);
    });
  });

  describe('findOne and findOneByPath', () => {
    it('findOne returns formatted business', async () => {
      const b = { id: 5, name: 'Biz5' } as Business;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue(b),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findOne(5);
      expect(res.id).toBe(5);
    });

    it('findOne throws NotAcceptableException when not found', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockRejectedValue(new Error('nf')),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOne(999)).rejects.toThrow(
        NotAcceptableException,
      );
    });

    it('findOneByPath returns formatted business', async () => {
      const b = { id: 2, path: 'my-store' } as Business;
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOneOrFail: jest.fn().mockResolvedValue(b),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      const res = await service.findOneByPath('MY-STORE');
      expect(res.id).toBe(2);
    });
  });

  describe('email validation', () => {
    it('checkBusinessExistByEmail returns boolean', async () => {
      repositoryMock.findOne.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null);

      expect(await service.checkBusinessExistByEmail('a@b.com')).toBe(true);
      expect(await service.checkBusinessExistByEmail('c@d.com')).toBe(false);
    });

    it('validateBusinessEmailUnique throws if email exists on another business', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 99 }),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.validateBusinessEmailUnique('used@mail.com', 1),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('validateBusinessEmailUnique resolves if email is unique', async () => {
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repositoryMock.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.validateBusinessEmailUnique('free@mail.com', 1),
      ).resolves.toBeUndefined();
    });
  });
});
