import type { INestApplication } from '@nestjs/common';
import { VisitsResolver } from '../src/visits/visits.resolver';
import { VisitsService } from '../../../core/modules/visits/visits.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users Visits e2e', () => {
  const visitsServiceMock = {
    recordVisit: jest.fn(),
  };

  const providers = [{ provide: VisitsService, useValue: visitsServiceMock }];

  const recordVisitMutation = `
    mutation RecordVisit($input: RecordVisitInput!) {
      recordVisit(input: $input)
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [VisitsResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('records a visit', async () => {
    visitsServiceMock.recordVisit.mockResolvedValue(undefined);

    const response = await executeGraphql({
      app,
      query: recordVisitMutation,
      variables: {
        input: {
          type: 'BUSINESS',
          id: 99,
        },
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.recordVisit).toBe(true);
    expect(visitsServiceMock.recordVisit).toHaveBeenCalledTimes(1);
  });
});
