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
import { REQUEST } from '@nestjs/core';
import { NotAcceptableException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatesService } from './states.service';
import { StatesGettersService } from './states-getters.service';
import { StatesSettersService } from './states-setters.service';
import { State } from '../../entities';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link StatesService}.
 */
describe('StatesService', () => {
  const gettersMock = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    existsByName: jest.fn(),
    existsByCode: jest.fn(),
    existsByCapital: jest.fn(),
  };
  const settersMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  let service: StatesService;
  const userReq: IUserReq = { userId: 7, username: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    gettersMock.existsByName.mockResolvedValue(false);
    gettersMock.existsByCode.mockResolvedValue(false);
    gettersMock.existsByCapital.mockResolvedValue(false);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StatesService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(State),
          useValue: {},
        },
        {
          provide: StatesGettersService,
          useValue: gettersMock,
        },
        {
          provide: StatesSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = moduleRef.get(StatesService);
  });

  describe('create', () => {
    it('creates then reloads by id', async () => {
      const created = { id: 11, name: 'S' } as State;
      const loaded = { id: 11, name: 'S', code: 'C' } as State;
      settersMock.create.mockResolvedValue(created);
      gettersMock.findById.mockResolvedValue(loaded);
      const data = { name: 'S', code: 'C', capital: 'Cap' };
      const result = await service.create(data, userReq);
      expect(settersMock.create).toHaveBeenCalledWith(data, userReq);
      expect(gettersMock.findById).toHaveBeenCalledWith(11);
      expect(result).toBe(loaded);
    });
  });

  describe('findById', () => {
    it('delegates to getters', async () => {
      const s = { id: 1 } as State;
      gettersMock.findById.mockResolvedValue(s);
      await expect(service.findById(1)).resolves.toBe(s);
    });
  });

  describe('findByCode', () => {
    it('delegates to getters', async () => {
      const s = { id: 2 } as State;
      gettersMock.findByCode.mockResolvedValue(s);
      await expect(service.findByCode('X')).resolves.toBe(s);
    });
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const list: State[] = [];
      gettersMock.findAll.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toBe(list);
    });
  });

  describe('update', () => {
    it('validates uniqueness then updates and reloads', async () => {
      const state = { id: 5, name: 'A' } as State;
      const reloaded = { id: 5, name: 'B' } as State;
      gettersMock.findById
        .mockResolvedValueOnce(state)
        .mockResolvedValueOnce(reloaded);
      settersMock.update.mockResolvedValue(undefined);
      const data = { id: 5, name: 'B' };
      const result = await service.update(data, userReq);
      expect(gettersMock.existsByName).toHaveBeenCalledWith('B', 5);
      expect(settersMock.update).toHaveBeenCalledWith(data, state, userReq);
      expect(result).toBe(reloaded);
    });
    it('throws NotAcceptableException when name already exists', async () => {
      const state = { id: 5, name: 'A' } as State;
      gettersMock.findById.mockResolvedValue(state);
      gettersMock.existsByName.mockResolvedValue(true);
      await expect(
        service.update({ id: 5, name: 'Taken' }, userReq),
      ).rejects.toThrow(NotAcceptableException);
      expect(settersMock.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('loads state, removes, returns true', async () => {
      const state = { id: 8 } as State;
      gettersMock.findById.mockResolvedValue(state);
      settersMock.remove.mockResolvedValue(undefined);
      await expect(service.remove(8, userReq)).resolves.toBe(true);
      expect(settersMock.remove).toHaveBeenCalledWith(state, userReq);
    });
  });
});
