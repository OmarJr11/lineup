import { AuthResolver } from './auth.resolver';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import type { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { CookiesPrefixEnum } from '../../../../core/common/enums';
import { userResponses } from '../../../../core/common/responses';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link AuthResolver} (admin app).
 */
describe('AuthResolver (admin)', () => {
  let resolver: AuthResolver;
  const authServiceMock = {
    validateUser: jest.fn(),
    setCookies: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new AuthResolver(authServiceMock as unknown as AuthService);
  });

  describe('login', () => {
    it('validates user and sets cookies with admin prefix', async () => {
      const login = { email: 'admin@a.com', password: 'p' } as LoginDto;
      const payload = {
        token: 'at',
        refreshToken: 'rt',
        userId: 1,
        username: 'admin',
      };
      const finalResponse = { status: true };
      authServiceMock.validateUser.mockResolvedValue({ ...payload });
      authServiceMock.setCookies.mockResolvedValue(finalResponse);
      const res = {};
      const result = await resolver.login(login, { res });
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(login);
      expect(authServiceMock.setCookies).toHaveBeenCalledWith(
        res,
        'at',
        'rt',
        expect.objectContaining({ userId: 1 }),
        CookiesPrefixEnum.ADMIN,
      );
      expect(result).toBe(finalResponse);
    });
  });

  describe('logout', () => {
    it('delegates to AuthService.logout', async () => {
      const done = { status: true };
      authServiceMock.logout.mockResolvedValue(done);
      const user: IUserReq = { userId: 1, username: 'admin' };
      const ctx = { req: {}, res: {} };
      const result = await resolver.logout(ctx, user);
      expect(authServiceMock.logout).toHaveBeenCalledWith(
        ctx.req,
        ctx.res,
        user,
        userResponses.logout,
        CookiesPrefixEnum.ADMIN,
      );
      expect(result).toBe(done);
    });
  });
});
