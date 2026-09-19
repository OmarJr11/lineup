import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenExpiredError } from 'jsonwebtoken';
import { JwtAuthGuard } from './jwt.guard';

/**
 * Unit tests for {@link JwtAuthGuard}.
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  const configServiceMock = {
    get: jest.fn().mockReturnValue('test'),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(configServiceMock);
  });

  describe('getRequest', () => {
    it('returns HTTP request when available', () => {
      const req = { url: '/test' };
      const context = {
        switchToHttp: () => ({ getRequest: () => req }),
        getArgByIndex: jest.fn(),
      } as any;

      expect(guard.getRequest(context)).toBe(req);
    });

    it('falls back to GraphQL context when HTTP request is null', () => {
      const gqlReq = { url: '/graphql' };
      const context = {
        switchToHttp: () => ({ getRequest: () => null }),
        getArgByIndex: jest.fn().mockReturnValue({ req: gqlReq }),
      } as any;

      expect(guard.getRequest(context)).toBe(gqlReq);
    });
  });

  describe('handleRequest', () => {
    it('throws UnauthorizedException with code 2 when token is expired', () => {
      const expiredAt = new Date();
      const error = new TokenExpiredError('jwt expired', expiredAt);

      expect(() => guard.handleRequest(null, null, error)).toThrow(
        UnauthorizedException,
      );
      try {
        guard.handleRequest(null, null, error);
      } catch (e) {
        expect(e.getResponse()).toMatchObject({
          status: false,
          code: 2,
          message: 'TokenExpiredError: jwt expired',
        });
      }
    });

    it('re-throws the original error when err is provided', () => {
      const err = new Error('some auth error');

      expect(() => guard.handleRequest(err, null, null)).toThrow(err);
    });

    it('throws UnauthorizedException with code 1 when no user data', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(
        UnauthorizedException,
      );
      try {
        guard.handleRequest(null, null, null);
      } catch (e) {
        expect(e.getResponse()).toMatchObject({
          code: 1,
          status: false,
          message: 'Unauthorized',
        });
      }
    });

    it('returns user when data contains userId', () => {
      const userData = { userId: 42, username: 'alice' };

      const result = guard.handleRequest(null, userData, null);

      expect(result).toEqual(userData);
    });

    it('returns business when data contains businessId', () => {
      const businessData = { businessId: 7, name: 'Shop' };

      const result = guard.handleRequest(null, businessData, null);

      expect(result).toEqual(businessData);
    });
  });
});
