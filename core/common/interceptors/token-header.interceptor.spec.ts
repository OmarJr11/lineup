import { CallHandler, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { of } from 'rxjs';
import { TokenHeaderInterceptor } from './token-header.interceptor';

/**
 * Unit tests for {@link TokenHeaderInterceptor}.
 */
describe('TokenHeaderInterceptor', () => {
  let interceptor: TokenHeaderInterceptor;
  const decodeMock = jest.fn();
  const jwtService = { decode: decodeMock } as unknown as JwtService;

  const buildContext = (reqHeaders: Record<string, string> = {}) => {
    const res = { setHeader: jest.fn() };
    const req = { header: jest.fn((key: string) => reqHeaders[key]) };
    return {
      context: {
        switchToHttp: () => ({
          getResponse: () => res,
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext,
      res,
      req,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    interceptor = new TokenHeaderInterceptor(jwtService);
  });

  it('sets token_expired header from response body token', (done) => {
    const { context, res } = buildContext();
    const next: CallHandler = {
      handle: () => of({ token: 'body-token', data: {} }),
    };
    decodeMock.mockReturnValue({ exp: 1700000000, iat: 1699996400 });

    interceptor.intercept(context, next).subscribe(() => {
      expect(decodeMock).toHaveBeenCalledWith('body-token');
      expect(res.setHeader).toHaveBeenCalledWith('token_expired', 3600);
      done();
    });
  });

  it('sets token_expired header from request header token', (done) => {
    const { context, res } = buildContext({ token: 'header-token' });
    const next: CallHandler = {
      handle: () => of({ data: 'ok' }),
    };
    decodeMock.mockReturnValue({ exp: 1700003600, iat: 1700000000 });

    interceptor.intercept(context, next).subscribe(() => {
      expect(decodeMock).toHaveBeenCalledWith('header-token');
      expect(res.setHeader).toHaveBeenCalledWith('token_expired', 3600);
      done();
    });
  });

  it('sets token_expired to 0 when decode returns null', (done) => {
    const { context, res } = buildContext();
    const next: CallHandler = {
      handle: () => of({ token: 'invalid-token' }),
    };
    decodeMock.mockReturnValue(null);

    interceptor.intercept(context, next).subscribe(() => {
      expect(res.setHeader).toHaveBeenCalledWith('token_expired', 0);
      done();
    });
  });
});
