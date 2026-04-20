import type { INestApplication } from '@nestjs/common';
import { CollectionsResolver } from '../src/collections/collections.resolver';
import { ProductCollectionsService } from '../../../core/modules/product-collections/product-collections.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users Collections e2e', () => {
  const productCollectionsServiceMock = {
    getCollections: jest.fn(),
  };

  const providers = [
    {
      provide: ProductCollectionsService,
      useValue: productCollectionsServiceMock,
    },
  ];

  const productCollectionsQuery = `
    query ProductCollections {
      productCollections {
        id
        title
        products {
          id
        }
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [CollectionsResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns product collections', async () => {
    productCollectionsServiceMock.getCollections.mockResolvedValue([
      {
        id: 'for-you',
        title: 'For you',
        products: [{ id: 31 }],
      },
    ]);

    const response = await executeGraphql({
      app,
      query: productCollectionsQuery,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.productCollections).toHaveLength(1);
    expect(response.body.data.productCollections[0].id).toBe('for-you');
  });
});
