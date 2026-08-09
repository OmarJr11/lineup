import type { INestApplication } from '@nestjs/common';
import { SocialNetworkBusinessesResolver } from '../src/social-network-businesses/social-network-businesses.resolver';
import { SocialNetworkBusinessesService } from '../../../core/modules/social-network-businesses/social-network-businesses.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses SocialNetworkBusinesses e2e', () => {
  const socialNetworkBusinessesServiceMock = {
    create: jest.fn(),
    findByBusiness: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const providers = [
    {
      provide: SocialNetworkBusinessesService,
      useValue: socialNetworkBusinessesServiceMock,
    },
  ];

  const createSocialNetworkBusinessMutation = `mutation CreateSocialNetworkBusiness($data: CreateSocialNetworkBusinessInput!) { createSocialNetworkBusiness(data: $data) { id } }`;
  const findAllMySocialNetworkBusinessesQuery = `query FindAllMySocialNetworkBusinesses { findAllMySocialNetworkBusinesses { id } }`;
  const findByBusinessQuery = `query FindByBusiness($idBusiness: Int!) { findByBusiness(idBusiness: $idBusiness) { id } }`;
  const findOneSocialNetworkBusinessQuery = `query FindOneSocialNetworkBusiness($id: Int!) { findOneSocialNetworkBusiness(id: $id) { id } }`;
  const updateSocialNetworkBusinessMutation = `mutation UpdateSocialNetworkBusiness($data: UpdateSocialNetworkBusinessInput!) { updateSocialNetworkBusiness(data: $data) { id } }`;
  const removeSocialNetworkBusinessMutation = `mutation RemoveSocialNetworkBusiness($id: Int!) { removeSocialNetworkBusiness(id: $id) }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [SocialNetworkBusinessesResolver],
      providers,
    });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createSocialNetworkBusiness', async () => {
    socialNetworkBusinessesServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createSocialNetworkBusinessMutation,
      variables: {
        data: {
          idSocialNetwork: 1,
          contact: { url: 'https://instagram.com/demo' },
        },
      },
    });
    expect(response.body.data.createSocialNetworkBusiness.id).toBe(1);
  });
  it('covers findAllMySocialNetworkBusinesses', async () => {
    socialNetworkBusinessesServiceMock.findByBusiness.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllMySocialNetworkBusinessesQuery,
    });
    expect(response.body.data.findAllMySocialNetworkBusinesses).toHaveLength(1);
  });
  it('covers findByBusiness', async () => {
    socialNetworkBusinessesServiceMock.findByBusiness.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findByBusinessQuery,
      variables: { idBusiness: 1 },
    });
    expect(response.body.data.findByBusiness).toHaveLength(1);
  });
  it('covers findOneSocialNetworkBusiness', async () => {
    socialNetworkBusinessesServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneSocialNetworkBusinessQuery,
      variables: { id: 1 },
    });
    expect(response.body.data.findOneSocialNetworkBusiness.id).toBe(1);
  });
  it('covers updateSocialNetworkBusiness', async () => {
    socialNetworkBusinessesServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateSocialNetworkBusinessMutation,
      variables: {
        data: {
          id: 1,
          contact: { url: 'https://instagram.com/new' },
        },
      },
    });
    expect(response.body.data.updateSocialNetworkBusiness.id).toBe(1);
  });
  it('covers removeSocialNetworkBusiness', async () => {
    socialNetworkBusinessesServiceMock.remove.mockResolvedValue(true);
    const response = await executeGraphql({
      app,
      query: removeSocialNetworkBusinessMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.removeSocialNetworkBusiness).toBe(true);
  });
});
