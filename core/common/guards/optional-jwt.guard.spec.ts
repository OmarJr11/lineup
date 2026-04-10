import type { ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { Request } from 'express';
import { OptionalJwtAuthGuard } from './optional-jwt.guard';

/**
 * Unit tests for {@link OptionalJwtAuthGuard}.
 */
describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;
  const verifyMock = jest.fn();
  const jwtService = { verify: verifyMock } as unknown as JwtService;
  let gqlCreateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new OptionalJwtAuthGuard(jwtService);
    gqlCreateSpy = jest.spyOn(GqlExecutionContext, 'create');
  });

  afterEach(() => {
    gqlCreateSpy.mockRestore();
  });

  const bindRequest = (req: Partial<Request>): ExecutionContext => {
    gqlCreateSpy.mockReturnValue({
      getContext: () => ({ req }),
    });
    return {
      getHandler: () => (): void => undefined,
      getClass: () => class Test {},
    } as unknown as ExecutionContext;
  };

  it('sets user to null when no token is present', async () => {
    const req = { headers: {}, cookies: {} } as Request;
    await guard.canActivate(bindRequest(req));
    expect(req.user).toBeNull();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it('sets IUserReq when token verifies as a user', async () => {
    const req = {
      headers: { authorization: 'Bearer jwt-token' },
      cookies: {},
    } as Request;
    verifyMock.mockReturnValue({
      isBusiness: false,
      sub: 42,
      username: 'alice',
    });
    await guard.canActivate(bindRequest(req));
    expect(verifyMock).toHaveBeenCalledWith('jwt-token');
    expect(req.user).toEqual({ userId: 42, username: 'alice' });
  });

  it('sets user to null for business tokens', async () => {
    const req = {
      headers: { authorization: 'Bearer b-token' },
      cookies: {},
    } as Request;
    verifyMock.mockReturnValue({ isBusiness: true, sub: 1 });
    await guard.canActivate(bindRequest(req));
    expect(req.user).toBeNull();
  });

  it('sets user to null when verify throws', async () => {
    const req = {
      headers: { authorization: 'Bearer bad' },
      cookies: {},
    } as Request;
    verifyMock.mockImplementation(() => {
      throw new Error('invalid');
    });
    await guard.canActivate(bindRequest(req));
    expect(req.user).toBeNull();
  });
});
