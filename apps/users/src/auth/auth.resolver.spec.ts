import { AuthResolver } from './auth.resolver';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { AuthMailService } from '../../../../core/modules/auth/auth-mail.service';
import type { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { CookiesPrefixEnum } from '../../../../core/common/enums';

/**
 * Unit tests for {@link AuthResolver} (users app).
 */
describe('AuthResolver (users)', () => {
  let resolver: AuthResolver;
  const authServiceMock = {
    validateUser: jest.fn(),
    setCookies: jest.fn(),
  };
  const authMailServiceMock = {};

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new AuthResolver(
      authServiceMock as unknown as AuthService,
      authMailServiceMock as unknown as AuthMailService,
    );
  });

  describe('login', () => {
    it('validates user, strips tokens from result, and sets cookies', async () => {
      const login = { email: 'a@a.com', password: 'x' } as LoginDto;
      const payload = {
        token: 'access',
        refreshToken: 'refresh',
        userId: 1,
        username: 'u',
      };
      const finalResponse = { status: true };
      authServiceMock.validateUser.mockResolvedValue({ ...payload });
      authServiceMock.setCookies.mockResolvedValue(finalResponse);
      const res = {};
      const ctx = { res };
      const result = await resolver.login(login, ctx);
      expect(authServiceMock.validateUser).toHaveBeenCalledWith(login);
      expect(authServiceMock.setCookies).toHaveBeenCalledWith(
        res,
        'access',
        'refresh',
        expect.objectContaining({ userId: 1, username: 'u' }),
        CookiesPrefixEnum.USERS,
      );
      expect(result).toBe(finalResponse);
    });
  });
});
