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
import { getRepositoryToken } from '@nestjs/typeorm';
import { SocialNetworksService } from './social-networks.service';
import { SocialNetworksGettersService } from './social-networks-getters.service';
import { SocialNetworksSettersService } from './social-networks-setters.service';
import { SocialNetwork } from '../../entities';
import { SocialMediasEnum } from '../../common/enums';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link SocialNetworksService}.
 */
describe('SocialNetworksService', () => {
  const gettersMock = {
    findByCode: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  };
  const settersMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  let service: SocialNetworksService;
  const userReq: IUserReq = { userId: 7, username: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SocialNetworksService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(SocialNetwork),
          useValue: {},
        },
        {
          provide: SocialNetworksGettersService,
          useValue: gettersMock,
        },
        {
          provide: SocialNetworksSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(SocialNetworksService);
  });

  describe('create', () => {
    it('creates then reloads by id', async () => {
      const created = { id: 8, name: 'Ig' } as SocialNetwork;
      const loaded = { id: 8, name: 'Ig', code: SocialMediasEnum.INSTAGRAM } as SocialNetwork;
      settersMock.create.mockResolvedValue(created);
      gettersMock.findById.mockResolvedValue(loaded);
      const data = {
        name: 'Ig',
        code: SocialMediasEnum.INSTAGRAM,
        imageCode: 'x',
      };
      const result = await service.create(data, userReq);
      expect(settersMock.create).toHaveBeenCalledWith(data, userReq);
      expect(gettersMock.findById).toHaveBeenCalledWith(8);
      expect(result).toBe(loaded);
    });
  });

  describe('findByCode', () => {
    it('delegates to getters', async () => {
      const sn = { id: 1 } as SocialNetwork;
      gettersMock.findByCode.mockResolvedValue(sn);
      await expect(service.findByCode(SocialMediasEnum.FACEBOOK)).resolves.toBe(
        sn,
      );
    });
  });

  describe('findById', () => {
    it('delegates to getters', async () => {
      const sn = { id: 2 } as SocialNetwork;
      gettersMock.findById.mockResolvedValue(sn);
      await expect(service.findById(2)).resolves.toBe(sn);
    });
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const list: SocialNetwork[] = [];
      gettersMock.findAll.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toBe(list);
    });
  });

  describe('update', () => {
    it('loads entity, updates, returns reloaded row', async () => {
      const entity = { id: 5, name: 'A' } as SocialNetwork;
      const reloaded = { id: 5, name: 'B' } as SocialNetwork;
      gettersMock.findById
        .mockResolvedValueOnce(entity)
        .mockResolvedValueOnce(reloaded);
      settersMock.update.mockResolvedValue(undefined);
      const data = { id: 5, name: 'B' };
      const result = await service.update(data, userReq);
      expect(gettersMock.findById).toHaveBeenCalledWith(5);
      expect(settersMock.update).toHaveBeenCalledWith(data, entity, userReq);
      expect(result).toBe(reloaded);
    });
  });

  describe('remove', () => {
    it('loads entity, removes, returns true', async () => {
      const entity = { id: 9 } as SocialNetwork;
      gettersMock.findById.mockResolvedValue(entity);
      settersMock.remove.mockResolvedValue(undefined);
      await expect(service.remove(9, userReq)).resolves.toBe(true);
      expect(settersMock.remove).toHaveBeenCalledWith(entity, userReq);
    });
  });
});
