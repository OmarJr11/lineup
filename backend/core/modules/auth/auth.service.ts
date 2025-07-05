import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from '../token/token.service';
import { ILoginResponse, IResponse } from '../../common/interfaces';
import { UsersGettersService } from '../users/users.getters.service';
import { Business, Role, User } from '../../entities';
import { LogError, LogWarn } from '../../common/helpers/logger.helper';
import * as argon2 from 'argon2';
import { userResponses } from '../../common/responses';
import { AdminPermission, RolesCodesEnum, StatusEnum } from '../../common/enums';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly rLogin = userResponses.login;
  private readonly rList = userResponses.list;
  private readonly rToken = userResponses.token;

  constructor(
    private readonly usersGettersService: UsersGettersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokensService,
    private readonly businessesGettersService: BusinessesGettersService
  ) { }

  /**
   * Validate user
   * @param {User} user
   * @param {string} password
   */
  async checkUserLogged(
    user: User,
    password: string
  ) {
    if (!user) {
      LogWarn(this.logger, 'User not exist or wrong password', this.validateUser.name, user);
      throw new UnauthorizedException(this.rLogin.wrongData);
    }
    await argon2.verify(user.password, password).catch((error) => {
      LogWarn(this.logger, 'User not exist or wrong password', this.validateUser.name, user);
      throw new UnauthorizedException(this.rLogin.wrongData);
    });
  }

  /**
   * Validate Business
   * @param {Business} business
   * @param {string} password
   */
  async checkBusinessLogged(
    business: Business,
    password: string
  ) {
    if (!business) {
      LogWarn(this.logger, 'Business not exist or wrong password', this.validateUser.name, business);
      throw new UnauthorizedException(this.rLogin.wrongData);
    }
    await argon2.verify(business.password, password).catch((error) => {
      LogWarn(this.logger, 'Business not exist or wrong password', this.validateUser.name, business);
      throw new UnauthorizedException(this.rLogin.wrongData);
    });
  }

  /**
   * Check if the user is active, if not throws exception
   *
   * @param {string} status - status property of a user
   */
  checkStatus(status: string) {
    if (status !== StatusEnum.ACTIVE) {
      LogWarn(this.logger, this.rList.userNotActive, this.checkStatus.name);
      throw new UnauthorizedException(this.rList.userNotActive);
    }
  }

  /**
   * Refresh the token and delete the refresh token used
   *
   * @param {string} refreshToken - Refresh token
   * @param {string} token - Expired Token
   * @param {number} idUser - Id User
   * @param {IResponseWithData} responses - Response with the structure to return
   * @returns {Promise<ILoginResponse>}
   */
  async refreshToken(
    refreshToken: string,
    token: string,
    idUser: number
  ): Promise<ILoginResponse> {
    if (!refreshToken) {
      LogWarn(this.logger, this.rToken.notCookies.message, this.refreshToken.name);
      throw new UnauthorizedException(this.rToken.notCookies);
    }

    const decodedToken = this.jwtService.decode(token);
    if (!decodedToken) {
      LogWarn(this.logger, this.rToken.tokenNotValid.message, this.refreshToken.name);
      throw new UnauthorizedException(this.rToken.tokenNotValid);
    }

    if (Number(idUser) !== Number(decodedToken.sub)) {
      LogWarn(this.logger, this.rToken.idUserDontMatch.message, this.refreshToken.name);
      throw new UnauthorizedException(this.rToken.idUserDontMatch);
    }

    const user = await this.usersGettersService
      .findOneByIdUserAndToken(
        idUser,
        decodedToken.email,
        decodedToken.status
      ).catch((error) => {
        LogError(this.logger, error, this.refreshToken.name);
        throw new UnauthorizedException(this.rToken.tokenNotValid);
      });

    const tokenDB = await this.tokenService.updateRefreshToken(
      refreshToken,
      token,
      user,
      this.rToken
    );

    return { ...this.rToken.success, user, ...tokenDB };
  }

  /**
   *  Function that validates the username (or email) and password,
   *  if both are correct, generates session token
   * @param {LoginDto} body - Login data
   * @returns {Promise<ILoginResponse>}
   */
  async validateUser(body: LoginDto): Promise<IResponse> {
    const user = await this.usersGettersService.findOneByEmailWithPassword(body.email);
    await this.checkUserLogged(user, body.password);
    // Check user status
    this.checkStatus(user.status);
    delete user.password;
    return await this.generateToken(user);
  }

  /**
   *  Function that validates the username (or email) and password,
   *  if both are correct, generates session token
   * @param {LoginDto} body - Login data
   * @returns {Promise<ILoginResponse>}
   */
  async validateBusiness(body: LoginDto): Promise<IResponse> {
    const business = await this.businessesGettersService.findOneByEmailWithPassword(body.email);
    await this.checkBusinessLogged(business, body.password);
    // Check user status
    this.checkStatus(business.status);
    delete business.password;
    return await this.generateToken(business);
  }

  /**
   *  Function that validates the username (or email) and password,
   *  if both are correct, generates session token
   * @param {LoginDto} body - Login data
   * @returns {Promise<ILoginResponse>}
   */
  async validateUserAdmin(body: LoginDto): Promise<ILoginResponse> {
    const user = await this.usersGettersService.findOneByEmailWithPassword(body.email);
    const roles = (user.userRoles.filter(
      (ur) => (
        ur.role.code === RolesCodesEnum.ADMIN ||
        ur.role.code === RolesCodesEnum.MODERATOR
      )
    )).map((ur) => ur.role);

    if (!this.isAdmin(roles)) {
      LogWarn(this.logger, this.rLogin.notAdmin.message, this.validateUserAdmin.name, user);
      throw new UnauthorizedException(this.rLogin.notAdmin);
    }
    await this.checkUserLogged(user, body.password);
    // Check user status
    this.checkStatus(user.status);
    delete user.password;
    return await this.generateToken(user);
  }

  /**
   * Generate token
   * @param {User | Business} user
   * @returns {Promise<ILoginResponse>}
   **/
  private async generateToken(user: User | Business): Promise<ILoginResponse> {
    // Generate token
    const tokenDB = await this.tokenService.generateTokens(user);
    const isBusiness = user['username'] ? false : true;
    const business = isBusiness ? user as Business : null;
    const userResponse = isBusiness ? null : user as User;
    return isBusiness
      ? { ...this.rToken.success, ...tokenDB, business }
      : { ...this.rToken.success, ...tokenDB, user: userResponse };
  }

  /**
   * Check if the user is admin
   * @param {Role[]} roles - Roles of User
   * @returns {boolean}
   */
  private isAdmin(roles: Role[]): boolean {
    let havePermission = false;
    for (const role of roles) {
      role.rolePermissions.map((p) => {
        if (p.permission.code === AdminPermission.LOGIN) {
          havePermission = true;
        }
      });
    }
    return havePermission;
  }
}
