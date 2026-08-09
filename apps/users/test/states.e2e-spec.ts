import type { INestApplication } from '@nestjs/common';
import { StatesResolver } from '../src/states/states.resolver';
import { StatesService } from '../../../core/modules/states/states.service';
import { createTestApp } from './helpers/test-app.factory';
import { executeGraphql } from './helpers/graphql-request.helper';

describe('Users States e2e', () => {
  const statesServiceMock = {
    findAll: jest.fn(),
  };

  const providers = [{ provide: StatesService, useValue: statesServiceMock }];

  const findAllStatesQuery = `
    query FindAllStates {
      findAllStates {
        id
        name
        status
      }
    }
  `;

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await createTestApp({
      resolvers: [StatesResolver],
      providers,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns all states', async () => {
    statesServiceMock.findAll.mockResolvedValue([
      {
        id: 1,
        name: 'Jalisco',
        status: 'active',
      },
    ]);

    const response = await executeGraphql({
      app,
      query: findAllStatesQuery,
    });

    expect(response.status).toBe(200);
    expect(response.body.errors).toBeUndefined();
    expect(response.body.data.findAllStates).toHaveLength(1);
    expect(response.body.data.findAllStates[0].name).toBe('Jalisco');
  });
});
