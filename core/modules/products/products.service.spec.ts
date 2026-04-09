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
import { ProductsService } from './products.service';
import { ProductsGettersService } from './products-getters.service';
import { ProductsSettersService } from './products-setters.service';
import { ProductTagsService } from '../product-tags/product-tags.service';
import { ProductFilesSettersService } from '../product-files/product-files-setters.service';
import { ProductFilesGettersService } from '../product-files/product-files-getters.service';
import { ProductVariationsSettersService } from '../product-variations/product-variations-setters.service';
import { ProductVariationsGettersService } from '../product-variations/product-variations-getters.service';
import { ProductSkusSettersService } from '../product-skus/product-skus-setters.service';
import { ProductSkusGettersService } from '../product-skus/product-skus-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { CatalogsSettersService } from '../catalogs/catalogs-setters.service';
import { FilesGettersService } from '../files/files-getters.service';
import { Product } from '../../entities';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductsService}.
 */
describe('ProductsService', () => {
  const productsGettersServiceMock = {
    findAll: jest.fn(),
    findOneWithRelations: jest.fn(),
    getAllByCatalog: jest.fn(),
    getAllByCatalogPaginated: jest.fn(),
    findAllByBusiness: jest.fn(),
    findAllByBusinessAndIsPrimary: jest.fn(),
    findAllByTag: jest.fn(),
    findAllByTags: jest.fn(),
    findOneByBusinessId: jest.fn(),
    findOne: jest.fn(),
  };
  const productsSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    queueForIdProduct: jest.fn().mockResolvedValue(undefined),
  };
  const productTagsServiceMock = {
    processAndUpdateProductTags: jest.fn().mockResolvedValue(undefined),
  };
  const productFilesSettersServiceMock = {
    create: jest.fn(),
    remove: jest.fn(),
  };
  const productFilesGettersServiceMock = {
    findByProductId: jest.fn(),
  };
  const productVariationsSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const productVariationsGettersServiceMock = {
    findAllByProduct: jest.fn(),
  };
  const productSkusSettersServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const productSkusGettersServiceMock = {
    findAllByProduct: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    checkIfExistsByIdAndBusinessId: jest.fn().mockResolvedValue(undefined),
  };
  const catalogsSettersServiceMock = {
    updateProductsCountJob: jest.fn().mockResolvedValue(undefined),
  };
  const filesGettersServiceMock = {
    getImageByNames: jest.fn(),
  };
  let service: ProductsService;
  const businessReq: IBusinessReq = { businessId: 7, path: '/shop' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: REQUEST, useValue: { headers: {} } },
        {
          provide: getRepositoryToken(Product),
          useValue: {},
        },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
        {
          provide: ProductsSettersService,
          useValue: productsSettersServiceMock,
        },
        { provide: ProductTagsService, useValue: productTagsServiceMock },
        {
          provide: ProductFilesSettersService,
          useValue: productFilesSettersServiceMock,
        },
        {
          provide: ProductFilesGettersService,
          useValue: productFilesGettersServiceMock,
        },
        {
          provide: ProductVariationsSettersService,
          useValue: productVariationsSettersServiceMock,
        },
        {
          provide: ProductVariationsGettersService,
          useValue: productVariationsGettersServiceMock,
        },
        {
          provide: ProductSkusSettersService,
          useValue: productSkusSettersServiceMock,
        },
        {
          provide: ProductSkusGettersService,
          useValue: productSkusGettersServiceMock,
        },
        {
          provide: CatalogsGettersService,
          useValue: catalogsGettersServiceMock,
        },
        {
          provide: CatalogsSettersService,
          useValue: catalogsSettersServiceMock,
        },
        { provide: FilesGettersService, useValue: filesGettersServiceMock },
      ],
    }).compile();
    service = await moduleRef.resolve(ProductsService);
  });

  describe('findAll', () => {
    it('delegates to getters', async () => {
      const list: Product[] = [];
      productsGettersServiceMock.findAll.mockResolvedValue(list);
      await expect(service.findAll({ page: 1, limit: 10 })).resolves.toBe(list);
    });
  });

  describe('findOne', () => {
    it('delegates to getters.findOneWithRelations', async () => {
      const p = { id: 1 } as Product;
      productsGettersServiceMock.findOneWithRelations.mockResolvedValue(p);
      await expect(service.findOne(1)).resolves.toBe(p);
    });
  });

  describe('findAllByCatalog', () => {
    it('delegates to getters.getAllByCatalog', async () => {
      const list: Product[] = [];
      productsGettersServiceMock.getAllByCatalog.mockResolvedValue(list);
      await expect(service.findAllByCatalog(3, 'x')).resolves.toBe(list);
    });
  });

  describe('toggleIsPrimary', () => {
    it('flips isPrimary and returns reloaded product', async () => {
      const product = { id: 5, isPrimary: false, idCatalog: 1 } as Product;
      const reloaded = { ...product, isPrimary: true } as Product;
      productsGettersServiceMock.findOneByBusinessId.mockResolvedValue(product);
      productsSettersServiceMock.update.mockResolvedValue(undefined);
      productsGettersServiceMock.findOneWithRelations.mockResolvedValue(
        reloaded,
      );
      await expect(service.toggleIsPrimary(5, businessReq)).resolves.toBe(
        reloaded,
      );
      expect(productsSettersServiceMock.update).toHaveBeenCalledWith(
        product,
        expect.objectContaining({ id: 5, isPrimary: true }),
        businessReq,
      );
      expect(productsSettersServiceMock.queueForIdProduct).toHaveBeenCalledWith(
        5,
      );
    });
  });
});
