import { InventoryResolver } from './inventory.resolver';
import { ProductSkusService } from '../../../../core/modules/product-skus/product-skus.service';
import { StockMovementsService } from '../../../../core/modules/stock-movements/stock-movements.service';
import { ProductsGettersService } from '../../../../core/modules/products/products-getters.service';
import type { AdjustStockInput } from '../../../../core/modules/product-skus/dto/adjust-stock.input';
import type { SalesInput } from '../../../../core/modules/product-skus/dto/sales.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link InventoryResolver}.
 */
describe('InventoryResolver', () => {
  let resolver: InventoryResolver;
  const productSkusServiceMock = {
    adjustStock: jest.fn(),
    registerSales: jest.fn(),
    removeProductSku: jest.fn(),
    findAllByProductAndBusiness: jest.fn(),
    findOneByBusinessId: jest.fn(),
  };
  const stockMovementsServiceMock = {
    findAllByProductSku: jest.fn(),
    findAllByBusiness: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOneByBusinessId: jest.fn(),
  };

  const businessReq = { businessId: 11 } as IBusinessReq;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new InventoryResolver(
      productSkusServiceMock as unknown as ProductSkusService,
      stockMovementsServiceMock as unknown as StockMovementsService,
      productsGettersServiceMock as unknown as ProductsGettersService,
    );
  });

  it('adjustStock maps SKU', async () => {
    const data = {} as AdjustStockInput;
    const sku = { id: 1 };
    productSkusServiceMock.adjustStock.mockResolvedValue(sku);
    const out = await resolver.adjustStock(data, businessReq);
    expect(productSkusServiceMock.adjustStock).toHaveBeenCalledWith(
      data,
      businessReq,
    );
    expect(out).toEqual({ ...sku, variationOptions: {} });
  });

  it('registerSale maps multiple SKUs', async () => {
    const data = { sales: [] } as SalesInput;
    const skus = [{ id: 1 }, { id: 2 }];
    productSkusServiceMock.registerSales.mockResolvedValue(skus);
    const out = await resolver.registerSale(data, businessReq);
    expect(out).toEqual([
      { id: 1, variationOptions: {} },
      { id: 2, variationOptions: {} },
    ]);
  });

  it('getStockHistory without idProductSku loads by business', async () => {
    const movements = [{ id: 1 }];
    stockMovementsServiceMock.findAllByBusiness.mockResolvedValue(movements);
    const out = await resolver.getStockHistory(null, 20, 0, businessReq);
    expect(productsGettersServiceMock.findOneByBusinessId).not.toHaveBeenCalled();
    expect(stockMovementsServiceMock.findAllByBusiness).toHaveBeenCalledWith(
      11,
      20,
      0,
    );
    expect(out).toEqual(movements);
  });

  it('getStockHistory with idProductSku validates SKU and loads movements', async () => {
    const movements = [{ id: 99 }];
    productSkusServiceMock.findOneByBusinessId.mockResolvedValue({ id: 5 });
    stockMovementsServiceMock.findAllByProductSku.mockResolvedValue(movements);
    const out = await resolver.getStockHistory(5, 10, 0, businessReq);
    expect(productSkusServiceMock.findOneByBusinessId).toHaveBeenCalledWith(
      5,
      11,
    );
    expect(stockMovementsServiceMock.findAllByProductSku).toHaveBeenCalledWith(
      5,
      10,
    );
    expect(out).toEqual(movements);
  });
});
