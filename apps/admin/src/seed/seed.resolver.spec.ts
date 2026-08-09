import { SeedResolver } from './seed.resolver';
import { SeedService } from '../../../../core/modules/seed/seed.service';
import {
  SEED_BUSINESSES,
  SEED_CATALOGS,
  SEED_PRODUCTS,
} from '../../../../core/modules/seed/data';

/**
 * Unit tests for {@link SeedResolver}.
 */
describe('SeedResolver', () => {
  let resolver: SeedResolver;
  const seedServiceMock = {
    seedOneBusiness: jest.fn(),
    seedOneCatalog: jest.fn(),
    seedOneProduct: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    seedServiceMock.seedOneBusiness.mockResolvedValue(undefined);
    seedServiceMock.seedOneCatalog.mockResolvedValue(undefined);
    seedServiceMock.seedOneProduct.mockResolvedValue(undefined);
    resolver = new SeedResolver(seedServiceMock as unknown as SeedService);
  });

  describe('seedDevelopmentBusinesses', () => {
    it('seeds every business entry and returns true', async () => {
      await expect(resolver.seedDevelopmentBusinesses()).resolves.toBe(true);
      expect(seedServiceMock.seedOneBusiness).toHaveBeenCalledTimes(
        SEED_BUSINESSES.length,
      );
    });
  });

  describe('seedDevelopmentCatalogs', () => {
    it('seeds every catalog entry and returns true', async () => {
      await expect(resolver.seedDevelopmentCatalogs()).resolves.toBe(true);
      expect(seedServiceMock.seedOneCatalog).toHaveBeenCalledTimes(
        SEED_CATALOGS.length,
      );
    });
  });

  describe('seedDevelopmentProducts', () => {
    it('seeds every product entry and returns true', async () => {
      await expect(resolver.seedDevelopmentProducts()).resolves.toBe(true);
      expect(seedServiceMock.seedOneProduct).toHaveBeenCalledTimes(
        SEED_PRODUCTS.length,
      );
    });
  });
});
