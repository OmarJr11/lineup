import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogsGettersService } from './catalogs-getters.service';
import { Catalog } from '../../entities';

/**
 * Unit tests for {@link CatalogsGettersService}.
 */
describe('CatalogsGettersService', () => {
  const repositoryMock = {
    createQueryBuilder: jest.fn(),
  };
  let service: CatalogsGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogsGettersService,
        {
          provide: getRepositoryToken(Catalog),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CatalogsGettersService);
  });

  describe('findByIds', () => {
    it('returns empty array when ids is empty', async () => {
      await expect(service.findByIds([])).resolves.toEqual([]);
      expect(repositoryMock.createQueryBuilder).not.toHaveBeenCalled();
    });
  });
});
