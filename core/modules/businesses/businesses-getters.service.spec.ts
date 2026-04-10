import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessesGettersService } from './businesses-getters.service';
import { Business } from '../../entities';

/**
 * Unit tests for {@link BusinessesGettersService}.
 */
describe('BusinessesGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
  };
  let service: BusinessesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesGettersService,
        {
          provide: getRepositoryToken(Business),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessesGettersService);
  });

  describe('findByIds', () => {
    it('returns empty array when ids is empty', async () => {
      await expect(service.findByIds([])).resolves.toEqual([]);
      expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
