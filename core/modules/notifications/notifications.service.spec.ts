jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual = jest.requireActual<
    typeof import('typeorm-transactional-cls-hooked')
  >('typeorm-transactional-cls-hooked');
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

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsGettersService } from './notifications-getters.service';
import { NotificationsSettersService } from './notifications-setters.service';
import { Notification } from '../../entities';
import { NotificationTypeEnum } from '../../common/enums';

/**
 * Unit tests for {@link NotificationsService}.
 */
describe('NotificationsService', () => {
  const gettersMock = {
    findPaginatedForUser: jest.fn(),
    findPaginatedForBusiness: jest.fn(),
    countUnreadForUser: jest.fn(),
    countUnreadForBusiness: jest.fn(),
  };
  const settersMock = {
    createAndDispatch: jest.fn(),
    markAsReadForUser: jest.fn(),
    markAsReadForBusiness: jest.fn(),
    markAllAsReadForUser: jest.fn(),
    markAllAsReadForBusiness: jest.fn(),
  };
  let service: NotificationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(Notification),
          useValue: {},
        },
        {
          provide: NotificationsGettersService,
          useValue: gettersMock,
        },
        {
          provide: NotificationsSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(NotificationsService);
  });

  describe('createAndDispatch', () => {
    it('delegates to setters', async () => {
      const n = { id: 1 } as Notification;
      const params = {
        type: NotificationTypeEnum.INFO,
        title: 'T',
        body: 'B',
      };
      const req = { userId: 2, username: 'u' };
      settersMock.createAndDispatch.mockResolvedValue(n);
      await expect(
        service.createAndDispatch(params, req),
      ).resolves.toBe(n);
      expect(settersMock.createAndDispatch).toHaveBeenCalledWith(params, req);
    });
  });

  describe('findPaginatedForUser', () => {
    it('delegates to getters', async () => {
      const rows: Notification[] = [];
      gettersMock.findPaginatedForUser.mockResolvedValue(rows);
      const opts = { page: 1, limit: 10 };
      await expect(service.findPaginatedForUser(3, opts)).resolves.toBe(rows);
      expect(gettersMock.findPaginatedForUser).toHaveBeenCalledWith(3, opts);
    });
  });

  describe('countUnreadForUser', () => {
    it('delegates to getters', async () => {
      gettersMock.countUnreadForUser.mockResolvedValue(4);
      await expect(service.countUnreadForUser(1)).resolves.toBe(4);
    });
  });

  describe('markAsReadForUser', () => {
    it('delegates with user id from request', async () => {
      const updated = { id: 5 } as Notification;
      const userReq = { userId: 9, username: 'x' };
      settersMock.markAsReadForUser.mockResolvedValue(updated);
      await expect(
        service.markAsReadForUser(5, userReq),
      ).resolves.toBe(updated);
      expect(settersMock.markAsReadForUser).toHaveBeenCalledWith(
        9,
        5,
        userReq,
      );
    });
  });

  describe('markAllAsReadForBusiness', () => {
    it('delegates with business id', async () => {
      const businessReq = { path: '/b', businessId: 12 };
      settersMock.markAllAsReadForBusiness.mockResolvedValue(undefined);
      await service.markAllAsReadForBusiness(businessReq);
      expect(settersMock.markAllAsReadForBusiness).toHaveBeenCalledWith(
        12,
        businessReq,
      );
    });
  });
});
