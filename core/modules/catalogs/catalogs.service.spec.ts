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
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { CatalogsService } from './catalogs.service';
import { CatalogsGettersService } from './catalogs-getters.service';
import { CatalogsSettersService } from './catalogs-setters.service';
import { Catalog } from '../../entities';
import {
  QueueNamesEnum,
  SearchDataConsumerEnum,
} from '../../common/enums/consumers';

/**
 * Unit tests for {@link CatalogsService}.
 */
describe('CatalogsService', () => {
  const catalogsSettersServiceMock = {
    generatePathFromTitle: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    checkCatalogPathExists: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAllMyCatalogs: jest.fn(),
    findAllByBusinessId: jest.fn(),
    getOneByPathOrFail: jest.fn(),
  };
  const searchDataQueueMock = {
    add: jest.fn(),
  };
  let service: CatalogsService;
  const businessReq = { businessId: 5, path: '/shop' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogsService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(Catalog),
          useValue: {},
        },
        {
          provide: CatalogsSettersService,
          useValue: catalogsSettersServiceMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersServiceMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.searchData),
          useValue: searchDataQueueMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(CatalogsService);
  });

  describe('create', () => {
    it('resolves path via checkCatalogPathExists when omitted, then enqueues search', async () => {
      catalogsSettersServiceMock.generatePathFromTitle.mockReturnValue(
        'my-catalog',
      );
      catalogsGettersServiceMock.checkCatalogPathExists.mockResolvedValue(
        'my-catalog-01',
      );
      catalogsSettersServiceMock.create.mockResolvedValue({
        id: 10,
        path: 'my-catalog-01',
      } as Catalog);
      const loaded = { id: 10, title: 'T' } as Catalog;
      catalogsGettersServiceMock.findOne.mockResolvedValue(loaded);
      const data = { title: 'My Catalog' } as never;
      const result = await service.create(data, businessReq);
      expect(
        catalogsGettersServiceMock.checkCatalogPathExists,
      ).toHaveBeenCalledWith('my-catalog');
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataCatalog,
        { idCatalog: 10 },
      );
      expect(result).toBe(loaded);
    });
    it('keeps explicit path without calling checkCatalogPathExists', async () => {
      catalogsSettersServiceMock.generatePathFromTitle.mockReturnValue(
        'ignored',
      );
      catalogsSettersServiceMock.create.mockResolvedValue({
        id: 2,
        path: 'fixed',
      } as Catalog);
      catalogsGettersServiceMock.findOne.mockResolvedValue({
        id: 2,
      } as Catalog);
      await service.create({ title: 'T', path: 'fixed' } as never, businessReq);
      expect(
        catalogsGettersServiceMock.checkCatalogPathExists,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const list: Catalog[] = [];
      catalogsGettersServiceMock.findAll.mockResolvedValue(list);
      const q = { page: 1, limit: 5 };
      await expect(service.findAll(q)).resolves.toBe(list);
      expect(catalogsGettersServiceMock.findAll).toHaveBeenCalledWith(q);
    });
  });

  describe('findOne', () => {
    it('delegates to getters', async () => {
      const c = { id: 1 } as Catalog;
      catalogsGettersServiceMock.findOne.mockResolvedValue(c);
      await expect(service.findOne(1)).resolves.toBe(c);
    });
  });

  describe('findOneByPath', () => {
    it('delegates to getOneByPathOrFail', async () => {
      const c = { id: 3 } as Catalog;
      catalogsGettersServiceMock.getOneByPathOrFail.mockResolvedValue(c);
      await expect(service.findOneByPath('abc')).resolves.toBe(c);
    });
  });

  describe('update', () => {
    it('recomputes path when title changes and enqueues search', async () => {
      const catalog = { id: 8, title: 'Old' } as Catalog;
      catalogsGettersServiceMock.findOne.mockResolvedValueOnce(catalog);
      catalogsSettersServiceMock.generatePathFromTitle.mockReturnValue(
        'new-slug',
      );
      catalogsGettersServiceMock.checkCatalogPathExists.mockResolvedValue(
        'new-slug-01',
      );
      catalogsSettersServiceMock.update.mockResolvedValue(undefined);
      catalogsGettersServiceMock.findOne.mockResolvedValueOnce({
        ...catalog,
        title: 'New',
      } as Catalog);
      const data = { idCatalog: 8, title: 'New' } as never;
      await service.update(data, businessReq);
      expect(
        catalogsGettersServiceMock.checkCatalogPathExists,
      ).toHaveBeenCalledWith('new-slug', 8);
      expect(searchDataQueueMock.add).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataCatalog,
        { idCatalog: 8 },
      );
    });
  });

  describe('remove', () => {
    it('delegates to setters and returns removed entity', async () => {
      const catalog = { id: 4 } as Catalog;
      const removed = { id: 4, status: 'deleted' } as Catalog;
      catalogsGettersServiceMock.findOne.mockResolvedValue(catalog);
      catalogsSettersServiceMock.remove.mockResolvedValue(removed);
      await expect(service.remove(4, businessReq)).resolves.toBe(removed);
    });
  });
});
