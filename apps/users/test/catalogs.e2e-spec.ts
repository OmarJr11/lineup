import type { INestApplication } from '@nestjs/common';
import { CatalogsResolver } from '../src/catalogs/catalogs.resolver';
import { CatalogsService } from '../../../core/modules/catalogs/catalogs.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users Catalogs e2e', () => {
  const catalogsServiceMock = {
    findOne: jest.fn(),
    findOneByPath: jest.fn(),
    findAllByBusinessId: jest.fn(),
  };

  const providers = [
    { provide: CatalogsService, useValue: catalogsServiceMock },
  ];

  const findOneCatalogQuery = `
    query FindOneCatalog($id: Int!) {
      findOneCatalog(id: $id) {
        id
        title
      }
    }
  `;

  const findOneCatalogByPathQuery = `
    query FindOneCatalogByPath($path: String!) {
      findOneCatalogByPath(path: $path) {
        id
        path
      }
    }
  `;

  const findCatalogsByBusinessIdQuery = `
    query FindCatalogsByBusinessId($idBusiness: Int!, $pagination: InfinityScrollInput!) {
      findCatalogsByBusinessId(idBusiness: $idBusiness, pagination: $pagination) {
        items {
          id
          title
        }
        total
        page
        limit
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [CatalogsResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('gets catalog by id', async () => {
    catalogsServiceMock.findOne.mockResolvedValue({
      id: 11,
      title: 'Pizzas',
    });

    const response = await executeGraphql({
      app,
      query: findOneCatalogQuery,
      variables: { id: 11 },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findOneCatalog.id).toBe(11);
  });

  it('gets catalog by path', async () => {
    catalogsServiceMock.findOneByPath.mockResolvedValue({
      id: 11,
      path: 'pizzas',
    });

    const response = await executeGraphql({
      app,
      query: findOneCatalogByPathQuery,
      variables: { path: 'pizzas' },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findOneCatalogByPath.path).toBe('pizzas');
  });

  it('gets paginated catalogs by business id', async () => {
    catalogsServiceMock.findAllByBusinessId.mockResolvedValue([
      {
        id: 21,
        title: 'Desserts',
      },
    ]);

    const response = await executeGraphql({
      app,
      query: findCatalogsByBusinessIdQuery,
      variables: {
        idBusiness: 3,
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findCatalogsByBusinessId.total).toBe(1);
  });
});
