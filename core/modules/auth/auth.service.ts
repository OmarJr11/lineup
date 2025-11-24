import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from '../token/token.service';
import { IBusinessReq, ILoginResponse, ILogout, IResponse, IResponseWithData, IUserOrBusinessReq, IUserReq } from '../../common/interfaces';
import { UsersGettersService } from '../users/users.getters.service';
import { Business, Role, User } from '../../entities';
import { LogError, LogWarn } from '../../common/helpers/logger.helper';
import * as argon2 from 'argon2';
import { userResponses } from '../../common/responses';
import { AdminPermission, RolesCodesEnum, StatusEnum } from '../../common/enums';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getAcceptableDomains, getRequestAgent } from '../../common/helpers/requests.helper';
import { LoginResponse } from '../../schemas';

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
    private readonly configService: ConfigService,
    private readonly businessesGettersService: BusinessesGettersService,
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
  async validateUser(body: LoginDto): Promise<ILoginResponse> {
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
  async validateBusiness(body: LoginDto): Promise<ILoginResponse> {
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
   * Set cookies in the response
   * @param {Response} res - Response object
   * @param {string} token - Access token
   * @param {string} refreshToken - Refresh token
   * @param {ILoginResponse} result - Login response
   * @returns {Promise<Response>}
   */
  async setCookies(
    res: Response,
    token: string,
    refreshToken: string,
    result: ILoginResponse
  ): Promise<LoginResponse> {
    const cookies = this.configService.get<string>('COOKIES');
    const isProd = process.env.NODE_ENV === 'production';
    const sameSite = cookies === 'true' ? ('lax' as 'lax') : ('none' as 'none');
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite,
      maxAge: 24 * 3600 * 1000, // 1 day
      path: '/',
    };

    // Access token cookie
    res.cookie('token', token, cookieOptions);

    // Refresh token cookie - consider limiting `path` to a refresh endpoint if desired
    res.cookie('refreshToken', refreshToken, cookieOptions);

    // Do not call res.send here — GraphQL resolvers should return plain data.
    return { ...result };
  }

  /**
   * Logout and erase the cookies
   * @param {ILogout} dataTokens - Data with token and refreshToken
   * @param {Response} res - response Object
   * @param {IUserReq} user - Logged User
   * @param {IResponseWithData} response - response with the structure to return
   * @returns {Promise<IResponse>}
   */
  async logout(
      req: Request,
      res: Response,
      userOrBusiness: IUserOrBusinessReq,
      response: IResponseWithData
  ): Promise<IResponse> {
      const domains = getAcceptableDomains();
      const agent = getRequestAgent(req, domains);
      const dataToken: ILogout = {
          token: req.cookies.token,
          refreshToken: req.cookies.refreshToken,
          domain: agent,
          secure: agent.includes(
            this.configService.get<string>('MAIN_DOMAIN')
          ),
          httpOnly: agent.includes(
            this.configService.get<string>('MAIN_DOMAIN')
          ),
      };

      LogWarn(this.logger, 'Logout', this.logout.name, userOrBusiness);
      this.logger.log(agent);

      if(userOrBusiness['businessId']) {
        const business = userOrBusiness as IBusinessReq;
        await this.tokenService.removeTokenBusiness(
          dataToken.refreshToken, dataToken.token, business
        );
      } else {
        const user = userOrBusiness as IUserReq;
        await this.tokenService.removeTokenUser(
          dataToken.refreshToken, dataToken.token, user
        );
      }
      res.clearCookie('token', { path: '/', domain: dataToken.domain });
      res.clearCookie('refreshToken', { path: '/', domain: dataToken.domain });
      // Return data; controllers or resolvers should send the HTTP response.
      return response.success;
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
