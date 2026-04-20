import type { INestApplication } from '@nestjs/common';
import { BusinessHoursResolver } from '../src/business-hours/business-hours.resolver';
import { BusinessHoursService } from '../../../core/modules/business-hours/business-hours.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users BusinessHours e2e', () => {
  const businessHoursServiceMock = {
    findAllByBusiness: jest.fn(),
  };

  const providers = [
    { provide: BusinessHoursService, useValue: businessHoursServiceMock },
  ];

  const findBusinessHoursByBusinessIdQuery = `
    query FindBusinessHoursByBusinessId($idBusiness: Int!) {
      findBusinessHoursByBusinessId(idBusiness: $idBusiness) {
        id
        idBusiness
        dayOfWeek
        opensAtMinute
        closesAtMinute
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [BusinessHoursResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns business hours by business id', async () => {
    businessHoursServiceMock.findAllByBusiness.mockResolvedValue([
      {
        id: 1,
        idBusiness: 7,
        dayOfWeek: 'Lunes',
        opensAtMinute: 540,
        closesAtMinute: 1080,
      },
    ]);

    const response = await executeGraphql({
      app,
      query: findBusinessHoursByBusinessIdQuery,
      variables: {
        idBusiness: 7,
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findBusinessHoursByBusinessId).toHaveLength(1);
    expect(response.body.data.findBusinessHoursByBusinessId[0].idBusiness).toBe(
      7,
    );
  });
});
