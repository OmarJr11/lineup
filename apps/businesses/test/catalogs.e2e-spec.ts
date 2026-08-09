import type { INestApplication } from '@nestjs/common';
import { CatalogsResolver } from '../src/catalogs/catalogs.resolver';
import { CatalogsService } from '../../../core/modules/catalogs/catalogs.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Catalogs e2e', () => {
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
  const providers = [{ provide: CatalogsService, useValue: catalogsServiceMock }];

  const createCatalogMutation = `mutation CreateCatalog($data: CreateCatalogInput!) { createCatalog(data: $data) { id } }`;
  const findAllCatalogsQuery = `query FindAllCatalogs($pagination: InfinityScrollInput!) { findAllCatalogs(pagination: $pagination) { total } }`;
  const findAllMyCatalogsQuery = `query FindAllMyCatalogs($pagination: InfinityScrollInput!) { findAllMyCatalogs(pagination: $pagination) { total } }`;
  const findOneCatalogQuery = `query FindOneCatalog($id: Int!) { findOneCatalog(id: $id) { id } }`;
  const findOneCatalogByPathQuery = `query FindOneCatalogByPath($path: String!) { findOneCatalogByPath(path: $path) { id path } }`;
  const findCatalogsByBusinessIdQuery = `query FindCatalogsByBusinessId($idBusiness: Int!, $pagination: InfinityScrollInput!) { findCatalogsByBusinessId(idBusiness: $idBusiness, pagination: $pagination) { total } }`;
  const updateCatalogMutation = `mutation UpdateCatalog($data: UpdateCatalogInput!) { updateCatalog(data: $data) { id } }`;
  const removeCatalogMutation = `mutation RemoveCatalog($id: Float!) { removeCatalog(id: $id) { id } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [CatalogsResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createCatalog', async () => {
    catalogsServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createCatalogMutation,
      variables: { data: { title: 'Catalog A' } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createCatalog.id).toBe(1);
  });
  it('covers findAllCatalogs', async () => {
    catalogsServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllCatalogsQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.findAllCatalogs.total).toBe(1);
  });
  it('covers findAllMyCatalogs', async () => {
    catalogsServiceMock.findAllMyCatalogs.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllMyCatalogsQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.findAllMyCatalogs.total).toBe(1);
  });
  it('covers findOneCatalog', async () => {
    catalogsServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneCatalogQuery,
      variables: { id: 1 },
    });
    expect(response.body.data.findOneCatalog.id).toBe(1);
  });
  it('covers findOneCatalogByPath', async () => {
    catalogsServiceMock.findOneByPath.mockResolvedValue({ id: 1, path: 'a' });
    const response = await executeGraphql({
      app,
      query: findOneCatalogByPathQuery,
      variables: { path: 'a' },
    });
    expect(response.body.data.findOneCatalogByPath.path).toBe('a');
  });
  it('covers findCatalogsByBusinessId', async () => {
    catalogsServiceMock.findAllByBusinessId.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findCatalogsByBusinessIdQuery,
      variables: { idBusiness: 1, pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.findCatalogsByBusinessId.total).toBe(1);
  });
  it('covers updateCatalog', async () => {
    catalogsServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateCatalogMutation,
      variables: { data: { idCatalog: 1, title: 'Updated' } },
    });
    expect(response.body.data.updateCatalog.id).toBe(1);
  });
  it('covers removeCatalog', async () => {
    catalogsServiceMock.remove.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: removeCatalogMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.removeCatalog.id).toBe(1);
  });
});
