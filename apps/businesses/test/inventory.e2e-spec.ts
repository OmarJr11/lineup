import type { INestApplication } from '@nestjs/common';
import { InventoryResolver } from '../src/inventory/inventory.resolver';
import { ProductSkusService } from '../../../core/modules/product-skus/product-skus.service';
import { StockMovementsService } from '../../../core/modules/stock-movements/stock-movements.service';
import { ProductsGettersService } from '../../../core/modules/products/products-getters.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Inventory e2e', () => {
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
  const providers = [
    { provide: ProductSkusService, useValue: productSkusServiceMock },
    { provide: StockMovementsService, useValue: stockMovementsServiceMock },
    { provide: ProductsGettersService, useValue: productsGettersServiceMock },
  ];

  const adjustStockMutation = `mutation AdjustStock($data: AdjustStockInput!) { adjustStock(data: $data) { id } }`;
  const registerSaleMutation = `mutation RegisterSale($data: SalesInput!) { registerSale(data: $data) { id } }`;
  const removeProductSkuMutation = `mutation RemoveProductSku($idProductSku: Int!) { removeProductSku(idProductSku: $idProductSku) }`;
  const getStockByProductQuery = `query GetStockByProduct($idProduct: Int!) { getStockByProduct(idProduct: $idProduct) { id } }`;
  const getStockHistoryQuery = `query GetStockHistory($idProductSku: Int, $limit: Int, $offset: Int) { getStockHistory(idProductSku: $idProductSku, limit: $limit, offset: $offset) { id } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [InventoryResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers adjustStock', async () => {
    productSkusServiceMock.adjustStock.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: adjustStockMutation,
      variables: { data: { idProductSku: 1, quantityDelta: 5 } },
    });
    expect(response.body.data.adjustStock.id).toBe(1);
  });
  it('covers registerSale', async () => {
    productSkusServiceMock.registerSales.mockResolvedValue([{ id: 2 }]);
    const response = await executeGraphql({
      app,
      query: registerSaleMutation,
      variables: {
        data: { sales: [{ idProductSku: 1, quantity: 1, price: 10 }] },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.registerSale).toHaveLength(1);
  });
  it('covers removeProductSku', async () => {
    productSkusServiceMock.removeProductSku.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeProductSkuMutation,
      variables: { idProductSku: 1 },
    });
    expect(response.body.data.removeProductSku).toBe(true);
  });
  it('covers getStockByProduct', async () => {
    productsGettersServiceMock.findOneByBusinessId.mockResolvedValue({ id: 1 });
    productSkusServiceMock.findAllByProductAndBusiness.mockResolvedValue([{ id: 3 }]);
    const response = await executeGraphql({
      app,
      query: getStockByProductQuery,
      variables: { idProduct: 1 },
    });
    expect(response.body.data.getStockByProduct).toHaveLength(1);
  });
  it('covers getStockHistory', async () => {
    stockMovementsServiceMock.findAllByBusiness.mockResolvedValue([{ id: 10 }]);
    const response = await executeGraphql({
      app,
      query: getStockHistoryQuery,
      variables: { limit: 10, offset: 0 },
    });
    expect(response.body.data.getStockHistory).toHaveLength(1);
  });
});
