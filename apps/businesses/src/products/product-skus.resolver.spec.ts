import { ProductSkusResolver } from './product-skus.resolver';
import { ProductSkusService } from '../../../../core/modules/product-skus/product-skus.service';
import type { UpdateProductSkusInput } from '../../../../core/modules/product-skus/dto/update-product-skus.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link ProductSkusResolver}.
 */
describe('ProductSkusResolver', () => {
  let resolver: ProductSkusResolver;
  const productSkusServiceMock = {
    findAllByProductAndBusiness: jest.fn(),
    updateAllSkusByProduct: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new ProductSkusResolver(
      productSkusServiceMock as unknown as ProductSkusService,
    );
  });

  it('getSkusByProduct maps SKUs', async () => {
    const businessReq = { businessId: 7 } as IBusinessReq;
    const skus = [{ id: 1 }];
    productSkusServiceMock.findAllByProductAndBusiness.mockResolvedValue(skus);
    const out = await resolver.getSkusByProduct(3, businessReq);
    expect(
      productSkusServiceMock.findAllByProductAndBusiness,
    ).toHaveBeenCalledWith(3, 7);
    expect(out).toEqual([{ id: 1, variationOptions: {} }]);
  });

  it('updateProductSkus maps SKUs', async () => {
    const data = {} as UpdateProductSkusInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const skus = [{ id: 2 }];
    productSkusServiceMock.updateAllSkusByProduct.mockResolvedValue(skus);
    const out = await resolver.updateProductSkus(data, businessReq);
    expect(productSkusServiceMock.updateAllSkusByProduct).toHaveBeenCalledWith(
      data,
      businessReq,
    );
    expect(out).toEqual([{ id: 2, variationOptions: {} }]);
  });
});
