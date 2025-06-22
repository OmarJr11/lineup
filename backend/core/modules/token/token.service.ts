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
import { IRefreshToken, IResponse, IResponseWithData, ITokenGenerate, IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services/base.service';
import { Token, User } from '../../entities';
import { generateRandomCodeByLength } from '../../common/helpers/generators.helper';
import { userResponses } from '../../common/responses';

@Injectable({ scope: Scope.REQUEST })
export class TokensService extends BasicService<Token> {
  private logger: Logger = new Logger(TokensService.name);
  private readonly rToken = userResponses.token;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    private readonly jwtService: JwtService,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>
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
  async generateToken(user: User): Promise<string> {
    return this.generateTokenJwt({
      username: user.username,
      email: user.email,
      sub: user.id,
      status: user.status,
    });
  }

  /**
   * Generate token to manage authorization
   *
   * @param {ITokenGenerate} data - payload of the token. It must be of type
   *  ITokenGenerate
   * @returns {string}
   */
  generateTokenJwt(data: ITokenGenerate): string {
    const min = Number(process.env.EXPIRED_TOKEN_MIN);
    const max = Number(process.env.EXPIRED_TOKEN_MAX);
    const randomExpired = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.jwtService.sign(data, { expiresIn: randomExpired });
  }

  /**
   * Save refresh token
   *
   * @param {RefreshToken} refreshToken - refresh token to be saved ?
   */
  async saveRefreshToken(refreshToken: Token) {
    await this.tokenRepository.save(refreshToken).catch((error) => {
      LogError(this.logger, error, this.saveRefreshToken.name);
      throw new InternalServerErrorException(this.rToken.error);
    });
  }

  /**
   *  Save the new refresh token
   * @param {User} user - Logged user
   * @returns {Promise<IRefreshToken>}
   */
  async generateTokens(user: User): Promise<IRefreshToken> {
    // generate the new token
    const newToken = await this.generateToken(user);
    // Generate new refresh Token
    const newRefreshToken = await this.generateRefreshToken();
    // Generate new Refresh token and saved it in db.
    const newRt: Token = {
      idUser: user.id,
      token: newToken,
      refresh: newRefreshToken,
      user,
      creationDate: new Date(),
    };

    await this.saveRefreshToken(newRt);
    return { token: newToken, refreshToken: newRefreshToken };
  }

  /**
   *  Remove Token in DB to logout
   *
   * @param {string} refreshToken - Current refreshToken
   * @param {string} token - current Token
   * @param {*} user - Logged user
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async removeToken(refreshToken: string, token: string, user: IUserReq) {
    const rt = await this.tokenRepository.findOne({
      where: [{ idUser: +user.userId, token, refresh: refreshToken }],
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
