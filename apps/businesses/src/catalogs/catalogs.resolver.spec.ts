import { CatalogsResolver } from './catalogs.resolver';
import { CatalogsService } from '../../../../core/modules/catalogs/catalogs.service';
import type { CreateCatalogInput } from '../../../../core/modules/catalogs/dto/create-catalog.input';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link CatalogsResolver}.
 */
describe('CatalogsResolver', () => {
  let resolver: CatalogsResolver;
  const catalogsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllMyCatalogs: jest.fn(),
    findOne: jest.fn(),
    findOneByPath: jest.fn(),
    findAllByBusinessId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new CatalogsResolver(
      catalogsServiceMock as unknown as CatalogsService,
    );
  });

  it('create delegates and maps catalog', async () => {
    const data = {} as CreateCatalogInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const entity = { id: 3 };
    catalogsServiceMock.create.mockResolvedValue(entity);
    const out = await resolver.create(data, businessReq);
    expect(catalogsServiceMock.create).toHaveBeenCalledWith(data, businessReq);
    expect(out).toBe(entity);
  });

  it('findAll returns paginated shape', async () => {
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    const row = { id: 1 };
    catalogsServiceMock.findAll.mockResolvedValue([row]);
    const out = await resolver.findAll(pagination);
    expect(out).toEqual({
      items: [row],
      total: 1,
      page: 1,
      limit: 10,
    });
  });

  it('findCatalogsByBusinessId uses limit fallback', async () => {
    const pagination = { page: 1, limit: undefined } as InfinityScrollInput;
    const row = { id: 1 };
    catalogsServiceMock.findAllByBusinessId.mockResolvedValue([row]);
    const out = await resolver.findCatalogsByBusinessId(7, pagination);
    expect(catalogsServiceMock.findAllByBusinessId).toHaveBeenCalledWith(
      7,
      pagination,
    );
    expect(out.limit).toBe(10);
  });
});
