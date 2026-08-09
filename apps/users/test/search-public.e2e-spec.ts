import type { INestApplication } from '@nestjs/common';
import { SearchResolver } from '../src/search/search.resolver';
import { SearchService } from '../../../core/modules/search/search.service';
import { UserSearchesService } from '../../../core/modules/user-searches/user-searches.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Users Search public e2e', () => {
  const searchServiceMock = {
    search: jest.fn(),
    getFeaturedBusinesses: jest.fn(),
    getFeaturedCatalogs: jest.fn(),
    getFeaturedProducts: jest.fn(),
    getRecentlyAddedProducts: jest.fn(),
  };

  const userSearchesServiceMock = {
    recordSearch: jest.fn(),
  };

  const providers = [
    { provide: SearchService, useValue: searchServiceMock },
    { provide: UserSearchesService, useValue: userSearchesServiceMock },
  ];

  const searchQuery = `
    query Search($pagination: InfinityScrollInput!, $target: SearchTargetEnum!) {
      search(pagination: $pagination, target: $target) {
        items {
          __typename
          ... on BusinessSchema {
            id
          }
          ... on CatalogSchema {
            id
          }
          ... on ProductSchema {
            id
          }
        }
        total
        page
        limit
      }
    }
  `;

  const featuredQuery = `
    query Featured($pagination: InfinityScrollInput!) {
      featured(pagination: $pagination) {
        featuredBusinesses {
          id
        }
        featuredCatalogs {
          id
        }
        featuredProducts {
          id
        }
        recentlyAddedProducts {
          id
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
      resolvers: [SearchResolver],
      providers,
      guardOverrides: {
        optionalJwt: {
          allow: true,
          user: null,
        },
      },
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('resolves public search query without authenticated user', async () => {
    searchServiceMock.search.mockResolvedValue({
      items: [
        {
          __typename: 'BusinessSchema',
          item: { id: 100 },
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    const response = await executeGraphql({
      app,
      query: searchQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
          search: 'pizza',
        },
        target: 'ALL',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.search.total).toBe(1);
    expect(response.body.data.search.items[0].__typename).toBe('BusinessSchema');
    expect(userSearchesServiceMock.recordSearch).not.toHaveBeenCalled();
  });

  it('resolves featured collections query', async () => {
    const baseResult = {
      items: [{ id: 1 }],
      total: 1,
      page: 1,
      limit: 10,
    };
    searchServiceMock.getFeaturedBusinesses.mockResolvedValue(baseResult);
    searchServiceMock.getFeaturedCatalogs.mockResolvedValue(baseResult);
    searchServiceMock.getFeaturedProducts.mockResolvedValue(baseResult);
    searchServiceMock.getRecentlyAddedProducts.mockResolvedValue(baseResult);

    const response = await executeGraphql({
      app,
      query: featuredQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.featured.total).toBe(1);
    expect(response.body.data.featured.featuredBusinesses[0].id).toBe(1);
  });
});
