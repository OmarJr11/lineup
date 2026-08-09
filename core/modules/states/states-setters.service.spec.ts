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
import { StatesSettersService } from './states-setters.service';
import { State } from '../../entities';
import { StatusEnum } from '../../common/enums';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link StatesSettersService}.
 */
describe('StatesSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    update: jest.fn(),
    findOneOrFail: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'name' },
        { propertyName: 'code' },
        { propertyName: 'capital' },
        { propertyName: 'status' },
        { propertyName: 'idCreationUser' },
      ],
    },
  };
  let service: StatesSettersService;
  const userReq: IUserReq = { userId: 7, username: 'admin' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StatesSettersService,
        {
          provide: getRepositoryToken(State),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(StatesSettersService);
  });

  describe('create', () => {
    it('persists via save', async () => {
      const saved = { id: 10, name: 'Nuevo León' } as State;
      repositoryMock.save.mockResolvedValue(saved);
      const data = {
        name: 'Nuevo León',
        code: 'MX-NL',
        capital: 'Monterrey',
      };
      await expect(service.create(data, userReq)).resolves.toBe(saved);
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create({ name: 'X', code: 'Y', capital: 'Z' }, userReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('update', () => {
    it('updates entity via updateEntity', async () => {
      const state = { id: 4, name: 'Old' } as State;
      const updated = { id: 4, name: 'New' } as State;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(updated);
      await expect(
        service.update({ id: 4, name: 'New' }, state, userReq),
      ).resolves.toBe(updated);
    });
  });

  describe('remove', () => {
    it('soft-deletes via status update', async () => {
      const state = { id: 6 } as State;
      const reloaded = {
        ...state,
        status: StatusEnum.DELETED,
      } as State;
      repositoryMock.update.mockResolvedValue(undefined);
      repositoryMock.findOneOrFail.mockResolvedValue(reloaded);
      await expect(service.remove(state, userReq)).resolves.toBeUndefined();
    });
  });
});
