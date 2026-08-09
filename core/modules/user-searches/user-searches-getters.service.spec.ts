import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSearch } from '../../entities';
import { UserSearchesGettersService } from './user-searches-getters.service';

/**
 * Unit tests for {@link UserSearchesGettersService}.
 */
describe('UserSearchesGettersService', () => {
  let service: UserSearchesGettersService;
  const queryMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserSearchesGettersService,
        {
          provide: getRepositoryToken(UserSearch),
          useValue: {
            query: queryMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(UserSearchesGettersService);
  });

  describe('findRecentSearchTerms', () => {
    it('maps raw rows to unique terms capped by limit', async () => {
      queryMock.mockResolvedValue([
        { search_term: 'Zebra' },
        { search_term: 'apple' },
      ]);
      const terms = await service.findRecentSearchTerms(7, 2);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('DISTINCT ON'),
        [7, 6],
      );
      expect(terms.length).toBeLessThanOrEqual(2);
    });
  });
});
