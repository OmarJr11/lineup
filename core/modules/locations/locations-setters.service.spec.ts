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
import { LocationsSettersService } from './locations-setters.service';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { Location } from '../../entities';
import { StatusEnum } from '../../common/enums';

/**
 * Unit tests for {@link LocationsSettersService}.
 */
describe('LocationsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'name' },
        { propertyName: 'lat' },
        { propertyName: 'lng' },
        { propertyName: 'address' },
        { propertyName: 'formattedAddress' },
        { propertyName: 'status' },
        { propertyName: 'idCreationBusiness' },
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
  const entityAuditsQueueMock = {
    addRecordJob: jest.fn(),
  };
  let service: LocationsSettersService;
  const businessReq = { path: '/b', businessId: 1 };

  beforeEach(async () => {
    jest.clearAllMocks();
    entityAuditsQueueMock.addRecordJob.mockResolvedValue(undefined);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsSettersService,
        {
          provide: getRepositoryToken(Location),
          useValue: repositoryMock,
        },
        {
          provide: EntityAuditsQueueService,
          useValue: entityAuditsQueueMock,
        },
      ],
    }).compile();
    service = moduleRef.get(LocationsSettersService);
  });

  describe('create', () => {
    it('saves and enqueues audit', async () => {
      const saved = {
        id: 10,
        name: 'HQ',
        lat: 10,
        lng: -66,
        address: 'a',
        formattedAddress: 'fa',
        idCreationBusiness: 1,
      } as Location;
      repositoryMock.save.mockResolvedValue(saved);
      const data = {
        name: 'HQ',
        lat: 10,
        lng: -66,
        address: 'a',
        formattedAddress: 'fa',
      };
      const result = await service.create(data, businessReq);
      expect(result).toBe(saved);
      expect(entityAuditsQueueMock.addRecordJob).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            name: 'X',
            lat: 0,
            lng: 0,
            address: 'a',
            formattedAddress: 'f',
          },
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity and enqueues audit', async () => {
      const location = {
        id: 3,
        name: 'Old',
        lat: 1,
        lng: 2,
        address: 'x',
        formattedAddress: 'y',
        idCreationBusiness: 1,
        status: StatusEnum.ACTIVE,
      } as Location;
      const updated = { ...location, name: 'New' } as Location;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      const result = await service.update(
        location,
        { id: 3, name: 'New' },
        businessReq,
      );
      expect(result.name).toBe('New');
      expect(entityAuditsQueueMock.addRecordJob).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('enqueues delete audit and soft-deletes', async () => {
      const location = { id: 4 } as Location;
      const deleted = { ...location, status: StatusEnum.DELETED } as Location;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(deleted);
      await expect(service.remove(location, businessReq)).resolves.toBe(true);
      expect(entityAuditsQueueMock.addRecordJob).toHaveBeenCalled();
    });
  });
});
