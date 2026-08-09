import type { INestApplication } from '@nestjs/common';
import { WishlistsResolver } from '../src/wishlists/wishlists.resolver';
import { BusinessFollowersGettersService } from '../../../core/modules/business-followers/business-followers-getters.service';
import { ProductReactionsGettersService } from '../../../core/modules/product-reactions/product-reactions-getters.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users Wishlists e2e', () => {
  const businessFollowersGettersServiceMock = {
    findAllByUserPaginated: jest.fn(),
  };

  const productReactionsGettersServiceMock = {
    findAllLikedByUserPaginated: jest.fn(),
  };

  const providers = [
    {
      provide: BusinessFollowersGettersService,
      useValue: businessFollowersGettersServiceMock,
    },
    {
      provide: ProductReactionsGettersService,
      useValue: productReactionsGettersServiceMock,
    },
  ];

  const findFollowedBusinessesQuery = `
    query FindFollowedBusinesses($pagination: InfinityScrollInput!) {
      findFollowedBusinesses(pagination: $pagination) {
        items {
          id
        }
        total
      }
    }
  `;

  const findLikedProductsQuery = `
    query FindLikedProducts($pagination: InfinityScrollInput!) {
      findLikedProducts(pagination: $pagination) {
        items {
          id
        }
        total
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [WishlistsResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('gets followed businesses', async () => {
    businessFollowersGettersServiceMock.findAllByUserPaginated.mockResolvedValue([
      { id: 1 },
    ]);

    const response = await executeGraphql({
      app,
      query: findFollowedBusinessesQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findFollowedBusinesses.total).toBe(1);
  });

  it('gets liked products', async () => {
    productReactionsGettersServiceMock.findAllLikedByUserPaginated.mockResolvedValue(
      [{ id: 2 }],
    );

    const response = await executeGraphql({
      app,
      query: findLikedProductsQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findLikedProducts.total).toBe(1);
  });
});
