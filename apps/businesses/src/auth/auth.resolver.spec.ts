import { AuthResolver } from './auth.resolver';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { AuthMailService } from '../../../../core/modules/auth/auth-mail.service';
import type { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { CookiesPrefixEnum } from '../../../../core/common/enums';

/**
 * Unit tests for {@link AuthResolver} (businesses app).
 */
describe('AuthResolver (businesses)', () => {
  let resolver: AuthResolver;
  const authServiceMock = {
    validateBusiness: jest.fn(),
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
    it('validates business, strips tokens from result, and sets cookies', async () => {
      const login = { email: 'b@b.com', password: 'secret' } as LoginDto;
      const payload = {
        token: 't1',
        refreshToken: 'r1',
        id: 99,
        path: '/shop',
      };
      const finalResponse = { status: true };
      authServiceMock.validateBusiness.mockResolvedValue({ ...payload });
      authServiceMock.setCookies.mockResolvedValue(finalResponse);
      const res = {};
      const ctx = { res };
      const result = await resolver.login(login, ctx);
      expect(authServiceMock.validateBusiness).toHaveBeenCalledWith(login);
      expect(authServiceMock.setCookies).toHaveBeenCalledWith(
        res,
        't1',
        'r1',
        expect.objectContaining({ id: 99, path: '/shop' }),
        CookiesPrefixEnum.BUSINESSES,
      );
      expect(result).toBe(finalResponse);
    });
  });
});
