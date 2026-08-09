import type { INestApplication } from '@nestjs/common';
import { SocialNetworksResolver } from '../src/social-networks/social-networks.resolver';
import { SocialNetworksService } from '../../../core/modules/social-networks/social-networks.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses SocialNetworks e2e', () => {
  const socialNetworksServiceMock = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
  };
  const providers = [
    { provide: SocialNetworksService, useValue: socialNetworksServiceMock },
  ];
  const findSocialNetworkByIdQuery = `query FindSocialNetworkById($id: Int!) { findSocialNetworkById(id: $id) { id } }`;
  const findSocialNetworkByCodeQuery = `query FindSocialNetworkByCode($code: SocialMediasEnum!) { findSocialNetworkByCode(code: $code) { id } }`;
  const findAllSocialNetworksQuery = `query FindAllSocialNetworks { findAllSocialNetworks { id } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [SocialNetworksResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers findSocialNetworkById', async () => {
    socialNetworksServiceMock.findById.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findSocialNetworkByIdQuery,
      variables: { id: 1 },
    });
    expect(response.body.data.findSocialNetworkById.id).toBe(1);
  });
  it('covers findSocialNetworkByCode', async () => {
    socialNetworksServiceMock.findByCode.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findSocialNetworkByCodeQuery,
      variables: { code: 'INSTAGRAM' },
    });
    expect(response.body.data.findSocialNetworkByCode.id).toBe(1);
  });
  it('covers findAllSocialNetworks', async () => {
    socialNetworksServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({ app, query: findAllSocialNetworksQuery });
    expect(response.body.data.findAllSocialNetworks).toHaveLength(1);
  });
});
