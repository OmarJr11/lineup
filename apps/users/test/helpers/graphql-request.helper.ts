import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

type GraphqlRequestParams = {
  readonly app: INestApplication;
  readonly query: string;
  readonly variables?: Record<string, unknown>;
  readonly headers?: Record<string, string>;
};

/**
 * Executes a GraphQL operation against the in-memory Nest HTTP server.
 */
export const executeGraphql = async (
  params: GraphqlRequestParams,
): Promise<request.Response> => {
  const operation = request(params.app.getHttpServer())
    .post('/graphql')
    .send({
      query: params.query,
      variables: params.variables ?? {},
    });

  const headers = params.headers ?? {};
  for (const [name, value] of Object.entries(headers)) {
    operation.set(name, value);
  }

  return await operation;
};
