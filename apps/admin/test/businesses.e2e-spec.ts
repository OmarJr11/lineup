import type { INestApplication } from '@nestjs/common';
import { BusinessesResolver } from '../src/businesses/businesses.resolver';
import { BusinessesService } from '../../../core/modules/businesses/businesses.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin Businesses e2e', () => {
  const businessesServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const providers = [
    { provide: BusinessesService, useValue: businessesServiceMock },
  ];

  const findAllBusinessesQuery = `
    query FindAllBusinesses($pagination: InfinityScrollInput!) {
      findAllBusinesses(pagination: $pagination) { total }
    }
  `;
  const findOneBusinessQuery = `
    query FindOneBusiness($id: Int!) {
      findOneBusiness(id: $id) { id }
    }
  `;
  const updateBusinessMutation = `
    mutation UpdateBusiness($data: UpdateBusinessInput!) {
      updateBusiness(data: $data) { id }
    }
  `;
  const removeBusinessMutation = `
    mutation RemoveBusiness($id: Int!) {
      removeBusiness(id: $id)
    }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [BusinessesResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers findAllBusinesses', async () => {
    businessesServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllBusinessesQuery,
      variables: { pagination: { page: 1, limit: 10 } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findAllBusinesses.total).toBe(1);
  });

  it('covers findOneBusiness', async () => {
    businessesServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneBusinessQuery,
      variables: { id: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findOneBusiness.id).toBe(1);
  });

  it('covers updateBusiness', async () => {
    businessesServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateBusinessMutation,
      variables: { data: { id: 1, name: 'Updated' } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateBusiness.id).toBe(1);
  });

  it('covers removeBusiness', async () => {
    businessesServiceMock.remove.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeBusinessMutation,
      variables: { id: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeBusiness).toBe(true);
  });
});
