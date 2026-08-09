import type { INestApplication } from '@nestjs/common';
import { SocialNetworksResolver } from '../src/social-networks/social-networks.resolver';
import { SocialNetworksService } from '../../../core/modules/social-networks/social-networks.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Admin SocialNetworks e2e', () => {
  const socialNetworksServiceMock = {
    create: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const providers = [
    { provide: SocialNetworksService, useValue: socialNetworksServiceMock },
  ];

  const createSocialNetworkMutation = `
    mutation CreateSocialNetwork($data: CreateSocialNetworkInput!) {
      createSocialNetwork(data: $data) { id }
    }
  `;
  const findSocialNetworkByIdQuery = `
    query FindSocialNetworkById($id: Int!) {
      findSocialNetworkById(id: $id) { id }
    }
  `;
  const findSocialNetworkByCodeQuery = `
    query FindSocialNetworkByCode($code: SocialMediasEnum!) {
      findSocialNetworkByCode(code: $code) { id }
    }
  `;
  const findAllSocialNetworksQuery = `
    query FindAllSocialNetworks {
      findAllSocialNetworks { id }
    }
  `;
  const updateSocialNetworkMutation = `
    mutation UpdateSocialNetwork($data: UpdateSocialNetworkInput!) {
      updateSocialNetwork(data: $data) { id }
    }
  `;
  const removeSocialNetworkMutation = `
    mutation RemoveSocialNetwork($id: Int!) {
      removeSocialNetwork(id: $id)
    }
  `;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [SocialNetworksResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createSocialNetwork', async () => {
    socialNetworksServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createSocialNetworkMutation,
      variables: {
        data: { name: 'Instagram', code: 'instagram', imageCode: 'img-1' },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.createSocialNetwork.id).toBe(1);
  });

  it('covers findSocialNetworkById', async () => {
    socialNetworksServiceMock.findById.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findSocialNetworkByIdQuery,
      variables: { id: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findSocialNetworkById.id).toBe(1);
  });

  it('covers findSocialNetworkByCode', async () => {
    socialNetworksServiceMock.findByCode.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findSocialNetworkByCodeQuery,
      variables: { code: 'INSTAGRAM' },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findSocialNetworkByCode.id).toBe(1);
  });

  it('covers findAllSocialNetworks', async () => {
    socialNetworksServiceMock.findAll.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({ app, query: findAllSocialNetworksQuery });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findAllSocialNetworks).toHaveLength(1);
  });

  it('covers updateSocialNetwork', async () => {
    socialNetworksServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateSocialNetworkMutation,
      variables: { data: { id: 1, name: 'Insta' } },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateSocialNetwork.id).toBe(1);
  });

  it('covers removeSocialNetwork', async () => {
    socialNetworksServiceMock.remove.mockResolvedValue(undefined);
    const response = await executeGraphql({
      app,
      query: removeSocialNetworkMutation,
      variables: { id: 1 },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.removeSocialNetwork).toBe(true);
  });
});
