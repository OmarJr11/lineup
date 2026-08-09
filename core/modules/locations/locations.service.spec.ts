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
import { LocationsService } from './locations.service';
import { LocationsGettersService } from './locations-getters.service';
import { LocationsSettersService } from './locations-setters.service';
import { Location } from '../../entities';

/**
 * Unit tests for {@link LocationsService}.
 */
describe('LocationsService', () => {
  const gettersMock = {
    findAllMyLocations: jest.fn(),
    findOne: jest.fn(),
  };
  const settersMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  let service: LocationsService;
  const businessReq = { path: '/b', businessId: 2 };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(Location),
          useValue: {},
        },
        {
          provide: LocationsGettersService,
          useValue: gettersMock,
        },
        {
          provide: LocationsSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(LocationsService);
  });

  describe('create', () => {
    it('creates then reloads by id', async () => {
      const created = { id: 7, name: 'A' } as Location;
      const loaded = { id: 7, name: 'A', lat: 1 } as Location;
      settersMock.create.mockResolvedValue(created);
      gettersMock.findOne.mockResolvedValue(loaded);
      const data = {
        name: 'A',
        lat: 1,
        lng: 2,
        address: 'x',
        formattedAddress: 'y',
      };
      const result = await service.create(data, businessReq);
      expect(settersMock.create).toHaveBeenCalledWith(data, businessReq);
      expect(gettersMock.findOne).toHaveBeenCalledWith(7);
      expect(result).toBe(loaded);
    });
  });

  describe('findAllMyLocations', () => {
    it('delegates to getters', async () => {
      const list: Location[] = [];
      gettersMock.findAllMyLocations.mockResolvedValue(list);
      await expect(service.findAllMyLocations(businessReq)).resolves.toBe(
        list,
      );
    });
  });

  describe('findOne', () => {
    it('delegates to getters', async () => {
      const loc = { id: 1 } as Location;
      gettersMock.findOne.mockResolvedValue(loc);
      await expect(service.findOne(1)).resolves.toBe(loc);
    });
  });

  describe('update', () => {
    it('loads entity, updates, returns reloaded row', async () => {
      const location = { id: 5, name: 'Old' } as Location;
      const reloaded = { id: 5, name: 'New' } as Location;
      gettersMock.findOne
        .mockResolvedValueOnce(location)
        .mockResolvedValueOnce(reloaded);
      settersMock.update.mockResolvedValue(undefined);
      const data = { id: 5, name: 'New' };
      const result = await service.update(data, businessReq);
      expect(gettersMock.findOne).toHaveBeenCalledWith(5);
      expect(settersMock.update).toHaveBeenCalledWith(
        location,
        data,
        businessReq,
      );
      expect(result).toBe(reloaded);
    });
  });

  describe('remove', () => {
    it('loads entity, removes, returns true', async () => {
      const location = { id: 8 } as Location;
      gettersMock.findOne.mockResolvedValue(location);
      settersMock.remove.mockResolvedValue(true);
      await expect(service.remove(8, businessReq)).resolves.toBe(true);
      expect(settersMock.remove).toHaveBeenCalledWith(location, businessReq);
    });
  });
});
