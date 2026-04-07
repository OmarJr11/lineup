import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsGettersService } from './notifications-getters.service';
import { Notification } from '../../entities';

/**
 * Unit tests for {@link NotificationsGettersService}.
 */
describe('NotificationsGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  let service: NotificationsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGettersService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(NotificationsGettersService);
  });

  function createQbMock(result: unknown) {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(result),
      getCount: jest.fn().mockResolvedValue(result),
    };
    return qb;
  }

  describe('findPaginatedForUser', () => {
    it('returns rows from query builder', async () => {
      const rows = [{ id: 1 } as Notification];
      repositoryMock.createQueryBuilder.mockReturnValue(createQbMock(rows));
      const result = await service.findPaginatedForUser(5, {
        page: 1,
        limit: 10,
      });
      expect(result).toBe(rows);
    });
  });

  describe('countUnreadForUser', () => {
    it('returns count from query builder', async () => {
      repositoryMock.createQueryBuilder.mockReturnValue(createQbMock(3));
      await expect(service.countUnreadForUser(2)).resolves.toBe(3);
    });
    it('throws InternalServerErrorException when getCount fails', async () => {
      const qb = createQbMock(0);
      qb.getCount.mockRejectedValue(new Error('db'));
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.countUnreadForUser(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOne', () => {
    it('returns notification when repository resolves', async () => {
      const row = { id: 9 } as Notification;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findOne(9)).resolves.toBe(row);
    });
    it('throws InternalServerErrorException when find fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findOne(999)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('findOneForUserOrFail', () => {
    it('throws NotFoundException when row is missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(
        service.findOneForUserOrFail(1, 2),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPaginatedForBusiness', () => {
    it('returns rows scoped to business', async () => {
      const rows: Notification[] = [];
      repositoryMock.createQueryBuilder.mockReturnValue(createQbMock(rows));
      await expect(
        service.findPaginatedForBusiness(8, { page: 1, limit: 5 }),
      ).resolves.toBe(rows);
    });
  });

  describe('findAllForUser', () => {
    it('throws InternalServerErrorException when query fails', async () => {
      const qb = createQbMock([]);
      qb.getMany.mockRejectedValue(new Error('db'));
      repositoryMock.createQueryBuilder.mockReturnValue(qb);
      await expect(service.findAllForUser(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
