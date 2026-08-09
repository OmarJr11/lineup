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
import { getRepositoryToken } from '@nestjs/typeorm';
import { CatalogVisitsSettersService } from './catalog-visits-setters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { CatalogsSettersService } from '../catalogs/catalogs-setters.service';
import type { Catalog, Business } from '../../entities';
import { CatalogVisit } from '../../entities';

/**
 * Unit tests for {@link CatalogVisitsSettersService}.
 */
describe('CatalogVisitsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    findOne: jest.fn(),
  };
  const catalogsSettersServiceMock = {
    incrementVisits: jest.fn(),
  };
  let service: CatalogVisitsSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.save.mockImplementation((entity: CatalogVisit) =>
      Promise.resolve(entity),
    );
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogVisitsSettersService,
        {
          provide: getRepositoryToken(CatalogVisit),
          useValue: repositoryMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersServiceMock,
        },
        {
          provide: CatalogsSettersService,
          useValue: catalogsSettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CatalogVisitsSettersService);
  });

  describe('create', () => {
    it('saves visit and increments catalog visits for logged-in user', async () => {
      const business = { path: '/biz' } as Business;
      const catalog = {
        id: 4,
        idCreationBusiness: 9,
        visits: 3,
        business,
      } as Catalog;
      catalogsGettersServiceMock.findOne.mockResolvedValue(catalog);
      await service.create({ idCatalog: 4 }, { userId: 1, username: 'u' });
      expect(catalogsGettersServiceMock.findOne).toHaveBeenCalledWith(4);
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(catalogsSettersServiceMock.incrementVisits).toHaveBeenCalledWith(
        catalog,
      );
    });
    it('records anonymous visits when user is null', async () => {
      const business = { path: '/b' } as Business;
      const catalog = {
        id: 4,
        idCreationBusiness: 9,
        visits: 0,
        business,
      } as Catalog;
      catalogsGettersServiceMock.findOne.mockResolvedValue(catalog);
      await service.create({ idCatalog: 4 }, null);
      expect(catalogsSettersServiceMock.incrementVisits).toHaveBeenCalledWith(
        catalog,
      );
    });
  });
});
