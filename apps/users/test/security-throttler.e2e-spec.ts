import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import {
  GraphQLModule,
  Query,
  Resolver,
  ObjectType,
  Field,
} from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import * as depthLimitLib from 'graphql-depth-limit';
const depthLimit = (depthLimitLib as any).default || depthLimitLib;
import * as request from 'supertest';
import { GqlThrottlerGuard } from '../../../core/common/guards/gql-throttler.guard';

@ObjectType()
class Level4 {
  @Field()
  val: string;
}

@ObjectType()
class Level3 {
  @Field(() => Level4, { nullable: true })
  next?: Level4;
}

@ObjectType()
class Level2 {
  @Field(() => Level3, { nullable: true })
  next?: Level3;
}

@ObjectType()
class Level1 {
  @Field(() => Level2, { nullable: true })
  next?: Level2;
}

@Resolver()
class SecurityTestResolver {
  @Query(() => String)
  ping(): string {
    return 'pong';
  }

  @Query(() => Level1)
  nested(): Level1 {
    return { next: { next: { next: { val: 'deep' } } } };
  }
}

describe('Security & Anti-DoS E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          path: '/graphql',
          context: ({ req, res }) => ({ req, res }),
          validationRules: [depthLimit(3)],
          formatError: (error: any) => {
            const message = error?.message || 'Internal server error';
            const extResponse = error?.extensions?.response;
            const code = extResponse?.statusCode ?? 500;
            return { message, code };
          },
        }),
        ThrottlerModule.forRoot([
          {
            name: 'test',
            ttl: 10000,
            limit: 2,
          },
        ]),
      ],
      providers: [
        SecurityTestResolver,
        {
          provide: APP_GUARD,
          useClass: GqlThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GraphQL Depth Limit', () => {
    it('allows queries within the maximum allowed depth', async () => {
      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ ping }' });

      expect(res.status).toBe(200);
      expect(res.body.data?.ping).toBe('pong');
    });

    it('rejects queries that exceed the maximum allowed depth of 3', async () => {
      const deepQuery = `
        query {
          nested {
            next {
              next {
                next {
                  val
                }
              }
            }
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: deepQuery });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toMatch(
        /exceeds maximum operation depth of 3/i,
      );
    });
  });

  describe('Rate Limiting (GqlThrottlerGuard)', () => {
    it('blocks subsequent requests once the limit is exceeded', async () => {
      // Petición 1: permitida
      const req1 = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ ping }' });
      expect(req1.status).toBe(200);

      // Petición 2: permitida (límite = 2)
      const req2 = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ ping }' });
      expect(req2.status).toBe(200);

      // Petición 3: bloqueada por ThrottlerGuard
      const req3 = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: '{ ping }' });

      expect(req3.body.errors).toBeDefined();
      expect(req3.body.errors[0].message).toMatch(/Too Many Requests/i);
    });
  });
});
