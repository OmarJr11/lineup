import { UsersResolver } from './users.resolver';
import { UsersService } from '../../../../core/modules/users/users.service';
import { TokensService } from '../../../../core/modules/token/token.service';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { CookiesPrefixEnum, ProvidersEnum } from '../../../../core/common/enums';
import type { CreateUserInput } from '../../../../core/modules/users/dto/create-user.input';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link UsersResolver}.
 */
describe('UsersResolver', () => {
  let resolver: UsersResolver;
  const usersServiceMock = {
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    changePassword: jest.fn(),
    remove: jest.fn(),
  };
  const tokensServiceMock = {
    generateTokens: jest.fn(),
  };
  const authServiceMock = {
    setCookies: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new UsersResolver(
      usersServiceMock as unknown as UsersService,
      tokensServiceMock as unknown as TokensService,
      authServiceMock as unknown as AuthService,
    );
  });

  describe('createUser', () => {
    it('creates user, generates tokens, and sets cookies', async () => {
      const data = { username: 'u' } as CreateUserInput;
      const user = { userId: 4, username: 'u' };
      const loginPayload = { ok: true };
      usersServiceMock.create.mockResolvedValue(user);
      tokensServiceMock.generateTokens.mockResolvedValue({
        token: 't',
        refreshToken: 'r',
      });
      authServiceMock.setCookies.mockResolvedValue(loginPayload);
      const ctx = { res: {} };
      const result = await resolver.createUser(data, ctx);
      expect(usersServiceMock.create).toHaveBeenCalledWith(
        data,
        ProvidersEnum.LineUp,
      );
      expect(tokensServiceMock.generateTokens).toHaveBeenCalledWith(user);
      expect(authServiceMock.setCookies).toHaveBeenCalledWith(
        ctx.res,
        't',
        'r',
        expect.objectContaining({ user }),
        CookiesPrefixEnum.USERS,
      );
      expect(result).toBe(loginPayload);
    });
  });

  describe('userById', () => {
    it('delegates to usersService.findOne and maps', async () => {
      const entity = { userId: 2 };
      usersServiceMock.findOne.mockResolvedValue(entity);
      const out = await resolver.userById(2);
      expect(usersServiceMock.findOne).toHaveBeenCalledWith(2);
      expect(out).toBe(entity);
    });
  });

  describe('me', () => {
    it('loads user by JWT id', async () => {
      const userReq = { userId: 7 } as IUserReq;
      const entity = { userId: 7 };
      usersServiceMock.findOne.mockResolvedValue(entity);
      const out = await resolver.me(userReq);
      expect(usersServiceMock.findOne).toHaveBeenCalledWith(7);
      expect(out).toBe(entity);
    });
  });

  describe('removeUser', () => {
    it('calls remove and returns true', async () => {
      const user = { userId: 3 } as IUserReq;
      usersServiceMock.remove.mockResolvedValue(undefined);
      await expect(resolver.removeUser(user)).resolves.toBe(true);
      expect(usersServiceMock.remove).toHaveBeenCalledWith(3, user);
    });
  });
});
