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
});
