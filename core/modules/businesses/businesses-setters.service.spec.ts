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

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessesSettersService } from './businesses-setters.service';
import { BusinessRolesService } from '../business-roles/business-roles.service';
import { RolesService } from '../roles/roles.service';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { Business } from '../../entities';
import { RolesCodesEnum } from '../../common/enums';
import { CreateBusinessInput } from './dto/create-business.input';

/**
 * Unit tests for {@link BusinessesSettersService}.
 */
describe('BusinessesSettersService', () => {
  const repositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const businessRolesServiceMock = {
    create: jest.fn(),
  };
  const rolesServiceMock = {
    findByCode: jest.fn(),
  };
  const entityAuditsQueueServiceMock = {
    addRecordJob: jest.fn(),
  };
  let service: BusinessesSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesSettersService,
        {
          provide: getRepositoryToken(Business),
          useValue: repositoryMock,
        },
        {
          provide: BusinessRolesService,
          useValue: businessRolesServiceMock,
        },
        { provide: RolesService, useValue: rolesServiceMock },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessesSettersService);
  });

  describe('create', () => {
    it('throws BadRequestException when email already exists', async () => {
      repositoryMock.findOne.mockResolvedValue({ id: 1 } as Business);
      const data: CreateBusinessInput = {
        email: 'dup@test.com',
        name: 'N',
        password: 'x',
        role: RolesCodesEnum.BUSINESS,
      };
      await expect(service.create(data)).rejects.toThrow(BadRequestException);
      expect(repositoryMock.save).not.toHaveBeenCalled();
    });

    it('creates business successfully when email is unique', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      const savedBusiness = {
        id: 10,
        email: 'new@test.com',
        name: 'N',
      } as Business;
      repositoryMock.save.mockResolvedValue(savedBusiness);

      const data: CreateBusinessInput = {
        email: 'new@test.com',
        name: 'N',
        password: 'x',
        role: RolesCodesEnum.BUSINESS,
      };

      const result = await service.create(data);
      expect(result).toBeDefined();
      expect(repositoryMock.save).toHaveBeenCalled();
    });

    it('throws BadRequestException on pgCode 23505 email constraint violation', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.save.mockRejectedValue({
        code: '23505',
        constraint: 'UQ_business_email',
      });

      const data: CreateBusinessInput = {
        email: 'new@test.com',
        name: 'N',
        password: 'x',
        role: RolesCodesEnum.BUSINESS,
      };

      await expect(service.create(data)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException on pgCode 23505 path constraint violation', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.save.mockRejectedValue({
        code: '23505',
        constraint: 'UQ_business_path',
      });

      const data: CreateBusinessInput = {
        email: 'new@test.com',
        name: 'N',
        password: 'x',
        role: RolesCodesEnum.BUSINESS,
      };

      await expect(service.create(data)).rejects.toThrow(BadRequestException);
    });

    it('throws InternalServerErrorException on generic error during create', async () => {
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.save.mockRejectedValue(new Error('DB failure'));

      const data: CreateBusinessInput = {
        email: 'new@test.com',
        name: 'N',
        password: 'x',
        role: RolesCodesEnum.BUSINESS,
      };

      await expect(service.create(data)).rejects.toThrow();
    });
  });

  describe('seedBusiness', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('throws BadRequestException when environment is not development', async () => {
      process.env.NODE_ENV = 'production';
      await expect(
        service.seedBusiness({ email: 'seed@test.com' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns null if business already exists', async () => {
      process.env.NODE_ENV = 'development';
      repositoryMock.findOne.mockResolvedValue({ id: 1 } as Business);

      const result = await service.seedBusiness({
        email: 'seed@test.com',
      } as any);
      expect(result).toBeNull();
    });

    it('seeds business successfully in development environment', async () => {
      process.env.NODE_ENV = 'development';
      repositoryMock.findOne.mockResolvedValue(null);
      const savedBusiness = {
        id: 99,
        email: 'seed@test.com',
        path: '/seed',
        password: 'hash',
      } as Business;
      repositoryMock.save.mockResolvedValue(savedBusiness);
      rolesServiceMock.findByCode.mockResolvedValue({
        id: 2,
        code: RolesCodesEnum.BUSINESS,
      });
      businessRolesServiceMock.create.mockResolvedValue({});

      const result = await service.seedBusiness({
        email: 'seed@test.com',
        telephone: '12345',
        name: 'Seed Corp',
        path: '/seed',
      } as any);

      expect(result).toBeDefined();
      expect(rolesServiceMock.findByCode).toHaveBeenCalledWith(
        RolesCodesEnum.BUSINESS,
      );
      expect(businessRolesServiceMock.create).toHaveBeenCalledWith(99, 2, {
        businessId: 99,
        path: '/seed',
      });
      expect(result?.password).toBeUndefined();
    });

    it('throws InternalServerErrorException when save or role creation fails during seed', async () => {
      process.env.NODE_ENV = 'development';
      repositoryMock.findOne.mockResolvedValue(null);
      repositoryMock.save.mockRejectedValue(new Error('Seed failed'));

      await expect(
        service.seedBusiness({ email: 'seed@test.com' } as any),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates business and records audit job', async () => {
      const existing = { id: 1, name: 'Old', path: '/old' } as Business;
      const updated = { id: 1, name: 'New', path: '/old' } as Business;
      jest.spyOn(service as any, 'updateEntity').mockResolvedValue(updated);
      entityAuditsQueueServiceMock.addRecordJob.mockResolvedValue(undefined);

      const result = await service.update({ name: 'New' } as any, existing, {
        businessId: 1,
        path: '/old',
      } as any);

      expect(result).toEqual(updated);
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException on update error', async () => {
      const existing = { id: 1, name: 'Old' } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockRejectedValue(new Error('err'));

      await expect(
        service.update({ name: 'New' } as any, existing, {
          businessId: 1,
        } as any),
      ).rejects.toThrow();
    });
  });

  describe('updateEmail', () => {
    it('updates email and returns updated business', async () => {
      const existing = { id: 1, email: 'old@test.com' } as Business;
      const updated = { id: 1, email: 'new@test.com' } as Business;
      jest.spyOn(service as any, 'updateEntity').mockResolvedValue(updated);

      const result = await service.updateEmail(existing, 'new@test.com', {
        businessId: 1,
        path: '/p',
      } as any);

      expect(result).toEqual(updated);
    });

    it('throws InternalServerErrorException on error', async () => {
      const existing = { id: 1 } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockRejectedValue(new Error('err'));

      await expect(
        service.updateEmail(existing, 'fail@test.com', {
          businessId: 1,
        } as any),
      ).rejects.toThrow();
    });
  });

  describe('updatePassword', () => {
    it('updates password and returns updated business', async () => {
      const existing = { id: 1 } as Business;
      const updated = { id: 1, password: 'newHash' } as Business;
      jest.spyOn(service as any, 'updateEntity').mockResolvedValue(updated);

      const result = await service.updatePassword(existing, 'newHash', {
        businessId: 1,
        path: '/p',
      } as any);

      expect(result).toEqual(updated);
    });

    it('throws InternalServerErrorException on error', async () => {
      const existing = { id: 1 } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockRejectedValue(new Error('err'));

      await expect(
        service.updatePassword(existing, 'fail', { businessId: 1 } as any),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('records audit job and deletes entity by status', async () => {
      const existing = { id: 1, name: 'Del' } as Business;
      entityAuditsQueueServiceMock.addRecordJob.mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'deleteEntityByStatus')
        .mockResolvedValue({ affected: 1 });

      const result = await service.remove(existing, {
        businessId: 1,
        path: '/p',
      } as any);
      expect(result).toBeDefined();
      expect(entityAuditsQueueServiceMock.addRecordJob).toHaveBeenCalled();
    });

    it('throws InternalServerErrorException on delete error', async () => {
      const existing = { id: 1 } as Business;
      entityAuditsQueueServiceMock.addRecordJob.mockRejectedValue(
        new Error('fail'),
      );

      await expect(
        service.remove(existing, { businessId: 1, path: '/p' } as any),
      ).rejects.toThrow();
    });
  });

  describe('followers and visits counters', () => {
    it('increments followers', async () => {
      const existing = { id: 1, followers: 5 } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockResolvedValue({ ...existing, followers: 6 });

      const result = await service.incrementFollowers(existing, {
        userId: 10,
      } as any);
      expect(result).toBeDefined();
    });

    it('throws on increment followers error', async () => {
      const existing = { id: 1, followers: 5 } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockRejectedValue(new Error('err'));

      await expect(
        service.incrementFollowers(existing, { userId: 10 } as any),
      ).rejects.toThrow();
    });

    it('decrements followers', async () => {
      const existing = { id: 1, followers: 5 } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockResolvedValue({ ...existing, followers: 4 });

      const result = await service.decrementFollowers(existing, {
        userId: 10,
      } as any);
      expect(result).toBeDefined();
    });

    it('throws on decrement followers error', async () => {
      const existing = { id: 1, followers: 5 } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockRejectedValue(new Error('err'));

      await expect(
        service.decrementFollowers(existing, { userId: 10 } as any),
      ).rejects.toThrow();
    });

    it('increments visits', async () => {
      const existing = { id: 1, visits: 10, path: '/p' } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockResolvedValue({ ...existing, visits: 11 });

      const result = await service.incrementVisits(existing);
      expect(result).toBeDefined();
    });

    it('throws on increment visits error', async () => {
      const existing = { id: 1, visits: 10, path: '/p' } as Business;
      jest
        .spyOn(service as any, 'updateEntity')
        .mockRejectedValue(new Error('err'));

      await expect(service.incrementVisits(existing)).rejects.toThrow();
    });
  });
});
