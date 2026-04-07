jest.mock('typeorm-transactional-cls-hooked/dist/Transactional', () => ({
  Transactional:
    () =>
    (
      _target: object,
      _propertyKey: string | symbol,
      descriptor: PropertyDescriptor,
    ): PropertyDescriptor =>
      descriptor,
}));

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn(),
}));

import * as argon2 from 'argon2';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotAcceptableException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { BusinessesService } from './businesses.service';
import { BusinessesGettersService } from './businesses-getters.service';
import { BusinessesSettersService } from './businesses-setters.service';
import { RolesService } from '../roles/roles.service';
import { BusinessRolesService } from '../business-roles/business-roles.service';
import { Business } from '../../entities';
import { QueueNamesEnum } from '../../common/enums/consumers';
import {
  NotificationContentScenarioEnum,
  NotificationTypeEnum,
  ProvidersEnum,
  RolesCodesEnum,
  SearchDataConsumerEnum,
} from '../../common/enums';
import { NotificationsConsumerEnum } from '../../common/enums/consumers/notifications.consumer.enum';
import type { CreateBusinessInput } from './dto/create-business.input';

/**
 * Unit tests for {@link BusinessesService}.
 */
describe('BusinessesService', () => {
  const businessesGettersServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findOneByPath: jest.fn(),
    getOneByPath: jest.fn(),
    findOneByIdWithPassword: jest.fn(),
    validateBusinessEmailUnique: jest.fn(),
  };
  const businessesSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    updatePassword: jest.fn(),
    remove: jest.fn(),
  };
  const rolesServiceMock = {
    findByCode: jest.fn(),
  };
  const businessRolesServiceMock = {
    create: jest.fn(),
  };
  const searchDataQueueMock = {
    add: jest.fn(),
  };
  const notificationsQueueMock = {
    add: jest.fn(),
  };
  let service: BusinessesService;
  const argon2VerifyMock = argon2.verify as jest.MockedFunction<
    typeof argon2.verify
  >;

  beforeEach(async () => {
    jest.clearAllMocks();
    argon2VerifyMock.mockReset();
    businessesGettersServiceMock.getOneByPath.mockResolvedValue(null);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(Business),
          useValue: {},
        },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersServiceMock,
        },
        {
          provide: BusinessesSettersService,
          useValue: businessesSettersServiceMock,
        },
        { provide: RolesService, useValue: rolesServiceMock },
        {
          provide: BusinessRolesService,
          useValue: businessRolesServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.searchData),
          useValue: searchDataQueueMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.notifications),
          useValue: notificationsQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessesService);
  });

  describe('findOne', () => {
    it('throws when id is falsy', async () => {
      await expect(service.findOne(0)).rejects.toThrow(NotAcceptableException);
      expect(businessesGettersServiceMock.findOne).not.toHaveBeenCalled();
    });
    it('delegates to getters when id is valid', async () => {
      const b = { id: 1 } as Business;
      businessesGettersServiceMock.findOne.mockResolvedValue(b);
      await expect(service.findOne(1)).resolves.toBe(b);
    });
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const list: Business[] = [];
      businessesGettersServiceMock.findAll.mockResolvedValue(list);
      const q = { page: 1, limit: 10 };
      await expect(service.findAll(q)).resolves.toBe(list);
      expect(businessesGettersServiceMock.findAll).toHaveBeenCalledWith(q);
    });
  });

  describe('findOneByPath', () => {
    it('delegates to getters', async () => {
      const b = { id: 2 } as Business;
      businessesGettersServiceMock.findOneByPath.mockResolvedValue(b);
      await expect(service.findOneByPath('shop')).resolves.toBe(b);
    });
  });

  describe('checkBusinessPathExists', () => {
    it('returns the path when it is unused', async () => {
      businessesGettersServiceMock.getOneByPath.mockResolvedValue(null);
      await expect(service.checkBusinessPathExists('unique')).resolves.toBe(
        'unique',
      );
    });
    it('appends a numeric suffix until the path is free', async () => {
      businessesGettersServiceMock.getOneByPath
        .mockResolvedValueOnce({ id: 1 } as Business)
        .mockResolvedValueOnce(null);
      await expect(service.checkBusinessPathExists('taken')).resolves.toBe(
        'taken-01',
      );
    });
  });

  describe('create', () => {
    it('hashes password, creates business, assigns role, enqueues search', async () => {
      const created = {
        id: 50,
        path: 'my-biz',
        email: 'a@b.com',
        password: 'hashed-password',
      } as Business;
      businessesSettersServiceMock.create.mockImplementation(async (data) => {
        return { ...created, ...data, password: 'hashed-password' } as Business;
      });
      rolesServiceMock.findByCode.mockResolvedValue({ id: 7 } as never);
      businessRolesServiceMock.create.mockResolvedValue(undefined);
      const input: CreateBusinessInput = {
        email: 'A@B.COM',
        name: 'My Biz',
        password: 'secret',
        role: RolesCodesEnum.BUSINESS,
      };
      const result = await service.create(input, ProvidersEnum.GOOGLE);
      expect(input.email).toBe('a@b.com');
      expect(rolesServiceMock.findByCode).toHaveBeenCalledWith(
        RolesCodesEnum.BUSINESS,
      );
      expect(businessRolesServiceMock.create).toHaveBeenCalledWith(
        50,
        7,
        expect.objectContaining({ businessId: 50, path: 'my-biz' }),
      );
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataBusiness,
        { idBusiness: 50 },
      );
      expect(result.password).toBeUndefined();
    });
  });

  describe('update', () => {
    it('throws when new path is taken by another business', async () => {
      const existing = { id: 1, path: 'old' } as Business;
      businessesGettersServiceMock.findOne.mockResolvedValue(existing);
      businessesGettersServiceMock.getOneByPath.mockResolvedValue({
        id: 99,
      } as Business);
      await expect(
        service.update({ id: 1, path: 'new-path' } as never, {
          businessId: 1,
          path: 'old',
        }),
      ).rejects.toThrow(NotAcceptableException);
      expect(businessesSettersServiceMock.update).not.toHaveBeenCalled();
    });
  });

  describe('updateEmail', () => {
    it('validates uniqueness then delegates to setters', async () => {
      const b = { id: 3 } as Business;
      businessesGettersServiceMock.findOne.mockResolvedValue(b);
      businessesGettersServiceMock.validateBusinessEmailUnique.mockResolvedValue(
        undefined,
      );
      businessesSettersServiceMock.updateEmail.mockResolvedValue(undefined);
      const businessReq = { businessId: 3, path: '/p' };
      await service.updateEmail({ email: 'n@n.com' }, businessReq);
      expect(
        businessesGettersServiceMock.validateBusinessEmailUnique,
      ).toHaveBeenCalledWith('n@n.com', 3);
      expect(businessesSettersServiceMock.updateEmail).toHaveBeenCalledWith(
        b,
        'n@n.com',
        businessReq,
      );
    });
  });

  describe('changePassword', () => {
    it('throws when current password is wrong', async () => {
      argon2VerifyMock.mockResolvedValue(false);
      businessesGettersServiceMock.findOneByIdWithPassword.mockResolvedValue({
        id: 1,
        password: 'hash',
      } as Business);
      await expect(
        service.changePassword(
          { currentPassword: 'bad', newPassword: 'new1' } as never,
          { businessId: 1, path: '/' },
        ),
      ).rejects.toThrow(NotAcceptableException);
    });
    it('updates password and enqueues notification when valid', async () => {
      argon2VerifyMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      businessesGettersServiceMock.findOneByIdWithPassword.mockResolvedValue({
        id: 1,
        password: 'hash',
      } as Business);
      businessesSettersServiceMock.updatePassword.mockResolvedValue(undefined);
      const ok = await service.changePassword(
        { currentPassword: 'old', newPassword: 'new2' } as never,
        { businessId: 1, path: '/shop' },
      );
      expect(ok).toBe(true);
      expect(notificationsQueueMock.add).toHaveBeenCalledWith(
        NotificationsConsumerEnum.CreateForBusiness,
        expect.objectContaining({
          scenario: NotificationContentScenarioEnum.BUSINESS_CHANGE_PASSWORD,
          type: NotificationTypeEnum.WARNING,
        }),
      );
    });
  });

  describe('remove', () => {
    it('loads business and delegates to setters', async () => {
      const b = { id: 8 } as Business;
      businessesGettersServiceMock.findOne.mockResolvedValue(b);
      businessesSettersServiceMock.remove.mockResolvedValue(undefined);
      const businessReq = { businessId: 8, path: '/' };
      await expect(service.remove(8, businessReq)).resolves.toBe(true);
      expect(businessesSettersServiceMock.remove).toHaveBeenCalledWith(
        b,
        businessReq,
      );
    });
  });
});
