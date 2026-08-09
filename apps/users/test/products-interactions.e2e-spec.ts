import type { INestApplication } from '@nestjs/common';
import { ProductsResolver } from '../src/products/products.resolver';
import { ProductRatingsResolver } from '../src/products/product-ratings.resolver';
import { ProductReactionsService } from '../../../core/modules/product-reactions/product-reactions.service';
import { ProductReactionsGettersService } from '../../../core/modules/product-reactions/product-reactions-getters.service';
import { ProductsService } from '../../../core/modules/products/products.service';
import { TagsService } from '../../../core/modules/tags/tags.service';
import { ProductRatingsService } from '../../../core/modules/product-ratings/product-ratings.service';
import { ProductRatingsGettersService } from '../../../core/modules/product-ratings/product-ratings-getters.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Users Products interactions e2e', () => {
  const productReactionsServiceMock = {
    likeProduct: jest.fn(),
    unlikeProduct: jest.fn(),
  };

  const productReactionsGettersServiceMock = {
    findOneByProductAndUser: jest.fn(),
  };

  const productRatingsServiceMock = {
    rateProduct: jest.fn(),
  };

  const productRatingsGettersServiceMock = {
    findAllByProductPaginated: jest.fn(),
    findOneByProductAndUser: jest.fn(),
    findAllByUserPaginated: jest.fn(),
  };

  const productsServiceMock = {
    findAll: jest.fn(),
    findAllByCatalog: jest.fn(),
    getAllByCatalogPaginated: jest.fn(),
    findAllByBusiness: jest.fn(),
    findAllByBusinessAndIsPrimary: jest.fn(),
    findAllByTag: jest.fn(),
    findAllByTags: jest.fn(),
    findOne: jest.fn(),
  };

  const tagsServiceMock = {
    findMainTags: jest.fn(),
  };

  const providers = [
    { provide: ProductReactionsService, useValue: productReactionsServiceMock },
    {
      provide: ProductReactionsGettersService,
      useValue: productReactionsGettersServiceMock,
    },
    { provide: ProductRatingsService, useValue: productRatingsServiceMock },
    {
      provide: ProductRatingsGettersService,
      useValue: productRatingsGettersServiceMock,
    },
    { provide: ProductsService, useValue: productsServiceMock },
    { provide: TagsService, useValue: tagsServiceMock },
  ];

  const likeProductMutation = `
    mutation LikeProduct($idProduct: Int!) {
      likeProduct(idProduct: $idProduct) {
        id
        idProduct
        type
        status
      }
    }
  `;

  const unlikeProductMutation = `
    mutation UnlikeProduct($idProduct: Int!) {
      unlikeProduct(idProduct: $idProduct)
    }
  `;

  const hasLikedProductQuery = `
    query HasLikedProduct($idProduct: Int!) {
      hasLikedProduct(idProduct: $idProduct)
    }
  `;

  const rateProductMutation = `
    mutation RateProduct($data: RateProductInput!) {
      rateProduct(data: $data) {
        id
        idProduct
        stars
        comment
      }
    }
  `;

  const productRatingsQuery = `
    query ProductRatings($idProduct: Int!, $pagination: InfinityScrollInput!) {
      productRatings(idProduct: $idProduct, pagination: $pagination) {
        items {
          id
          idProduct
          stars
        }
        total
        page
        limit
      }
    }
  `;

  const myProductRatingQuery = `
    query MyProductRating($idProduct: Int!) {
      myProductRating(idProduct: $idProduct) {
        id
        idProduct
        stars
      }
    }
  `;

  const myProductRatingsQuery = `
    query MyProductRatings($pagination: InfinityScrollInput!) {
      myProductRatings(pagination: $pagination) {
        items {
          id
          idProduct
          stars
        }
        total
        page
        limit
      }
    }
  `;

  const findAllProductsQuery = `
    query FindAllProducts($pagination: InfinityScrollInput!) {
      findAllProducts(pagination: $pagination) {
        items {
          id
        }
        total
      }
    }
  `;

  const getAllByCatalogQuery = `
    query GetAllByCatalog($idCatalog: Int!, $search: String) {
      getAllByCatalog(idCatalog: $idCatalog, search: $search) {
        id
      }
    }
  `;

  const getAllByCatalogPaginatedQuery = `
    query GetAllByCatalogPaginated($idCatalog: Int!, $pagination: InfinityScrollInput!) {
      getAllByCatalogPaginated(idCatalog: $idCatalog, pagination: $pagination) {
        items {
          id
        }
        total
      }
    }
  `;

  const getAllByBusinessQuery = `
    query GetAllByBusiness($idBusiness: Int!, $pagination: InfinityScrollInput!) {
      getAllByBusiness(idBusiness: $idBusiness, pagination: $pagination) {
        items {
          id
        }
        total
      }
    }
  `;

  const getAllPrimaryProductsByBusinessQuery = `
    query GetAllPrimaryProductsByBusiness($data: GetAllPrimaryProductsByBusinessInput!) {
      getAllPrimaryProductsByBusiness(data: $data) {
        id
      }
    }
  `;

  const getAllByTagQuery = `
    query GetAllByTag($tagNameOrSlug: String!, $pagination: InfinityScrollInput!, $idBusiness: Int, $idProducts: [Int!]) {
      getAllByTag(tagNameOrSlug: $tagNameOrSlug, pagination: $pagination, idBusiness: $idBusiness, idProducts: $idProducts) {
        items {
          id
        }
        total
      }
    }
  `;

  const getAllByTagsQuery = `
    query GetAllByTags($tagNamesOrSlugs: [String!]!, $pagination: InfinityScrollInput!, $idBusiness: Int, $idProducts: [Int!]) {
      getAllByTags(tagNamesOrSlugs: $tagNamesOrSlugs, pagination: $pagination, idBusiness: $idBusiness, idProducts: $idProducts) {
        items {
          id
        }
        total
      }
    }
  `;

  const findOneProductQuery = `
    query FindOneProduct($id: Int!) {
      findOneProduct(id: $id) {
        id
      }
    }
  `;

  const getMainTagsQuery = `
    query GetMainTags($limit: Int) {
      getMainTags(limit: $limit) {
        id
        name
        slug
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [ProductsResolver, ProductRatingsResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('likes a product for authenticated user', async () => {
    productReactionsServiceMock.likeProduct.mockResolvedValue({
      id: 7,
      idProduct: 25,
      type: 'like',
      status: 'active',
    });

    const response = await executeGraphql({
      app,
      query: likeProductMutation,
      variables: {
        idProduct: 25,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.likeProduct.idProduct).toBe(25);
    expect(productReactionsServiceMock.likeProduct).toHaveBeenCalledWith(
      25,
      expect.objectContaining({ userId: 1 }),
    );
  });

  it('unlikes a product for authenticated user', async () => {
    productReactionsServiceMock.unlikeProduct.mockResolvedValue(true);

    const response = await executeGraphql({
      app,
      query: unlikeProductMutation,
      variables: {
        idProduct: 25,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.unlikeProduct).toBe(true);
  });

  it('returns hasLikedProduct state', async () => {
    productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue({
      id: 7,
      status: 'active',
    });

    const response = await executeGraphql({
      app,
      query: hasLikedProductQuery,
      variables: {
        idProduct: 25,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.hasLikedProduct).toBe(true);
  });

  it('rates a product for authenticated user', async () => {
    productRatingsServiceMock.rateProduct.mockResolvedValue({
      id: 90,
      idProduct: 25,
      stars: 5,
      comment: 'Excellent',
    });

    const response = await executeGraphql({
      app,
      query: rateProductMutation,
      variables: {
        data: {
          idProduct: 25,
          stars: 5,
          comment: 'Excellent',
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.rateProduct.idProduct).toBe(25);
    expect(productRatingsServiceMock.rateProduct).toHaveBeenCalledTimes(1);
  });

  it('returns paginated ratings for a product', async () => {
    productRatingsGettersServiceMock.findAllByProductPaginated.mockResolvedValue([
      {
        id: 90,
        idProduct: 25,
        stars: 5,
      },
    ]);

    const response = await executeGraphql({
      app,
      query: productRatingsQuery,
      variables: {
        idProduct: 25,
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.productRatings.total).toBe(1);
  });

  it('returns my rating for a product', async () => {
    productRatingsGettersServiceMock.findOneByProductAndUser.mockResolvedValue({
      id: 90,
      idProduct: 25,
      stars: 4,
    });

    const response = await executeGraphql({
      app,
      query: myProductRatingQuery,
      variables: {
        idProduct: 25,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myProductRating.stars).toBe(4);
  });

  it('returns my paginated product ratings', async () => {
    productRatingsGettersServiceMock.findAllByUserPaginated.mockResolvedValue([
      {
        id: 91,
        idProduct: 26,
        stars: 5,
      },
    ]);

    const response = await executeGraphql({
      app,
      query: myProductRatingsQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myProductRatings.total).toBe(1);
  });

  it('returns paginated products', async () => {
    productsServiceMock.findAll.mockResolvedValue([{ id: 1 }]);

    const response = await executeGraphql({
      app,
      query: findAllProductsQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findAllProducts.total).toBe(1);
  });

  it('returns products by catalog', async () => {
    productsServiceMock.findAllByCatalog.mockResolvedValue([{ id: 2 }]);

    const response = await executeGraphql({
      app,
      query: getAllByCatalogQuery,
      variables: {
        idCatalog: 5,
        search: 'pizza',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllByCatalog).toHaveLength(1);
  });

  it('returns paginated products by catalog', async () => {
    productsServiceMock.getAllByCatalogPaginated.mockResolvedValue([{ id: 3 }]);

    const response = await executeGraphql({
      app,
      query: getAllByCatalogPaginatedQuery,
      variables: {
        idCatalog: 5,
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllByCatalogPaginated.total).toBe(1);
  });

  it('returns paginated products by business', async () => {
    productsServiceMock.findAllByBusiness.mockResolvedValue([{ id: 4 }]);

    const response = await executeGraphql({
      app,
      query: getAllByBusinessQuery,
      variables: {
        idBusiness: 7,
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllByBusiness.total).toBe(1);
  });

  it('returns primary products by business', async () => {
    productsServiceMock.findAllByBusinessAndIsPrimary.mockResolvedValue([
      { id: 5 },
    ]);

    const response = await executeGraphql({
      app,
      query: getAllPrimaryProductsByBusinessQuery,
      variables: {
        data: {
          idBusiness: 7,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllPrimaryProductsByBusiness).toHaveLength(1);
  });

  it('returns products filtered by a tag', async () => {
    productsServiceMock.findAllByTag.mockResolvedValue([{ id: 6 }]);

    const response = await executeGraphql({
      app,
      query: getAllByTagQuery,
      variables: {
        tagNameOrSlug: 'pizza',
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllByTag.total).toBe(1);
  });

  it('returns products filtered by multiple tags', async () => {
    productsServiceMock.findAllByTags.mockResolvedValue([{ id: 7 }]);

    const response = await executeGraphql({
      app,
      query: getAllByTagsQuery,
      variables: {
        tagNamesOrSlugs: ['pizza', 'cheese'],
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getAllByTags.total).toBe(1);
  });

  it('returns one product by id', async () => {
    productsServiceMock.findOne.mockResolvedValue({ id: 8 });

    const response = await executeGraphql({
      app,
      query: findOneProductQuery,
      variables: {
        id: 8,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findOneProduct.id).toBe(8);
  });

  it('returns main tags', async () => {
    tagsServiceMock.findMainTags.mockResolvedValue([
      { id: 1, name: 'pizza', slug: 'pizza' },
    ]);

    const response = await executeGraphql({
      app,
      query: getMainTagsQuery,
      variables: {
        limit: 5,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.getMainTags).toHaveLength(1);
    expect(response.body.data.getMainTags[0].slug).toBe('pizza');
  });
});
