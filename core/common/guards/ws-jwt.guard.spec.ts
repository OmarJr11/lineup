import { UnauthorizedException } from '@nestjs/common';
import { TokenExpiredError } from 'jsonwebtoken';
import { WsJwtGuard } from './ws-jwt.guard';

/**
 * Unit tests for {@link WsJwtGuard}.
 */
describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new WsJwtGuard();
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
        });
      }
    });

    it('re-throws the original error when err is provided', () => {
      const err = new Error('passport error');

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

    it('returns user when valid data is present', () => {
      const user = { userId: 99, username: 'ws-user' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });
  });

  describe('canActivate', () => {
    it('extracts token from websocket handshake query', () => {
      const mockRequest: any = {};
      const context = {
        switchToWs: () => ({
          getClient: () => ({
            handshake: { query: { token: 'ws-token-123' } },
          }),
        }),
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      // canActivate calls super.canActivate which requires passport setup,
      // so we only verify it sets the URL correctly on the request
      jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(context);

      expect(mockRequest['url']).toBe('?token=ws-token-123');
    });
  });
});
