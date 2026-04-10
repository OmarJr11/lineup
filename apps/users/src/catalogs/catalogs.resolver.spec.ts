import { CatalogsResolver } from './catalogs.resolver';
import { CatalogsService } from '../../../../core/modules/catalogs/catalogs.service';
import type { InfinityScrollInput } from '../../../../core/common/dtos';

/**
 * Unit tests for {@link CatalogsResolver} (users app).
 */
describe('CatalogsResolver (users)', () => {
  let resolver: CatalogsResolver;
  const catalogsServiceMock = {
    findOne: jest.fn(),
    findOneByPath: jest.fn(),
    findAllByBusinessId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new CatalogsResolver(
      catalogsServiceMock as unknown as CatalogsService,
    );
  });

  it('findOne maps catalog', async () => {
    const row = { id: 1 };
    catalogsServiceMock.findOne.mockResolvedValue(row);
    const out = await resolver.findOne(1);
    expect(out).toBe(row);
  });

  it('findCatalogsByBusinessId uses default limit 10', async () => {
    const pagination = { page: 1, limit: undefined } as InfinityScrollInput;
    const row = { id: 2 };
    catalogsServiceMock.findAllByBusinessId.mockResolvedValue([row]);
    const out = await resolver.findCatalogsByBusinessId(5, pagination);
    expect(out.limit).toBe(10);
    expect(out.items).toEqual([row]);
  });
});
