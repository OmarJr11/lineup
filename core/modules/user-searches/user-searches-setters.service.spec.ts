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
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSearchesSettersService } from './user-searches-setters.service';
import { UserSearch } from '../../entities';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link UserSearchesSettersService}.
 */
describe('UserSearchesSettersService', () => {
  let service: UserSearchesSettersService;
  const saveMock = jest.fn();
  const userReq: IUserReq = { userId: 3, username: 'tester' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserSearchesSettersService,
        {
          provide: getRepositoryToken(UserSearch),
          useValue: {
            save: saveMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(UserSearchesSettersService);
  });

  describe('create', () => {
    it('returns null without saving when term is empty', async () => {
      const result = await service.create('   ', userReq);
      expect(result).toBeNull();
      expect(saveMock).not.toHaveBeenCalled();
    });

    it('saves trimmed search term', async () => {
      saveMock.mockResolvedValue({ id: 1 } as UserSearch);
      await service.create('  shoes  ', userReq);
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({
          idCreationUser: 3,
          creationUser: 3,
          searchTerm: 'shoes',
        }),
        { data: userReq },
      );
    });

    it('returns null when save throws', async () => {
      saveMock.mockRejectedValue(new Error('db'));
      const result = await service.create('ok', userReq);
      expect(result).toBeNull();
    });
  });
});
