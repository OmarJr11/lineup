import { ProductsResolver } from './products.resolver';
import { ProductsService } from '../../../../core/modules/products/products.service';
import type { CreateProductInput } from '../../../../core/modules/products/dto/create-product.input';
import type { GetAllPrimaryProductsByBusinessInput } from '../../../../core/modules/products/dto/get-all-primary-products-by-business.input';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link ProductsResolver}.
 */
describe('ProductsResolver', () => {
  let resolver: ProductsResolver;
  const productsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllByBusinessAndIsPrimary: jest.fn(),
    findAllByCatalog: jest.fn(),
    getAllByCatalogPaginated: jest.fn(),
    findAllByBusiness: jest.fn(),
    findAllByTag: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    toggleIsPrimary: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new ProductsResolver(
      productsServiceMock as unknown as ProductsService,
    );
  });

  it('create maps product', async () => {
    const data = {} as CreateProductInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const entity = { id: 10 };
    productsServiceMock.create.mockResolvedValue(entity);
    const out = await resolver.create(data, businessReq);
    expect(productsServiceMock.create).toHaveBeenCalledWith(data, businessReq);
    expect(out).toEqual({ ...entity, price: null });
  });

  it('findAll returns paginated shape', async () => {
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    const row = { id: 1 };
    productsServiceMock.findAll.mockResolvedValue([row]);
    const out = await resolver.findAll(pagination);
    expect(out.items).toEqual([{ ...row, price: null }]);
    expect(out.total).toBe(1);
  });

  it('getAllPrimaryProductsByBusiness delegates with isPrimary true', async () => {
    const data = { idBusiness: 3 } as GetAllPrimaryProductsByBusinessInput;
    const rows = [{ id: 1 }];
    productsServiceMock.findAllByBusinessAndIsPrimary.mockResolvedValue(rows);
    const out = await resolver.getAllPrimaryProductsByBusiness(data);
    expect(productsServiceMock.findAllByBusinessAndIsPrimary).toHaveBeenCalledWith(
      data,
      true,
    );
    expect(out).toEqual([{ ...rows[0], price: null }]);
  });

  it('remove delegates to service', async () => {
    const businessReq = { businessId: 1 } as IBusinessReq;
    productsServiceMock.remove.mockResolvedValue(true);
    await expect(resolver.remove(5, businessReq)).resolves.toBe(true);
  });
});
