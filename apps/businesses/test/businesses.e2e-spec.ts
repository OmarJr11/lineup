import type { INestApplication } from '@nestjs/common';
import { BusinessesResolver } from '../src/businesses/businesses.resolver';
import { BusinessesService } from '../../../core/modules/businesses/businesses.service';
import { TokensService } from '../../../core/modules/token/token.service';
import { AuthService } from '../../../core/modules/auth/auth.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses BusinessesResolver e2e', () => {
  const businessesServiceMock = {
    create: jest.fn(),
    findOneByPath: jest.fn(),
    findOne: jest.fn(),
    changePassword: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    remove: jest.fn(),
  };
  const tokensServiceMock = {
    generateTokens: jest.fn(),
  };
  const authServiceMock = {
    setCookies: jest.fn(),
  };

  const providers = [
    { provide: BusinessesService, useValue: businessesServiceMock },
    { provide: TokensService, useValue: tokensServiceMock },
    { provide: AuthService, useValue: authServiceMock },
  ];

  const createBusinessMutation = `
    mutation CreateBusiness($data: CreateBusinessInput!) {
      createBusiness(data: $data) {
        status
      }
    }
  `;
  const findBusinessByPathQuery = `
    query FindBusinessByPath($path: String!) {
      findBusinessByPath(path: $path) { id path }
    }
  `;
  const myBusinessQuery = `
    query MyBusiness { myBusiness { id } }
  `;
  const changeBusinessPasswordMutation = `
    mutation ChangeBusinessPassword($data: ChangePasswordInput!) {
      changeBusinessPassword(data: $data)
    }
  `;
  const updateBusinessMutation = `
    mutation UpdateBusiness($data: UpdateBusinessInput!) {
      updateBusiness(data: $data) { id name }
    }
  `;
  const updateBusinessEmailMutation = `
    mutation UpdateBusinessEmail($data: UpdateBusinessEmailInput!) {
      updateBusinessEmail(data: $data) { id email }
    }
  `;
  const removeBusinessMutation = `
    mutation RemoveBusiness { removeBusiness { id } }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [BusinessesResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createBusiness', async () => {
    businessesServiceMock.create.mockResolvedValue({ id: 1 });
    tokensServiceMock.generateTokens.mockResolvedValue({
      token: 'a',
      refreshToken: 'b',
    });
    authServiceMock.setCookies.mockResolvedValue({ status: true });
    const response = await executeGraphql({
      app,
      query: createBusinessMutation,
      variables: {
        data: {
          email: 'biz@lineup.com',
          name: 'Biz',
          password: 'Secret123',
          role: 'BUSINESS',
        },
      },
    });
    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createBusiness.status).toBe(true);
  });

  it('covers findBusinessByPath', async () => {
    businessesServiceMock.findOneByPath.mockResolvedValue({ id: 1, path: 'biz' });
    const response = await executeGraphql({
      app,
      query: findBusinessByPathQuery,
      variables: { path: 'biz' },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findBusinessByPath.id).toBe(1);
  });

  it('covers myBusiness', async () => {
    businessesServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({ app, query: myBusinessQuery });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.myBusiness.id).toBe(1);
  });

  it('covers changeBusinessPassword', async () => {
    businessesServiceMock.changePassword.mockResolvedValue(true);
    const response = await executeGraphql({
      app,
      query: changeBusinessPasswordMutation,
      variables: {
        data: { currentPassword: 'A12345678', newPassword: 'B12345678' },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.changeBusinessPassword).toBe(true);
  });

  it('covers updateBusiness', async () => {
    businessesServiceMock.update.mockResolvedValue({ id: 1, name: 'New Biz' });
    const response = await executeGraphql({
      app,
      query: updateBusinessMutation,
      variables: { data: { id: 1, name: 'New Biz' } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateBusiness.name).toBe('New Biz');
  });

  it('covers updateBusinessEmail', async () => {
    businessesServiceMock.updateEmail.mockResolvedValue({
      id: 1,
      email: 'new@lineup.com',
    });
    const response = await executeGraphql({
      app,
      query: updateBusinessEmailMutation,
      variables: { data: { email: 'new@lineup.com' } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateBusinessEmail.email).toBe('new@lineup.com');
  });

  it('covers removeBusiness', async () => {
    businessesServiceMock.remove.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({ app, query: removeBusinessMutation });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeBusiness.id).toBe(1);
  });
});
