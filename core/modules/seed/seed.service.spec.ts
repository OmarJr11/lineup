import { ForbiddenException } from '@nestjs/common';
import { SeedService } from './seed.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CatalogsService } from '../catalogs/catalogs.service';
import { ProductsService } from '../products/products.service';
import { EnvironmentsEnum } from '../../common/enums';

/**
 * Unit tests for {@link SeedService}.
 */
describe('SeedService', () => {
  const businessesServiceMock = {
    create: jest.fn().mockResolvedValue(undefined),
    findOneByPath: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const catalogsServiceMock = {
    create: jest.fn().mockResolvedValue(undefined),
    findOneByPath: jest.fn(),
  };
  const productsServiceMock = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  let service: SeedService;
  let previousNodeEnv: string | undefined;

  beforeAll(() => {
    previousNodeEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = previousNodeEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = EnvironmentsEnum.Development;
    service = new SeedService(
      businessesServiceMock as unknown as BusinessesService,
      catalogsServiceMock as unknown as CatalogsService,
      productsServiceMock as unknown as ProductsService,
    );
  });

  describe('assertDevelopment', () => {
    it('throws when not in development', async () => {
      process.env.NODE_ENV = 'production';
      await expect(
        service.seedOneCatalog({
          title: 'C',
          path: '/c',
          tags: [],
          imgCode: 'x',
          idCreationBusiness: 1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('seedOneBusiness', () => {
    it('creates then updates business', async () => {
      process.env.NODE_ENV = EnvironmentsEnum.Development;
      businessesServiceMock.findOneByPath.mockResolvedValue({
        id: 3,
        path: '/b',
      });
      await service.seedOneBusiness({
        email: 'a@a.com',
        name: 'Biz',
        path: '/b',
        description: 'd',
        telephone: '1',
        tags: [],
        imgCode: 'img',
      });
      expect(businessesServiceMock.create).toHaveBeenCalled();
      expect(businessesServiceMock.update).toHaveBeenCalled();
    });
  });

  describe('seedOneCatalog', () => {
    it('delegates to catalogsService.create', async () => {
      await service.seedOneCatalog({
        title: 'Cat',
        path: '/cat',
        tags: [],
        imgCode: 'i',
        idCreationBusiness: 7,
      });
      expect(catalogsServiceMock.create).toHaveBeenCalled();
    });
  });

  describe('seedOneProduct', () => {
    it('resolves catalog by path and creates product', async () => {
      catalogsServiceMock.findOneByPath.mockResolvedValue({
        id: 10,
        idCreationBusiness: 5,
        path: '/cat',
        business: { path: '/biz' },
      });
      await service.seedOneProduct({
        title: 'P',
        subtitle: 'S',
        description: 'D',
        catalogPath: '/cat',
        tags: [],
        images: [{ imageCode: 'a', order: 0 }],
        variations: [
          {
            title: 'Size',
            options: ['M'],
          },
        ],
      });
      expect(productsServiceMock.create).toHaveBeenCalled();
    });
  });
});
