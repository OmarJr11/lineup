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
import { UserSearchesService } from './user-searches.service';
import { UserSearchesGettersService } from './user-searches-getters.service';
import { UserSearchesSettersService } from './user-searches-setters.service';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link UserSearchesService}.
 */
describe('UserSearchesService', () => {
  let service: UserSearchesService;
  const settersMock = { create: jest.fn() };
  const gettersMock = { findRecentSearchTerms: jest.fn() };
  const userReq: IUserReq = { userId: 1, username: 'u' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserSearchesService,
        { provide: UserSearchesSettersService, useValue: settersMock },
        { provide: UserSearchesGettersService, useValue: gettersMock },
      ],
    }).compile();
    service = moduleRef.get(UserSearchesService);
  });

  describe('recordSearch', () => {
    it('trims term and delegates to setters', async () => {
      settersMock.create.mockResolvedValue(undefined);
      await service.recordSearch('  hello  ', userReq);
      expect(settersMock.create).toHaveBeenCalledWith('hello', userReq);
    });
  });

  describe('getRecentSearchTerms', () => {
    it('delegates to getters with default limit', async () => {
      gettersMock.findRecentSearchTerms.mockResolvedValue(['a']);
      await expect(service.getRecentSearchTerms(4)).resolves.toEqual(['a']);
      expect(gettersMock.findRecentSearchTerms).toHaveBeenCalledWith(4, 5);
    });
  });
});
