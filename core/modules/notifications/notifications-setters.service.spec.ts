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

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsSettersService } from './notifications-setters.service';
import { NotificationsGettersService } from './notifications-getters.service';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../../entities';
import { NotificationTypeEnum } from '../../common/enums';

/**
 * Unit tests for {@link NotificationsSettersService}.
 */
describe('NotificationsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'type' },
        { propertyName: 'title' },
        { propertyName: 'body' },
        { propertyName: 'payload' },
        { propertyName: 'idCreationUser' },
        { propertyName: 'idCreationBusiness' },
        { propertyName: 'readAt' },
        { propertyName: 'modificationDate' },
        { propertyName: 'modificationUser' },
        { propertyName: 'modificationBusiness' },
        { propertyName: 'creationDate' },
        { propertyName: 'creationUser' },
        { propertyName: 'creationIp' },
        { propertyName: 'modificationIp' },
        { propertyName: 'creationCoordinate' },
        { propertyName: 'modificationCoordinate' },
      ],
    },
  };
  const gettersMock = {
    findOne: jest.fn(),
    findOneForUserOrFail: jest.fn(),
    findOneForBusinessOrFail: jest.fn(),
    findAllForUser: jest.fn(),
    findAllForBusiness: jest.fn(),
  };
  const gatewayMock = {
    emitToUser: jest.fn(),
    emitToBusiness: jest.fn(),
  };
  let service: NotificationsSettersService;
  const userReq = { userId: 1, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsSettersService,
        {
          provide: getRepositoryToken(Notification),
          useValue: repositoryMock,
        },
        {
          provide: NotificationsGateway,
          useValue: gatewayMock,
        },
        {
          provide: NotificationsGettersService,
          useValue: gettersMock,
        },
      ],
    }).compile();
    service = moduleRef.get(NotificationsSettersService);
  });

  describe('createAndDispatch', () => {
    it('saves, reloads, and emits to user when idUser is set', async () => {
      const saved = { id: 20 } as Notification;
      const loaded = {
        id: 20,
        type: NotificationTypeEnum.INFO,
        title: 'T',
        body: 'B',
      } as Notification;
      repositoryMock.save.mockResolvedValue(saved);
      gettersMock.findOne.mockResolvedValue(loaded);
      const params = {
        type: NotificationTypeEnum.INFO,
        title: 'T',
        body: 'B',
        idUser: 5,
      };
      const result = await service.createAndDispatch(params, userReq);
      expect(gettersMock.findOne).toHaveBeenCalledWith(20);
      expect(gatewayMock.emitToUser).toHaveBeenCalledWith(5, loaded);
      expect(result).toBe(loaded);
    });
    it('emits to business when idBusiness is set', async () => {
      const saved = { id: 21 } as Notification;
      const loaded = { id: 21 } as Notification;
      repositoryMock.save.mockResolvedValue(saved);
      gettersMock.findOne.mockResolvedValue(loaded);
      await service.createAndDispatch(
        {
          type: NotificationTypeEnum.SYSTEM,
          title: 'T',
          body: 'B',
          idBusiness: 99,
        },
        { path: '/b', businessId: 99 },
      );
      expect(gatewayMock.emitToBusiness).toHaveBeenCalledWith(99, loaded);
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.createAndDispatch(
          {
            type: NotificationTypeEnum.INFO,
            title: 'T',
            body: 'B',
          },
          userReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('markAsReadForUser', () => {
    it('updates readAt on the row', async () => {
      const row = {
        id: 3,
        type: NotificationTypeEnum.INFO,
        title: 't',
        body: 'b',
      } as Notification;
      const updated = { ...row, readAt: new Date() } as Notification;
      gettersMock.findOneForUserOrFail.mockResolvedValue(row);
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      const result = await service.markAsReadForUser(1, 3, userReq);
      expect(result.readAt).toBeDefined();
    });
  });

  describe('markAsReadForBusiness', () => {
    it('updates readAt for business-scoped row', async () => {
      const row = { id: 4 } as Notification;
      const updated = { ...row, readAt: new Date() } as Notification;
      gettersMock.findOneForBusinessOrFail.mockResolvedValue(row);
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      const businessReq = { path: '/b', businessId: 7 };
      await service.markAsReadForBusiness(7, 4, businessReq);
      expect(repositoryMock.update).toHaveBeenCalled();
    });
  });
});
