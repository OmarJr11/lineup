jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual =
    jest.requireActual<typeof import('typeorm-transactional-cls-hooked')>(
      'typeorm-transactional-cls-hooked',
    );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
      ): PropertyDescriptor =>
        descriptor,
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessFollowersSettersService } from './business-followers-setters.service';
import { BusinessFollower } from '../../entities';
import { StatusEnum } from '../../common/enums';

/**
 * Unit tests for {@link BusinessFollowersSettersService}.
 */
describe('BusinessFollowersSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    remove: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idBusiness' },
        { propertyName: 'idCreationUser' },
        { propertyName: 'status' },
        { propertyName: 'modificationDate' },
        { propertyName: 'modificationUser' },
        { propertyName: 'creationDate' },
        { propertyName: 'creationUser' },
      ],
    },
  };
  let service: BusinessFollowersSettersService;
  const userReq = { userId: 1, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessFollowersSettersService,
        {
          provide: getRepositoryToken(BusinessFollower),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessFollowersSettersService);
  });

  describe('create', () => {
    it('persists via save and returns the row', async () => {
      const created = {
        id: 5,
        idBusiness: 10,
        idCreationUser: 1,
      } as BusinessFollower;
      repositoryMock.save.mockResolvedValue(created);
      const result = await service.create(
        { idBusiness: 10, idCreationUser: 1 },
        userReq,
      );
      expect(result).toBe(created);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create({ idBusiness: 1, idCreationUser: 2 }, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity and returns refreshed row', async () => {
      const follower = {
        id: 3,
        idBusiness: 1,
        idCreationUser: 2,
        status: StatusEnum.ACTIVE,
      } as BusinessFollower;
      const updated = {
        ...follower,
        status: StatusEnum.INACTIVE,
      } as BusinessFollower;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      const result = await service.update(
        follower,
        { status: StatusEnum.INACTIVE },
        userReq,
      );
      expect(repositoryMock.update).toHaveBeenCalled();
      expect(result.status).toBe(StatusEnum.INACTIVE);
    });
    it('throws InternalServerErrorException when update fails', async () => {
      const follower = { id: 1 } as BusinessFollower;
      repositoryMock.update.mockRejectedValue(new Error('db'));
      await expect(
        service.update(follower, { status: StatusEnum.INACTIVE }, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('calls repository remove with options', async () => {
      const follower = { id: 9 } as BusinessFollower;
      repositoryMock.remove.mockResolvedValue(undefined);
      await service.remove(follower, userReq);
      expect(repositoryMock.remove).toHaveBeenCalledWith(follower, {
        data: userReq,
      });
    });
    it('throws InternalServerErrorException when remove fails', async () => {
      repositoryMock.remove.mockRejectedValue(new Error('db'));
      await expect(
        service.remove({ id: 1 } as BusinessFollower, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
