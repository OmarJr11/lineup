import type { INestApplication } from '@nestjs/common';
import { ProductsResolver } from '../src/products/products.resolver';
import { ProductSkusResolver } from '../src/products/product-skus.resolver';
import { ProductsService } from '../../../core/modules/products/products.service';
import { ProductSkusService } from '../../../core/modules/product-skus/product-skus.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Products e2e', () => {
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
  const productSkusServiceMock = {
    findAllByProductAndBusiness: jest.fn(),
    updateAllSkusByProduct: jest.fn(),
  };

  const providers = [
    { provide: ProductsService, useValue: productsServiceMock },
    { provide: ProductSkusService, useValue: productSkusServiceMock },
  ];

  const createProductMutation = `
    mutation CreateProduct($data: CreateProductInput!) {
      createProduct(data: $data) { id }
    }
  `;
  const findAllProductsQuery = `query FindAllProducts($pagination: InfinityScrollInput!) { findAllProducts(pagination: $pagination) { total } }`;
  const getAllPrimaryProductsByBusinessQuery = `query GetAllPrimaryProductsByBusiness($data: GetAllPrimaryProductsByBusinessInput!) { getAllPrimaryProductsByBusiness(data: $data) { id } }`;
  const getAllByCatalogQuery = `query GetAllByCatalog($idCatalog: Int!, $search: String) { getAllByCatalog(idCatalog: $idCatalog, search: $search) { id } }`;
  const getAllByCatalogPaginatedQuery = `query GetAllByCatalogPaginated($idCatalog: Int!, $pagination: InfinityScrollInput!) { getAllByCatalogPaginated(idCatalog: $idCatalog, pagination: $pagination) { total } }`;
  const getAllByBusinessQuery = `query GetAllByBusiness($idBusiness: Int!, $pagination: InfinityScrollInput!) { getAllByBusiness(idBusiness: $idBusiness, pagination: $pagination) { total } }`;
  const getAllDraftProductsQuery = `query GetAllDraftProducts($pagination: InfinityScrollInput!) { getAllDraftProducts(pagination: $pagination) { total } }`;
  const getAllByTagQuery = `query GetAllByTag($tagNameOrSlug: String!, $pagination: InfinityScrollInput!) { getAllByTag(tagNameOrSlug: $tagNameOrSlug, pagination: $pagination) { total } }`;
  const findOneProductQuery = `query FindOneProduct($id: Int!) { findOneProduct(id: $id) { id } }`;
  const updateProductMutation = `mutation UpdateProduct($data: UpdateProductInput!) { updateProduct(data: $data) { id } }`;
  const toggleProductIsPrimaryMutation = `mutation ToggleProductIsPrimary($idProduct: Int!) { toggleProductIsPrimary(idProduct: $idProduct) { id } }`;
  const removeProductMutation = `mutation RemoveProduct($id: Int!) { removeProduct(id: $id) }`;
  const getSkusByProductQuery = `query GetSkusByProduct($idProduct: Int!) { getSkusByProduct(idProduct: $idProduct) { id } }`;
  const updateProductSkusMutation = `mutation UpdateProductSkus($data: UpdateProductSkusInput!) { updateProductSkus(data: $data) { id } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [ProductsResolver, ProductSkusResolver],
      providers,
    });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createProduct', async () => {
    productsServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createProductMutation,
      variables: {
        data: {
          title: 'Pizza',
          subtitle: 'Large',
          description: 'Desc',
          idCatalog: 1,
          images: [{ imageCode: 'img-1', order: 1 }],
          isPrimary: true,
        },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createProduct.id).toBe(1);
  });

  it('covers findAllProducts', async () => {
    productsServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllProductsQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.findAllProducts.total).toBe(1);
  });

  it('covers getAllPrimaryProductsByBusiness', async () => {
    productsServiceMock.findAllByBusinessAndIsPrimary.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: getAllPrimaryProductsByBusinessQuery,
      variables: { data: { idBusiness: 1 } },
    });
    expect(response.body.data.getAllPrimaryProductsByBusiness).toHaveLength(1);
  });

  it('covers getAllByCatalog', async () => {
    productsServiceMock.findAllByCatalog.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: getAllByCatalogQuery,
      variables: { idCatalog: 1, search: 'pi' },
    });
    expect(response.body.data.getAllByCatalog).toHaveLength(1);
  });

  it('covers getAllByCatalogPaginated', async () => {
    productsServiceMock.getAllByCatalogPaginated.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: getAllByCatalogPaginatedQuery,
      variables: { idCatalog: 1, pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.getAllByCatalogPaginated.total).toBe(1);
  });

  it('covers getAllByBusiness', async () => {
    productsServiceMock.findAllByBusiness.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: getAllByBusinessQuery,
      variables: { idBusiness: 1, pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.getAllByBusiness.total).toBe(1);
  });

  it('covers getAllDraftProducts', async () => {
    productsServiceMock.findAllByBusiness.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: getAllDraftProductsQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.getAllDraftProducts.total).toBe(1);
  });

  it('covers getAllByTag', async () => {
    productsServiceMock.findAllByTag.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: getAllByTagQuery,
      variables: { tagNameOrSlug: 'pizza', pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.getAllByTag.total).toBe(1);
  });

  it('covers findOneProduct', async () => {
    productsServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneProductQuery,
      variables: { id: 1 },
    });
    expect(response.body.data.findOneProduct.id).toBe(1);
  });

  it('covers updateProduct', async () => {
    productsServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateProductMutation,
      variables: { data: { id: 1, title: 'Updated' } },
    });
    expect(response.body.data.updateProduct.id).toBe(1);
  });

  it('covers toggleProductIsPrimary', async () => {
    productsServiceMock.toggleIsPrimary.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: toggleProductIsPrimaryMutation,
      variables: { idProduct: 1 },
    });
    expect(response.body.data.toggleProductIsPrimary.id).toBe(1);
  });

  it('covers removeProduct', async () => {
    productsServiceMock.remove.mockResolvedValue(true);
    const response = await executeGraphql({
      app,
      query: removeProductMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.removeProduct).toBe(true);
  });

  it('covers getSkusByProduct', async () => {
    productSkusServiceMock.findAllByProductAndBusiness.mockResolvedValue([{ id: 11 }]);
    const response = await executeGraphql({
      app,
      query: getSkusByProductQuery,
      variables: { idProduct: 1 },
    });
    expect(response.body.data.getSkusByProduct).toHaveLength(1);
  });

  it('covers updateProductSkus', async () => {
    productSkusServiceMock.updateAllSkusByProduct.mockResolvedValue([{ id: 11 }]);
    const response = await executeGraphql({
      app,
      query: updateProductSkusMutation,
      variables: { data: { skus: [{ id: 11, quantity: 5 }] } },
    });
    expect(response.body.data.updateProductSkus).toHaveLength(1);
  });
});
