import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Repository } from 'typeorm';
import { TokenExpiredError } from 'jsonwebtoken';
import type { Request } from 'express';
import { TokensService } from './token.service';
import { Token, User } from '../../entities';
import type { Business } from '../../entities';
import type { IResponse, IResponseWithData } from '../../common/interfaces';

jest.mock('../../common/helpers/generators.helper', () => ({
  generateRandomCodeByLength: jest.fn(() => 'refresh-code-fixed'),
}));

/**
 * Unit tests for {@link TokensService}.
 */
describe('TokensService', () => {
  let service: TokensService;
  const findOneMock = jest.fn();
  const findOneOrFailMock = jest.fn();
  const saveMock = jest.fn();
  const removeMock = jest.fn();
  const jwtSignMock = jest.fn(() => 'signed-jwt');
  const jwtDecodeMock = jest.fn();
  const configGetMock = jest.fn((key: string) => {
    if (key === 'EXPIRED_TOKEN_MIN') {
      return '60';
    }
    if (key === 'EXPIRED_TOKEN_MAX') {
      return '60';
    }
    return undefined;
  });
  const userReq = { userId: 5, username: 'u' };
  const responsesRefresh = {
    refreshNotValid: { message: 'bad' },
    refreshExpired: { message: 'exp' },
  } as unknown as IResponseWithData;
  const responseNotFound = { message: 'nf' } as unknown as IResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const tokenRepository = {
      findOne: findOneMock,
      findOneOrFail: findOneOrFailMock,
      save: saveMock,
      remove: removeMock,
    } as unknown as Repository<Token>;
    const jwtService = {
      sign: jwtSignMock,
      decode: jwtDecodeMock,
    } as unknown as JwtService;
    const configService = { get: configGetMock } as unknown as ConfigService;
    service = new TokensService(
      {} as Request,
      jwtService,
      tokenRepository,
      configService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('decodeToken', () => {
    it('delegates to JwtService.decode', () => {
      jwtDecodeMock.mockReturnValue({ sub: 1 });
      expect(service.decodeToken('t')).toEqual({ sub: 1 });
      expect(jwtDecodeMock).toHaveBeenCalledWith('t');
    });
  });

  describe('generateRefreshToken', () => {
    it('returns a long random refresh string', async () => {
      await expect(service.generateRefreshToken()).resolves.toBe(
        'refresh-code-fixed',
      );
    });
  });

  describe('generateTokenJwt', () => {
    it('signs payload with random expiry between min and max', () => {
      const payload = {
        username: 'a',
        email: 'e',
        sub: 1,
        status: 1,
        isBusiness: false,
        idUser: 1,
        idBusiness: null,
      };
      service.generateTokenJwt(payload as never);
      expect(jwtSignMock).toHaveBeenCalledWith(payload, {
        expiresIn: 60,
      });
    });
  });

  describe('generateToken', () => {
    it('builds user payload when username is present', async () => {
      const user = {
        id: 3,
        username: 'alice',
        email: 'a@a.com',
        status: 1,
      } as unknown as User;
      await service.generateToken(user);
      expect(jwtSignMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'alice',
          isBusiness: false,
          idUser: 3,
        }),
        expect.any(Object),
      );
    });

    it('builds business payload when username is absent', async () => {
      const business = {
        id: 9,
        path: '/b',
        email: 'b@b.com',
        status: 1,
      } as unknown as Business;
      await service.generateToken(business);
      expect(jwtSignMock).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/b',
          isBusiness: true,
          idBusiness: 9,
        }),
        expect.any(Object),
      );
    });
  });

  describe('saveRefreshToken', () => {
    it('persists refresh token dto', async () => {
      saveMock.mockResolvedValue(undefined);
      const dto = {
        idUser: 1,
        idBusiness: null,
        token: 't',
        refresh: 'r',
        creationDate: new Date(),
      };
      await expect(service.saveRefreshToken(dto)).resolves.toBeUndefined();
      expect(saveMock).toHaveBeenCalledWith(dto);
    });

    it('throws InternalServerErrorException when save fails', async () => {
      saveMock.mockRejectedValue(new Error('db'));
      await expect(
        service.saveRefreshToken({
          idUser: 1,
          idBusiness: null,
          token: 't',
          refresh: 'r',
          creationDate: new Date(),
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('generateTokens', () => {
    it('returns access and refresh tokens for a user', async () => {
      saveMock.mockResolvedValue(undefined);
      const user = {
        id: 2,
        username: 'bob',
        email: 'b@b.com',
        status: 1,
      } as unknown as User;
      const result = await service.generateTokens(user);
      expect(result.token).toBe('signed-jwt');
      expect(result.refreshToken).toBe('refresh-code-fixed');
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe('removeTokenUser', () => {
    it('removes refresh row when found', async () => {
      const rt = { id: 1 } as Token;
      findOneMock.mockResolvedValue(rt);
      removeMock.mockResolvedValue(rt);
      await service.removeTokenUser('r', 't', userReq);
      expect(removeMock).toHaveBeenCalledWith(rt);
    });

    it('does nothing when no row matches', async () => {
      findOneMock.mockResolvedValue(null);
      await service.removeTokenUser('r', 't', userReq);
      expect(removeMock).not.toHaveBeenCalled();
    });
  });

  describe('removeTokenBusiness', () => {
    it('removes refresh row when found', async () => {
      const rt = { id: 2 } as Token;
      findOneMock.mockResolvedValue(rt);
      removeMock.mockResolvedValue(rt);
      await service.removeTokenBusiness('r', 't', {
        path: '/',
        businessId: 4,
      });
      expect(removeMock).toHaveBeenCalledWith(rt);
    });
  });

  describe('updateRefreshToken', () => {
    it('throws UnauthorizedException when refresh row is missing for user', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('nf'));
      const user = {
        id: 1,
        username: 'u',
        email: 'e',
        status: 1,
      } as unknown as User;
      await expect(
        service.updateRefreshToken('r', 't', user, responsesRefresh),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns new tokens after deleting existing refresh row for user', async () => {
      const rt = {
        id: 10,
        idUser: 1,
        token: 'old',
        refresh: 'old-r',
      } as Token;
      findOneOrFailMock.mockResolvedValue(rt);
      removeMock.mockResolvedValue(rt);
      saveMock.mockResolvedValue(undefined);
      const user = {
        id: 1,
        username: 'u',
        email: 'e',
        status: 1,
      } as unknown as User;
      const result = await service.updateRefreshToken(
        'old-r',
        'old',
        user,
        responsesRefresh,
      );
      expect(result.refreshToken).toBe('refresh-code-fixed');
      expect(removeMock).toHaveBeenCalledWith(rt);
    });

    it('maps TokenExpiredError on remove to refreshExpired response', async () => {
      const rt = {
        id: 10,
        idUser: 1,
        token: 'old',
        refresh: 'old-r',
      } as Token;
      findOneOrFailMock.mockResolvedValue(rt);
      removeMock.mockRejectedValue(new TokenExpiredError('exp', new Date()));
      const user = {
        id: 1,
        username: 'u',
        email: 'e',
        status: 1,
      } as unknown as User;
      await expect(
        service.updateRefreshToken('old-r', 'old', user, responsesRefresh),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getTokenByToken', () => {
    it('throws NotFoundException when token is missing', async () => {
      findOneOrFailMock.mockRejectedValue(new Error('nf'));
      await expect(
        service.getTokenByToken('x', responseNotFound),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
