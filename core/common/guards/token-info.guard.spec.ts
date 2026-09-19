import { TokenExpiredError } from 'jsonwebtoken';
import { TokenInfoGuard } from './token-info.guard';

/**
 * Unit tests for {@link TokenInfoGuard}.
 */
describe('TokenInfoGuard', () => {
  let guard: TokenInfoGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new TokenInfoGuard();
  });

  describe('canActivate', () => {
    it('returns true without delegating to passport when no token in cookies or headers', () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ cookies: {}, headers: {} }),
        }),
      } as any;

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('returns null when token is expired', () => {
      const error = new TokenExpiredError('jwt expired', new Date());

      const result = guard.handleRequest(null, null, error);

      expect(result).toBeNull();
    });

    it('returns null when an error is present', () => {
      const result = guard.handleRequest(new Error('bad'), null, null);

      expect(result).toBeNull();
    });

    it('returns null when no user data is present', () => {
      const result = guard.handleRequest(null, null, null);

      expect(result).toBeNull();
    });

    it('returns user when valid data is present', () => {
      const user = { userId: 1, username: 'bob' };

      const result = guard.handleRequest(null, user, null);

      expect(result).toEqual(user);
    });
  });
});
