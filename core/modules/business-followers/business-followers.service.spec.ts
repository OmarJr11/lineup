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
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BusinessFollowersService } from './business-followers.service';
import { BusinessFollowersGettersService } from './business-followers-getters.service';
import { BusinessFollowersSettersService } from './business-followers-setters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessesSettersService } from '../businesses/businesses-setters.service';
import { BusinessFollower, Business } from '../../entities';
import { QueueNamesEnum, SearchDataConsumerEnum } from '../../common/enums/consumers';

/**
 * Unit tests for {@link BusinessFollowersService} (follow / unfollow orchestration).
 */
describe('BusinessFollowersService', () => {
  const businessFollowersGettersServiceMock = {
    findOneByBusinessAndUser: jest.fn(),
    findOne: jest.fn(),
  };
  const businessFollowersSettersServiceMock = {
    create: jest.fn(),
    remove: jest.fn(),
  };
  const businessesGettersServiceMock = {
    findOne: jest.fn(),
  };
  const businessesSettersServiceMock = {
    incrementFollowers: jest.fn(),
    decrementFollowers: jest.fn(),
  };
  const searchDataQueueMock = {
    add: jest.fn(),
  };
  let service: BusinessFollowersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessFollowersService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(BusinessFollower),
          useValue: {},
        },
        {
          provide: BusinessFollowersGettersService,
          useValue: businessFollowersGettersServiceMock,
        },
        {
          provide: BusinessFollowersSettersService,
          useValue: businessFollowersSettersServiceMock,
        },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersServiceMock,
        },
        {
          provide: BusinessesSettersService,
          useValue: businessesSettersServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.searchData),
          useValue: searchDataQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessFollowersService);
  });

  const userReq = { userId: 42, username: 'testuser' };
  const business = { id: 7, name: 'B' } as Business;

  describe('followBusiness', () => {
    it('returns existing follower without creating or side effects', async () => {
      const existing = { id: 1 } as BusinessFollower;
      businessesGettersServiceMock.findOne.mockResolvedValue(business);
      businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
        existing,
      );
      const result = await service.followBusiness(7, userReq);
      expect(result).toBe(existing);
      expect(businessFollowersSettersServiceMock.create).not.toHaveBeenCalled();
      expect(
        businessesSettersServiceMock.incrementFollowers,
      ).not.toHaveBeenCalled();
      expect(searchDataQueueMock.add).not.toHaveBeenCalled();
    });
    it('creates follower, increments likes, enqueues search job, returns loaded follower', async () => {
      const created = { id: 99 } as BusinessFollower;
      const loaded = { id: 99, idBusiness: 7 } as BusinessFollower;
      businessesGettersServiceMock.findOne.mockResolvedValue(business);
      businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
        null,
      );
      businessFollowersSettersServiceMock.create.mockResolvedValue(created);
      businessFollowersGettersServiceMock.findOne.mockResolvedValue(loaded);
      const result = await service.followBusiness(7, userReq);
      expect(businessFollowersSettersServiceMock.create).toHaveBeenCalledWith(
        { idBusiness: 7, idCreationUser: 42 },
        userReq,
      );
      expect(businessesSettersServiceMock.incrementFollowers).toHaveBeenCalledWith(
        business,
        userReq,
      );
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataBusinessFollowRecord,
        { idBusiness: 7, action: 'follow' },
      );
      expect(result).toBe(loaded);
    });
  });

  describe('unfollowBusiness', () => {
    it('returns true when there is no follower row', async () => {
      businessesGettersServiceMock.findOne.mockResolvedValue(business);
      businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
        null,
      );
      const result = await service.unfollowBusiness(7, userReq);
      expect(result).toBe(true);
      expect(businessFollowersSettersServiceMock.remove).not.toHaveBeenCalled();
      expect(searchDataQueueMock.add).not.toHaveBeenCalled();
    });
    it('removes follower, decrements likes, enqueues search job', async () => {
      const row = { id: 3 } as BusinessFollower;
      businessesGettersServiceMock.findOne.mockResolvedValue(business);
      businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
        row,
      );
      const result = await service.unfollowBusiness(7, userReq);
      expect(result).toBe(true);
      expect(businessFollowersSettersServiceMock.remove).toHaveBeenCalledWith(
        row,
        userReq,
      );
      expect(businessesSettersServiceMock.decrementFollowers).toHaveBeenCalledWith(
        business,
        userReq,
      );
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataBusinessFollowRecord,
        { idBusiness: 7, action: 'unfollow' },
      );
    });
  });
});
