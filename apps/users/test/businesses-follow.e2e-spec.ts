import type { INestApplication } from '@nestjs/common';
import { BusinessesResolver } from '../src/businesses/businesses.resolver';
import { BusinessesService } from '../../../core/modules/businesses/businesses.service';
import { BusinessFollowersService } from '../../../core/modules/business-followers/business-followers.service';
import { BusinessFollowersGettersService } from '../../../core/modules/business-followers/business-followers-getters.service';
import { executeGraphql } from './helpers/graphql-request.helper';
import { createTestApp } from './helpers/test-app.factory';

describe('Users Businesses follow e2e', () => {
  const businessesServiceMock = {
    findOne: jest.fn(),
    findOneByPath: jest.fn(),
    findAll: jest.fn(),
  };
  const businessFollowersServiceMock = {
    followBusiness: jest.fn(),
    unfollowBusiness: jest.fn(),
  };
  const businessFollowersGettersServiceMock = {
    findOneByBusinessAndUser: jest.fn(),
  };

  const providers = [
    { provide: BusinessesService, useValue: businessesServiceMock },
    {
      provide: BusinessFollowersService,
      useValue: businessFollowersServiceMock,
    },
    {
      provide: BusinessFollowersGettersService,
      useValue: businessFollowersGettersServiceMock,
    },
  ];

  const followBusinessMutation = `
    mutation FollowBusiness($idBusiness: Int!) {
      followBusiness(idBusiness: $idBusiness) {
        id
        idBusiness
        status
      }
    }
  `;

  const unfollowBusinessMutation = `
    mutation UnfollowBusiness($idBusiness: Int!) {
      unfollowBusiness(idBusiness: $idBusiness)
    }
  `;

  const isFollowingBusinessQuery = `
    query IsFollowingBusiness($idBusiness: Int!) {
      isFollowingBusiness(idBusiness: $idBusiness)
    }
  `;

  const findOneBusinessQuery = `
    query FindOneBusiness($id: Int!) {
      findOneBusiness(id: $id) {
        id
      }
    }
  `;

  const findBusinessByPathQuery = `
    query FindBusinessByPath($path: String!) {
      findBusinessByPath(path: $path) {
        id
        path
      }
    }
  `;

  const findAllBusinessesQuery = `
    query FindAllBusinesses($pagination: InfinityScrollInput!) {
      findAllBusinesses(pagination: $pagination) {
        items {
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
      resolvers: [BusinessesResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('follows a business', async () => {
    businessFollowersServiceMock.followBusiness.mockResolvedValue({
      id: 10,
      idBusiness: 12,
      status: 'active',
    });

    const response = await executeGraphql({
      app,
      query: followBusinessMutation,
      variables: {
        idBusiness: 12,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.followBusiness.idBusiness).toBe(12);
  });

  it('unfollows a business', async () => {
    businessFollowersServiceMock.unfollowBusiness.mockResolvedValue(true);

    const response = await executeGraphql({
      app,
      query: unfollowBusinessMutation,
      variables: {
        idBusiness: 12,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.unfollowBusiness).toBe(true);
  });

  it('checks if authenticated user is following a business', async () => {
    businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue({
      id: 10,
      status: 'active',
    });

    const response = await executeGraphql({
      app,
      query: isFollowingBusinessQuery,
      variables: {
        idBusiness: 12,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.isFollowingBusiness).toBe(true);
  });

  it('gets one business by id', async () => {
    businessesServiceMock.findOne.mockResolvedValue({
      id: 12,
    });

    const response = await executeGraphql({
      app,
      query: findOneBusinessQuery,
      variables: {
        id: 12,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findOneBusiness.id).toBe(12);
  });

  it('gets one business by path', async () => {
    businessesServiceMock.findOneByPath.mockResolvedValue({
      id: 12,
      path: 'pizza-hub',
    });

    const response = await executeGraphql({
      app,
      query: findBusinessByPathQuery,
      variables: {
        path: 'pizza-hub',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findBusinessByPath.path).toBe('pizza-hub');
  });

  it('gets paginated businesses', async () => {
    businessesServiceMock.findAll.mockResolvedValue([
      {
        id: 12,
      },
    ]);

    const response = await executeGraphql({
      app,
      query: findAllBusinessesQuery,
      variables: {
        pagination: {
          page: 1,
          limit: 10,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findAllBusinesses.total).toBe(1);
  });
});
