import type { INestApplication } from '@nestjs/common';
import { DiscountsResolver } from '../src/discounts/discounts.resolver';
import { DiscountsService } from '../../../core/modules/discounts/discounts.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Discounts e2e', () => {
  const discountsServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    findAllMyDiscountsByScope: jest.fn(),
    findActiveDiscountByProduct: jest.fn(),
    findAuditByProduct: jest.fn(),
    findAuditByDiscount: jest.fn(),
  };
  const providers = [{ provide: DiscountsService, useValue: discountsServiceMock }];

  const createDiscountMutation = `mutation CreateDiscount($data: CreateDiscountInput!) { createDiscount(data: $data) { id } }`;
  const updateDiscountMutation = `mutation UpdateDiscount($data: UpdateDiscountInput!) { updateDiscount(data: $data) { id } }`;
  const removeDiscountMutation = `mutation RemoveDiscount($id: Int!) { removeDiscount(id: $id) }`;
  const findOneDiscountQuery = `query FindOneDiscount($id: Int!) { findOneDiscount(id: $id) { id } }`;
  const findAllMyDiscountsByScopeQuery = `query FindAllMyDiscountsByScope($data: FindDiscountsByScopeInput!, $pagination: InfinityScrollInput!) { findAllMyDiscountsByScope(data: $data, pagination: $pagination) { total } }`;
  const findActiveDiscountByProductQuery = `query FindActiveDiscountByProduct($idProduct: Int!) { findActiveDiscountByProduct(idProduct: $idProduct) { id } }`;
  const findDiscountAuditByProductQuery = `query FindDiscountAuditByProduct($idProduct: Int!, $limit: Int) { findDiscountAuditByProduct(idProduct: $idProduct, limit: $limit) { id } }`;
  const findDiscountAuditByDiscountQuery = `query FindDiscountAuditByDiscount($idDiscount: Int!, $limit: Int) { findDiscountAuditByDiscount(idDiscount: $idDiscount, limit: $limit) { id } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [DiscountsResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createDiscount', async () => {
    discountsServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createDiscountMutation,
      variables: {
        data: {
          scope: 'BUSINESS',
          discountType: 'PERCENTAGE',
          value: 10,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
      },
    });
    expect(response.body.data.createDiscount.id).toBe(1);
  });
  it('covers updateDiscount', async () => {
    discountsServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateDiscountMutation,
      variables: { data: { id: 1, value: 15 } },
    });
    expect(response.body.data.updateDiscount.id).toBe(1);
  });
  it('covers removeDiscount', async () => {
    discountsServiceMock.remove.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeDiscountMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.removeDiscount).toBe(true);
  });
  it('covers findOneDiscount', async () => {
    discountsServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneDiscountQuery,
      variables: { id: 1 },
    });
    expect(response.body.data.findOneDiscount.id).toBe(1);
  });
  it('covers findAllMyDiscountsByScope', async () => {
    discountsServiceMock.findAllMyDiscountsByScope.mockResolvedValue({
      items: [{ id: 1 }],
      total: 1,
      page: 1,
      limit: 10,
    });
    const response = await executeGraphql({
      app,
      query: findAllMyDiscountsByScopeQuery,
      variables: { data: { scope: 'BUSINESS' }, pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.data.findAllMyDiscountsByScope.total).toBe(1);
  });
  it('covers findActiveDiscountByProduct', async () => {
    discountsServiceMock.findActiveDiscountByProduct.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findActiveDiscountByProductQuery,
      variables: { idProduct: 1 },
    });
    expect(response.body.data.findActiveDiscountByProduct.id).toBe(1);
  });
  it('covers findDiscountAuditByProduct', async () => {
    discountsServiceMock.findAuditByProduct.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findDiscountAuditByProductQuery,
      variables: { idProduct: 1, limit: 10 },
    });
    expect(response.body.data.findDiscountAuditByProduct).toHaveLength(1);
  });
  it('covers findDiscountAuditByDiscount', async () => {
    discountsServiceMock.findAuditByDiscount.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findDiscountAuditByDiscountQuery,
      variables: { idDiscount: 1, limit: 10 },
    });
    expect(response.body.data.findDiscountAuditByDiscount).toHaveLength(1);
  });
});
