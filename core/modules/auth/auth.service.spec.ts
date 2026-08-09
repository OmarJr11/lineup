jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

const mockVerifyIdToken = jest.fn();
jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: (opts: unknown) => mockVerifyIdToken(opts),
  })),
}));

import * as argon2 from 'argon2';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { TokensService } from '../token/token.service';
import { UsersGettersService } from '../users/users.getters.service';
import { UsersService } from '../users/users.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessesService } from '../businesses/businesses.service';
import {
  AdminPermissionsEnum,
  ProvidersEnum,
  RolesCodesEnum,
  StatusEnum,
} from '../../common/enums';
import type { Business } from '../../entities';
import type { User } from '../../entities';
import type { LoginDto } from './dto/login.dto';

/**
 * Unit tests for {@link AuthService} with mocked persistence, JWT, and Google client.
 */
describe('AuthService', () => {
  const usersGettersServiceMock = {
    findOneByEmailWithPassword: jest.fn(),
    findOneByIdUserAndToken: jest.fn(),
    checkUserExistByEmail: jest.fn(),
  };
  const usersServiceMock = {
    create: jest.fn(),
    generateUsername: jest.fn(),
  };
  const jwtServiceMock = {
    decode: jest.fn(),
  };
  const tokenServiceMock = {
    generateTokens: jest.fn(),
    updateRefreshToken: jest.fn(),
    removeTokenUser: jest.fn(),
    removeTokenBusiness: jest.fn(),
  };
  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'GOOGLE_CLIENT_ID') {
        return 'test-google-client';
      }
      if (key === 'MAIN_DOMAIN') {
        return 'example.com';
      }
      return undefined;
    }),
  };
  const businessesGettersServiceMock = {
    findOneByEmailWithPassword: jest.fn(),
    findOneByIdBusinessAndToken: jest.fn(),
    checkBusinessExistByEmail: jest.fn(),
  };
  const businessesServiceMock = {
    create: jest.fn(),
  };
  let service: AuthService;
  const argon2VerifyMock = argon2.verify as jest.MockedFunction<
    typeof argon2.verify
  >;

  /**
   * Builds a minimal active {@link User} for password-based flows.
   * @returns {User}
   */
  function buildActiveUser(): User {
    return {
      id: 1,
      email: 'user@test.com',
      username: 'testuser',
      password: 'hashed',
      status: StatusEnum.ACTIVE,
      userRoles: [],
    } as User;
  }

  /**
   * Builds a minimal active {@link Business} for password-based flows.
   * @returns {Business}
   */
  function buildActiveBusiness(): Business {
    return {
      id: 2,
      email: 'biz@test.com',
      name: 'Biz',
      password: 'hashed',
      status: StatusEnum.ACTIVE,
    } as Business;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.MAIN_DOMAIN = 'example.com';
    argon2VerifyMock.mockResolvedValue(true);
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'google@test.com',
        given_name: 'Go',
        family_name: 'Og',
      }),
    });
    tokenServiceMock.generateTokens.mockResolvedValue({
      token: 'access',
      refreshToken: 'refresh',
    });
    tokenServiceMock.updateRefreshToken.mockResolvedValue({
      token: 'new-access',
      refreshToken: 'new-refresh',
    });
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersGettersService, useValue: usersGettersServiceMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: TokensService, useValue: tokenServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersServiceMock,
        },
        { provide: BusinessesService, useValue: businessesServiceMock },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    delete process.env.MAIN_DOMAIN;
  });

  describe('checkStatus', () => {
    it('does not throw when status is ACTIVE', () => {
      expect(() => service.checkStatus(StatusEnum.ACTIVE)).not.toThrow();
    });
    it('throws when status is not ACTIVE', () => {
      expect(() => service.checkStatus(StatusEnum.INACTIVE)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('checkUserLogged', () => {
    it('throws when user is missing', async () => {
      await expect(service.checkUserLogged(null as unknown as User, 'x')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('throws when password does not match', async () => {
      argon2VerifyMock.mockRejectedValueOnce(new Error('verify fail'));
      const user = buildActiveUser();
      await expect(
        service.checkUserLogged(user, 'wrong'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('checkBusinessLogged', () => {
    it('throws when business is missing', async () => {
      await expect(
        service.checkBusinessLogged(null as unknown as Business, 'x'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('returns tokens when credentials and status are valid', async () => {
      const user = buildActiveUser();
      usersGettersServiceMock.findOneByEmailWithPassword.mockResolvedValue(user);
      const body: LoginDto = { email: user.email, password: 'secret' };
      const result = await service.validateUser(body);
      expect(result.token).toBe('access');
      expect(result.refreshToken).toBe('refresh');
      expect(result.user).toBeDefined();
      expect(tokenServiceMock.generateTokens).toHaveBeenCalled();
    });
  });

  describe('validateBusiness', () => {
    it('returns tokens for an active business', async () => {
      const business = buildActiveBusiness();
      businessesGettersServiceMock.findOneByEmailWithPassword.mockResolvedValue(
        business,
      );
      const body: LoginDto = { email: business.email, password: 'secret' };
      const result = await service.validateBusiness(body);
      expect(result.token).toBe('access');
      expect(result.business).toBeDefined();
    });
  });

  describe('validateUserAdmin', () => {
    it('throws when user has no admin login permission', async () => {
      const user = buildActiveUser();
      user.userRoles = [
        {
          role: {
            code: RolesCodesEnum.ADMIN,
            rolePermissions: [],
          },
        },
      ] as User['userRoles'];
      usersGettersServiceMock.findOneByEmailWithPassword.mockResolvedValue(user);
      await expect(
        service.validateUserAdmin({
          email: user.email,
          password: 'secret',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('returns tokens when user is admin with LOGIN permission', async () => {
      const user = buildActiveUser();
      user.userRoles = [
        {
          role: {
            code: RolesCodesEnum.ADMIN,
            rolePermissions: [
              { permission: { code: AdminPermissionsEnum.LOGIN } },
            ],
          },
        },
      ] as User['userRoles'];
      usersGettersServiceMock.findOneByEmailWithPassword.mockResolvedValue(user);
      const result = await service.validateUserAdmin({
        email: user.email,
        password: 'secret',
      });
      expect(result.token).toBe('access');
    });
  });

  describe('refreshToken', () => {
    it('throws when refresh token is empty', async () => {
      await expect(service.refreshToken('', 'any')).rejects.toThrow(
        UnauthorizedException,
      );
    });
    it('throws when access token cannot be decoded', async () => {
      jwtServiceMock.decode.mockReturnValue(null);
      await expect(
        service.refreshToken('refresh', 'bad-access'),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('refreshes session for a user token', async () => {
      jwtServiceMock.decode.mockReturnValue({
        isBusiness: false,
        idUser: 1,
        email: 'u@test.com',
        status: StatusEnum.ACTIVE,
      });
      const user = buildActiveUser();
      usersGettersServiceMock.findOneByIdUserAndToken.mockResolvedValue(user);
      const result = await service.refreshToken('rt', 'at');
      expect(result.user).toBe(user);
      expect(tokenServiceMock.updateRefreshToken).toHaveBeenCalled();
    });
    it('refreshes session for a business token', async () => {
      jwtServiceMock.decode.mockReturnValue({
        isBusiness: true,
        idBusiness: 9,
        email: 'b@test.com',
        status: StatusEnum.ACTIVE,
      });
      const business = buildActiveBusiness();
      businessesGettersServiceMock.findOneByIdBusinessAndToken.mockResolvedValue(
        business,
      );
      const result = await service.refreshToken('rt', 'at');
      expect(result.business).toBe(business);
    });
  });

  describe('registerWithGoogle', () => {
    it('throws when role is not USER or BUSINESS', async () => {
      await expect(
        service.registerWithGoogle({
          token: 'id-token',
          role: RolesCodesEnum.ADMIN,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
    it('creates a user and returns tokens when email is new', async () => {
      usersGettersServiceMock.checkUserExistByEmail.mockResolvedValue(false);
      usersServiceMock.generateUsername.mockResolvedValue('generated_user');
      const created = buildActiveUser();
      usersServiceMock.create.mockResolvedValue(created);
      const result = await service.registerWithGoogle({
        token: 'id-token',
        role: RolesCodesEnum.USER,
      });
      expect(usersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'google@test.com',
          role: RolesCodesEnum.USER,
          username: 'generated_user',
        }),
        ProvidersEnum.GOOGLE,
      );
      expect(result.token).toBe('access');
    });
  });

  describe('loginWithGoogle', () => {
    it('logs in an existing user verified by Google', async () => {
      const user = buildActiveUser();
      user.email = 'google@test.com';
      usersGettersServiceMock.findOneByEmailWithPassword.mockResolvedValue(user);
      const result = await service.loginWithGoogle({ token: 'id-token' });
      expect(result.user).toBeDefined();
      expect(result.token).toBe('access');
    });
  });

  describe('setCookies', () => {
    it('sets access and refresh cookies and returns the payload', async () => {
      const res = {
        cookie: jest.fn(),
      };
      const payload = {
        code: 1,
        status: true,
        message: 'ok',
        user: buildActiveUser(),
      };
      const out = await service.setCookies(
        res as never,
        't1',
        'r1',
        payload,
        'admin_',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'admin_token',
        't1',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'admin_refreshToken',
        'r1',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(out).toMatchObject({ code: 1, user: payload.user });
    });
  });

  describe('refreshAndSetCookies', () => {
    it('throws when no refresh cookie is present', async () => {
      const req = { cookies: {} } as never;
      const res = { cookie: jest.fn() } as never;
      await expect(
        service.refreshAndSetCookies(req, res, ''),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('removes user tokens and clears cookies', async () => {
      const req = {
        cookies: {
          adm_token: 'a',
          adm_refreshToken: 'b',
        },
        get: jest.fn(),
      } as never;
      const resMock = { clearCookie: jest.fn() };
      const userReq = { idUser: 1 } as never;
      const response = { success: { code: 1, status: true, message: 'out' } };
      const result = await service.logout(
        req,
        resMock as never,
        userReq,
        { success: response.success } as never,
        'adm_',
      );
      expect(tokenServiceMock.removeTokenUser).toHaveBeenCalled();
      expect(resMock.clearCookie).toHaveBeenCalled();
      expect(result).toEqual(response.success);
    });
  });
});
