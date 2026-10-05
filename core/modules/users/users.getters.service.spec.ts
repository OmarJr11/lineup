import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotAcceptableException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../entities';
import { UsersGettersService } from './users.getters.service';
import { InfinityScrollInput } from '../../common/dtos';
import { OrderEnum } from '../../common/enums';

/**
 * Unit tests for {@link UsersGettersService}.
 */
describe('UsersGettersService', () => {
  let service: UsersGettersService;
  const findOneOrFailMock = jest.fn();
  const getManyMock = jest.fn();
  const createQueryBuilderMock = jest.fn();
  const userRepositoryExtra = {
    createQueryBuilder: createQueryBuilderMock,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const qbChain = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: getManyMock,
    };
    createQueryBuilderMock.mockReturnValue(qbChain);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersGettersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOneOrFail: findOneOrFailMock,
            ...userRepositoryExtra,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(UsersGettersService);
  });

  describe('findOne', () => {
    it('returns user when found', async () => {
      const u = { id: 1, username: 'a' } as User;
      findOneOrFailMock.mockResolvedValue(u);
      await expect(service.findOne(1)).resolves.toBe(u);
    });

    it('throws NotAcceptableException when user is missing', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(99)).rejects.toThrow(NotAcceptableException);
    });
  });

  describe('findAll', () => {
    it('applies pagination and returns rows', async () => {
      const rows = [{ id: 2 } as User];
      getManyMock.mockResolvedValue(rows);
      const query: InfinityScrollInput = {
        page: 2,
        limit: 5,
        order: OrderEnum.ASC,
        orderBy: 'creation_date',
      };
      await expect(service.findAll(query)).resolves.toBe(rows);
      expect(createQueryBuilderMock).toHaveBeenCalledWith('u');
    });
  });

  describe('searchUsersByUsername', () => {
    it('delegates to repository query builder', async () => {
      getManyMock.mockResolvedValue([]);
      await expect(service.searchUsersByUsername('%john%')).resolves.toEqual(
        [],
      );
      expect(createQueryBuilderMock).toHaveBeenCalledWith('u');
    });
  });

  describe('findOneByEmail and checkUserExistByEmail', () => {
    it('findOneByEmail returns user when found', async () => {
      const u = { id: 1, email: 'test@mail.com' } as User;
      jest.spyOn(service, 'findOneWithOptionsOrFail').mockResolvedValue(u);

      await expect(service.findOneByEmail('test@mail.com')).resolves.toBe(u);
    });

    it('findOneByEmail throws NotAcceptableException when not found', async () => {
      jest
        .spyOn(service, 'findOneWithOptionsOrFail')
        .mockRejectedValue(new Error('nf'));

      await expect(service.findOneByEmail('missing@mail.com')).rejects.toThrow(
        NotAcceptableException,
      );
    });

    it('checkUserExistByEmail returns boolean', async () => {
      jest
        .spyOn(service, 'findOneWithOptions')
        .mockResolvedValue({ id: 1 } as User);
      await expect(service.checkUserExistByEmail('a@b.com')).resolves.toBe(
        true,
      );

      jest.spyOn(service, 'findOneWithOptions').mockResolvedValue(null);
      await expect(service.checkUserExistByEmail('a@b.com')).resolves.toBe(
        false,
      );
    });
  });

  describe('findByUsername and findByUsernameOrFail', () => {
    it('findByUsername returns user or null', async () => {
      const u = { id: 1, username: 'usr' } as User;
      jest.spyOn(service, 'findOneWithOptions').mockResolvedValue(u);
      await expect(service.findByUsername('usr')).resolves.toBe(u);
    });

    it('findByUsernameOrFail returns user or throws NotAcceptableException', async () => {
      const u = { id: 1, username: 'usr' } as User;
      jest.spyOn(service, 'findOneWithOptionsOrFail').mockResolvedValue(u);
      await expect(service.findByUsernameOrFail('usr')).resolves.toBe(u);

      jest
        .spyOn(service, 'findOneWithOptionsOrFail')
        .mockRejectedValue(new Error('nf'));
      await expect(service.findByUsernameOrFail('bad')).rejects.toThrow(
        NotAcceptableException,
      );
    });
  });

  describe('findOneByIdUserAndToken', () => {
    it('returns user or throws UnauthorizedException', async () => {
      const u = { id: 1 } as User;
      jest.spyOn(service, 'findOneWithOptionsOrFail').mockResolvedValue(u);
      await expect(
        service.findOneByIdUserAndToken(1, 'a@b.com', 'active' as any),
      ).resolves.toBe(u);

      jest
        .spyOn(service, 'findOneWithOptionsOrFail')
        .mockRejectedValue(new Error('err'));
      await expect(
        service.findOneByIdUserAndToken(1, 'a@b.com', 'active' as any),
      ).rejects.toThrow();
    });
  });

  describe('validateUniqueFields', () => {
    it('resolves silently when no duplicate user exists', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      createQueryBuilderMock.mockReturnValue(qb);

      await expect(
        service.validateUniqueFields({ email: 'u@test.com', username: 'usr' }),
      ).resolves.toBeUndefined();
    });

    it('throws NotAcceptableException when username already exists', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValue({
            id: 2,
            username: 'usr',
            email: 'diff@test.com',
          }),
      };
      createQueryBuilderMock.mockReturnValue(qb);

      await expect(
        service.validateUniqueFields(
          { email: 'u@test.com', username: 'usr' },
          1,
        ),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('throws NotAcceptableException when email already exists', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest
          .fn()
          .mockResolvedValue({ id: 2, username: 'other', email: 'u@test.com' }),
      };
      createQueryBuilderMock.mockReturnValue(qb);

      await expect(
        service.validateUniqueFields({ email: 'u@test.com', username: 'usr' }),
      ).rejects.toThrow(NotAcceptableException);
    });
  });

  describe('admin statistics helpers', () => {
    it('getNonDeletedUsersCountForAdminStatistics calls repository count', async () => {
      const countMock = jest.fn().mockResolvedValue(42);
      (service as any).userRepository.count = countMock;

      await expect(
        service.getNonDeletedUsersCountForAdminStatistics(),
      ).resolves.toBe(42);
    });

    it('getUsersGroupedByStatusForAdminStatistics parses status counts', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest
          .fn()
          .mockResolvedValue([{ status: 'active', count: '15' }]),
      };
      jest.spyOn(service, 'createQueryBuilder').mockReturnValue(qb as any);

      const res = await service.getUsersGroupedByStatusForAdminStatistics();
      expect(res).toEqual([{ status: 'active', count: 15 }]);
    });

    it('getNewUsersStatsForAdminStatistics returns total and empty series', async () => {
      await expect(
        service.getNewUsersStatsForAdminStatistics({} as any),
      ).resolves.toEqual({ total: 0, data: [] });
    });
  });
});
