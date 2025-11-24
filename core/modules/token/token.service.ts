import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { IBusinessReq, IRefreshToken, IResponse, IResponseWithData, ITokenGenerate, IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services/base.service';
import { Business, Token, User } from '../../entities';
import { generateRandomCodeByLength } from '../../common/helpers/generators.helper';
import { userResponses } from '../../common/responses';
import { ConfigService } from '@nestjs/config';
import { CreateTokenDto } from './dto/create-token.dto';

@Injectable({ scope: Scope.REQUEST })
export class TokensService extends BasicService<Token> {
  private logger: Logger = new Logger(TokensService.name);
  private readonly rToken = userResponses.token;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    private readonly jwtService: JwtService,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly configService: ConfigService
  ) {
    super(tokenRepository, userRequest);
  }

  /**
   * Delete the refresh token in db
   *
   * @param {Token} data
   */
  async deleteRefreshTokenEntity(data: Token) {
    await this.tokenRepository.remove(data);
  }

  /**
   * Decode token
   *
   * @param {string} token - Token to decode
   * @returns {ITokenGenerate}
   */
  decodeToken(token: string): ITokenGenerate {
    return this.jwtService.decode(token) as ITokenGenerate;
  }

  /**
   * Generate Refresh Token to refresh new token
   *
   * @returns {Promise<string>}
   */
  async generateRefreshToken(): Promise<string> {
    return generateRandomCodeByLength(350);
  }

  /**
   * Generate Token to header requests
   *
   * @param {*} user - Logged user
   * @returns {Promise<string>}
   */
  async generateToken(user: User | Business): Promise<string> {
    if(user['username']) {
      return this.generateTokenJwt({
        username: user['username'],
        email: user.email,
        sub: user.id,
        status: user.status,
        isBusiness: false
      });
    } else {
      return this.generateTokenJwt({
        path: user['path'],
        email: user.email,
        sub: user.id,
        status: user.status,
        isBusiness: true
      });
    }
  }

  /**
   * Generate token to manage authorization
   *
   * @param {ITokenGenerate} data - payload of the token. It must be of type
   *  ITokenGenerate
   * @returns {string}
   */
  generateTokenJwt(data: ITokenGenerate): string {
    const min = Number(this.configService.get<string>('EXPIRED_TOKEN_MIN'));
    const max = Number(this.configService.get<string>('EXPIRED_TOKEN_MAX'));
    const randomExpired = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.jwtService.sign(data, { expiresIn: randomExpired });
  }

  /**
   * Save refresh token
   *
   * @param {RefreshToken} refreshToken - refresh token to be saved ?
   */
  async saveRefreshToken(refreshToken: CreateTokenDto) {
    await this.tokenRepository.save(refreshToken).catch((error) => {
      LogError(this.logger, error, this.saveRefreshToken.name);
      throw new InternalServerErrorException(this.rToken.error);
    });
  }

  /**
   *  Save the new refresh token
   * @param {User | Business} user - Logged user
   * @returns {Promise<IRefreshToken>}
   */
  async generateTokens(user: User | Business): Promise<IRefreshToken> {
    // generate the new token
    const newToken = await this.generateToken(user);
    // Generate new refresh Token
    const newRefreshToken = await this.generateRefreshToken();
    // Generate new Refresh token and saved it in db.
    const newRt: CreateTokenDto = {
      idUser: user['username'] ? Number(user.id) : null,
      idBusiness: user['name'] ? Number(user.id) : null,
      token: newToken,
      refresh: newRefreshToken,
      creationDate: new Date(),
    };

    await this.saveRefreshToken(newRt);
    return { token: newToken, refreshToken: newRefreshToken };
  }

  /**
   *  Remove Token for user in DB to logout
   * @param {string} refreshToken - Current refreshToken
   * @param {string} token - current Token
   * @param {IUserReq} user - Logged user
   */
  async removeTokenUser(refreshToken: string, token: string, user: IUserReq) {
    const rt = await this.tokenRepository.findOne({
      where: [{ 
        idUser: Number(user.userId),
        token,
        refresh: refreshToken
      }],
    });

    if (rt) {
      await this.deleteRefreshTokenEntity(rt).catch();
    }
  }

  /**
   * Remove token for business in DB to logout
   * @param {string} refreshToken - Current refreshToken
   * @param {string} token - current Token
   * @param {IBusinessReq} business - Logged business
   */
  async removeTokenBusiness(refreshToken: string, token: string, business: IBusinessReq) {
    const rt = await this.tokenRepository.findOne({
      where: [{ 
        idBusiness: Number(business.businessId),
        token,
        refresh: refreshToken
      }],
    });

    if (rt) {
      await this.deleteRefreshTokenEntity(rt).catch();
    }
  }

  /**
   *  Update token and Refresh token
   *
   * @param {string} refreshToken - current RefreshToken
   * @param {string} token - current token
   * @param {User} user - Logged user
   * @param {IResponseWithData} response - response with the structure to return
   * @return {Promise<IRefreshToken>}
   */
  async updateRefreshToken(
    refreshToken: string,
    token: string,
    user: User,
    responses: IResponseWithData
  ): Promise<IRefreshToken> {
    const rt = await this.tokenRepository
      .findOneOrFail({ where: { idUser: user.id, token, refresh: refreshToken } })
      .catch((error) => {
        LogError(this.logger, error, this.updateRefreshToken.name, user);
        throw new UnauthorizedException(responses.refreshNotValid);
      });

    rt.idUser = user.id;
    await this.deleteRefreshTokenEntity(rt).catch((error) => {
      LogError(this.logger, error, this.updateRefreshToken.name, user);
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(responses.refreshExpired);
      }
      throw new UnauthorizedException(responses.refreshNotValid);
    });

    return await this.generateTokens(user);
  }

  /**
   * Get token by token
   * @param {string} token - token to get
   * @param {IResponse} response - response with the structure to return
   */
  async getTokenByToken(token: string, response: IResponse) {
    await this.findOneWithOptionsOrFail({ where: { token } }).catch((error) => {
      LogError(this.logger, error, this.getTokenByToken.name);
      throw new NotFoundException(response);
    });
  }
}
