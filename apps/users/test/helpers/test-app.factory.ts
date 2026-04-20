import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Type } from '@nestjs/common/interfaces/type.interface';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ExecutionContext } from '@nestjs/common/interfaces/features/execution-context.interface';
import { GraphQLModule, GqlExecutionContext } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Query, Resolver } from '@nestjs/graphql';
import {
  JwtAuthGuard,
  OptionalJwtAuthGuard,
  PermissionsGuard,
  TokenGuard,
} from '../../../../core/common/guards';
import { ICookieInterceptor } from '../../../../core/common/interfaces';

type GuardUser = {
  readonly userId: number;
};

type GuardBehavior = {
  readonly allow: boolean;
  readonly user?: GuardUser | null;
};

type GuardOverrides = {
  readonly jwt?: GuardBehavior;
  readonly token?: GuardBehavior;
  readonly permissions?: GuardBehavior;
  readonly optionalJwt?: GuardBehavior;
};

type CreateTestAppParams = {
  readonly resolvers?: Type<unknown>[];
  readonly controllers?: Type<unknown>[];
  readonly providers?: Provider[];
  readonly guardOverrides?: GuardOverrides;
  readonly enableGraphql?: boolean;
};

const defaultGuardUser: GuardUser = {
  userId: 1,
};

const defaultGuardBehavior: GuardBehavior = {
  allow: true,
  user: defaultGuardUser,
};

@Resolver()
class TestRootResolver {
  @Query(() => String, { name: '_testHealth' })
  public testHealth(): string {
    return 'ok';
  }
}

const createGuardMock = (behavior: GuardBehavior): { canActivate: (context: ExecutionContext) => boolean } => {
  return {
    canActivate: (context: ExecutionContext): boolean => {
      if (!behavior.allow) {
        return false;
      }
      if (behavior.user === undefined) {
        return true;
      }
      const request = getRequestFromContext(context);
      if (request) {
        request.user = behavior.user;
      }
      return true;
    },
  };
};

const getRequestFromContext = (context: ExecutionContext): Record<string, unknown> | undefined => {
  try {
    const gqlContext = GqlExecutionContext.create(context).getContext<{
      req?: Record<string, unknown>;
    }>();
    if (gqlContext?.req) {
      return gqlContext.req;
    }
  } catch (err) {
    // Ignore GraphQL context parsing errors and fallback to HTTP request.
  }
  return context.switchToHttp().getRequest<Record<string, unknown>>();
};

/**
 * Creates a lightweight e2e Nest application with GraphQL enabled by default.
 * Guards are mocked by class token so resolver decorators keep working.
 */
export const createTestApp = async (
  params: CreateTestAppParams,
): Promise<INestApplication> => {
  const imports = [];
  if (params.enableGraphql !== false) {
    imports.push(
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        path: '/graphql',
        context: ({ req, res }) => ({ req, res }),
      }),
    );
  }
  const moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports,
    controllers: params.controllers ?? [],
    providers: [
      ...(params.enableGraphql !== false ? [TestRootResolver] : []),
      ...(params.resolvers ?? []),
      ...(params.providers ?? []),
      {
        provide: ICookieInterceptor,
        useValue: {
          intercept: (_context: unknown, next: { handle: () => unknown }) =>
            next.handle(),
        },
      },
    ],
  });
  moduleBuilder
    .overrideGuard(JwtAuthGuard)
    .useValue(createGuardMock(params.guardOverrides?.jwt ?? defaultGuardBehavior));
  moduleBuilder
    .overrideGuard(TokenGuard)
    .useValue(
      createGuardMock(params.guardOverrides?.token ?? defaultGuardBehavior),
    );
  moduleBuilder
    .overrideGuard(PermissionsGuard)
    .useValue(
      createGuardMock(
        params.guardOverrides?.permissions ?? defaultGuardBehavior,
      ),
    );
  moduleBuilder
    .overrideGuard(OptionalJwtAuthGuard)
    .useValue(
      createGuardMock(
        params.guardOverrides?.optionalJwt ?? defaultGuardBehavior,
      ),
    );
  moduleBuilder.overrideInterceptor(ICookieInterceptor).useValue({
    intercept: (_context: unknown, next: { handle: () => unknown }) =>
      next.handle(),
  });
  const moduleFixture: TestingModule = await moduleBuilder.compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
};
