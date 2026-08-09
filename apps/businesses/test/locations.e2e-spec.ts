import type { INestApplication } from '@nestjs/common';
import { LocationsResolver } from '../src/locations/locations.resolver';
import { LocationsService } from '../../../core/modules/locations/locations.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses Locations e2e', () => {
  const locationsServiceMock = {
    create: jest.fn(),
    findAllMyLocations: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const providers = [{ provide: LocationsService, useValue: locationsServiceMock }];
  const createLocationMutation = `mutation CreateLocation($data: CreateLocationInput!) { createLocation(data: $data) { id } }`;
  const findAllMyLocationsQuery = `query FindAllMyLocations { findAllMyLocations { id } }`;
  const findOneLocationQuery = `query FindOneLocation($id: Int!) { findOneLocation(id: $id) { id } }`;
  const updateLocationMutation = `mutation UpdateLocation($data: UpdateLocationInput!) { updateLocation(data: $data) { id } }`;
  const removeLocationMutation = `mutation RemoveLocation($id: Float!) { removeLocation(id: $id) }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [LocationsResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createLocation', async () => {
    locationsServiceMock.create.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: createLocationMutation,
      variables: {
        data: {
          name: 'Main Store',
          lat: 10.5,
          lng: -66.9,
          address: 'Street 1',
          formattedAddress: 'Street 1, City',
        },
      },
    });
    expect(response.body.data.createLocation.id).toBe(1);
  });
  it('covers findAllMyLocations', async () => {
    locationsServiceMock.findAllMyLocations.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({ app, query: findAllMyLocationsQuery });
    expect(response.body.data.findAllMyLocations).toHaveLength(1);
  });
  it('covers findOneLocation', async () => {
    locationsServiceMock.findOne.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: findOneLocationQuery,
      variables: { id: 1 },
    });
    expect(response.body.data.findOneLocation.id).toBe(1);
  });
  it('covers updateLocation', async () => {
    locationsServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateLocationMutation,
      variables: {
        data: {
          id: 1,
          name: 'Updated',
          lat: 10.5,
          lng: -66.9,
          address: 'Street 1',
          formattedAddress: 'Street 1, City',
        },
      },
    });
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.updateLocation.id).toBe(1);
  });
  it('covers removeLocation', async () => {
    locationsServiceMock.remove.mockResolvedValue(true);
    const response = await executeGraphql({
      app,
      query: removeLocationMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.removeLocation).toBe(true);
  });
});
