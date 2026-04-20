import type { INestApplication } from '@nestjs/common';
import { BusinessHoursResolver } from '../src/business-hours/business-hours.resolver';
import { BusinessHoursService } from '../../../core/modules/business-hours/business-hours.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Businesses BusinessHours e2e', () => {
  const businessHoursServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllMyBusinessHours: jest.fn(),
  };
  const providers = [
    { provide: BusinessHoursService, useValue: businessHoursServiceMock },
  ];

  const createBusinessHoursMutation = `mutation CreateBusinessHours($data: CreateBusinessHoursInput!) { createBusinessHours(data: $data) { id } }`;
  const updateBusinessHourMutation = `mutation UpdateBusinessHour($data: UpdateBusinessHourInput!) { updateBusinessHour(data: $data) { id } }`;
  const removeBusinessHourMutation = `mutation RemoveBusinessHour($id: Int!) { removeBusinessHour(id: $id) }`;
  const findAllMyBusinessHoursQuery = `query FindAllMyBusinessHours { findAllMyBusinessHours { id } }`;

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({ resolvers: [BusinessHoursResolver], providers });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers createBusinessHours', async () => {
    businessHoursServiceMock.create.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: createBusinessHoursMutation,
      variables: {
        data: {
          slots: [
            {
              dayOfWeek: 'MONDAY',
              opensAtMinute: 480,
              closesAtMinute: 1020,
              slotOrder: 1,
            },
          ],
        },
      },
    });
    expect(response.body.data.createBusinessHours).toHaveLength(1);
  });
  it('covers updateBusinessHour', async () => {
    businessHoursServiceMock.update.mockResolvedValue({ id: 1 });
    const response = await executeGraphql({
      app,
      query: updateBusinessHourMutation,
      variables: { data: { id: 1, opensAtMinute: 500 } },
    });
    expect(response.body.data.updateBusinessHour.id).toBe(1);
  });
  it('covers removeBusinessHour', async () => {
    businessHoursServiceMock.remove.mockResolvedValue(true);
    const response = await executeGraphql({
      app,
      query: removeBusinessHourMutation,
      variables: { id: 1 },
    });
    expect(response.body.data.removeBusinessHour).toBe(true);
  });
  it('covers findAllMyBusinessHours', async () => {
    businessHoursServiceMock.findAllMyBusinessHours.mockResolvedValue([{ id: 1 }]);
    const response = await executeGraphql({
      app,
      query: findAllMyBusinessHoursQuery,
    });
    expect(response.body.data.findAllMyBusinessHours).toHaveLength(1);
  });
});
