import { UnauthorizedException } from '@nestjs/common';
import { TokenGuard } from './tokens.guard';

/**
 * Unit tests for {@link TokenGuard}.
 */
describe('TokenGuard', () => {
  let guard: TokenGuard;
  const tokenGettersMock = {
    findOneByTokenOrFail: jest.fn(),
  };

  const buildContext = (request: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getArgByIndex: jest.fn(),
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new TokenGuard(tokenGettersMock as any);
  });

  it('extracts token from cookies.token and validates', async () => {
    const ctx = buildContext({
      cookies: { token: 'cookie-jwt' },
      headers: {},
    });
    tokenGettersMock.findOneByTokenOrFail.mockResolvedValue({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(tokenGettersMock.findOneByTokenOrFail).toHaveBeenCalledWith(
      'cookie-jwt',
    );
  });

  it('extracts token from custom header', async () => {
    const ctx = buildContext({
      cookies: {},
      headers: { token: 'header-jwt' },
    });
    tokenGettersMock.findOneByTokenOrFail.mockResolvedValue({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(tokenGettersMock.findOneByTokenOrFail).toHaveBeenCalledWith(
      'header-jwt',
    );
  });

  it('extracts token from Authorization bearer header', async () => {
    const ctx = buildContext({
      cookies: {},
      headers: { authorization: 'Bearer bearer-jwt' },
    });
    tokenGettersMock.findOneByTokenOrFail.mockResolvedValue({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(tokenGettersMock.findOneByTokenOrFail).toHaveBeenCalledWith(
      'bearer-jwt',
    );
  });

  it('extracts token from raw Cookie header as fallback', async () => {
    const ctx = buildContext({
      cookies: {},
      headers: { cookie: 'session=abc; mytoken=raw-jwt; other=123' },
    });
    tokenGettersMock.findOneByTokenOrFail.mockResolvedValue({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(tokenGettersMock.findOneByTokenOrFail).toHaveBeenCalledWith(
      'raw-jwt',
    );
  });

  it('throws UnauthorizedException when no token is found', async () => {
    const ctx = buildContext({
      cookies: {},
      headers: {},
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('falls back to GraphQL context when HTTP request is null', async () => {
    const gqlReq = {
      cookies: { token: 'gql-jwt' },
      headers: {},
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => undefined,
      }),
      getArgByIndex: jest.fn().mockReturnValue({ req: gqlReq }),
    } as any;
    tokenGettersMock.findOneByTokenOrFail.mockResolvedValue({});

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(tokenGettersMock.findOneByTokenOrFail).toHaveBeenCalledWith(
      'gql-jwt',
    );
  });
});
