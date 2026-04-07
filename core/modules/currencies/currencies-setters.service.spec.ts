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
import { CurrenciesSettersService } from './currencies-setters.service';
import { Currency } from '../../entities';
import { StatusEnum } from '../../common/enums';

/**
 * Unit tests for {@link CurrenciesSettersService}.
 */
describe('CurrenciesSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'name' },
        { propertyName: 'code' },
        { propertyName: 'idCreationUser' },
        { propertyName: 'status' },
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
  let service: CurrenciesSettersService;
  const userReq = { userId: 1, username: 'u1' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesSettersService,
        {
          provide: getRepositoryToken(Currency),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CurrenciesSettersService);
  });

  describe('create', () => {
    it('persists via save and returns the row', async () => {
      const created = {
        id: 5,
        name: 'Dollar',
        code: 'USD',
        idCreationUser: 1,
      } as Currency;
      repositoryMock.save.mockResolvedValue(created);
      const result = await service.create(
        { name: 'Dollar', code: 'USD' },
        userReq,
      );
      expect(result).toBe(created);
      expect(repositoryMock.save).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create({ name: 'X', code: 'XX' }, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity and returns refreshed row', async () => {
      const currency = {
        id: 3,
        name: 'Old',
        code: 'OLD',
        idCreationUser: 1,
        status: StatusEnum.ACTIVE,
      } as Currency;
      const updated = { ...currency, name: 'New' } as Currency;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      const result = await service.update(
        { id: 3, name: 'New' },
        currency,
        userReq,
      );
      expect(repositoryMock.update).toHaveBeenCalled();
      expect(result.name).toBe('New');
    });
    it('throws InternalServerErrorException when update fails', async () => {
      const currency = { id: 1 } as Currency;
      repositoryMock.update.mockRejectedValue(new Error('db'));
      await expect(
        service.update({ id: 1, name: 'N' }, currency, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('remove', () => {
    it('soft-deletes via updateEntity path', async () => {
      const currency = {
        id: 9,
        name: 'Temp',
        code: 'TMP',
      } as Currency;
      const deleted = {
        ...currency,
        status: StatusEnum.DELETED,
      } as Currency;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(deleted);
      await service.remove(currency, userReq);
      expect(repositoryMock.update).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when delete path fails', async () => {
      repositoryMock.update.mockRejectedValue(new Error('db'));
      await expect(
        service.remove({ id: 1 } as Currency, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
