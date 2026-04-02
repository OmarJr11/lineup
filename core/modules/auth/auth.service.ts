import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { TokensService } from '../token/token.service';
import {
  IBusinessReq,
  IGoogleLogin,
  ILoginResponse,
  ILogout,
  IResponse,
  IResponseWithData,
  IUserOrBusinessReq,
  IUserReq,
  ITokenGenerate,
} from '../../common/interfaces';
import { UsersGettersService } from '../users/users.getters.service';
import { UsersService } from '../users/users.service';
import { Business, Role, User } from '../../entities';
import { LogError, LogWarn } from '../../common/helpers/logger.helper';
import * as argon2 from 'argon2';
import { userResponses } from '../../common/responses';
import { businessesResponses } from '../../common/responses';
import {
  AdminPermissionsEnum,
  ProvidersEnum,
  RolesCodesEnum,
  StatusEnum,
} from '../../common/enums';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessesService } from '../businesses/businesses.service';
import { CreateBusinessInput } from '../businesses/dto/create-business.input';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  getAcceptableDomains,
  getRequestAgent,
} from '../../common/helpers/requests.helper';
import { LoginResponse } from '../../schemas';
import { OAuth2Client } from 'google-auth-library';
import { LoginGoogleInput } from './dto/login-google.input';
import { RegisterGoogleInput } from './dto/register-google.input';
import { RegisterGoogleBusinessInput } from './dto/register-google-business.input';
import { CreateUserInput } from '../users/dto/create-user.input';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly rLogin = userResponses.login;
  private readonly rList = userResponses.list;
  private readonly rToken = userResponses.token;
  private readonly rRegister = userResponses.create;
  private readonly clientId: string;
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersGettersService: UsersGettersService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokensService,
    private readonly configService: ConfigService,
    private readonly businessesGettersService: BusinessesGettersService,
    private readonly businessesService: BusinessesService,
  ) {
    this.clientId = this.configService.get<string>('GOOGLE_CLIENT_ID') ?? '';
    this.googleClient = new OAuth2Client(this.clientId);
  }

  /**
   * Validate user
   * @param {User} user
   * @param {string} password
   */
  async checkUserLogged(user: User, password: string) {
    if (!user) {
      LogWarn(
        this.logger,
        'User not exist or wrong password',
        this.validateUser.name,
        user,
      );
      throw new UnauthorizedException(this.rLogin.wrongData);
    }
    await argon2.verify(user.password, password).catch((error: Error) => {
      LogWarn(this.logger, error, this.validateUser.name, user);
      throw new UnauthorizedException(this.rLogin.wrongData);
    });
  }

  /**
   * Validate Business
   * @param {Business} business
   * @param {string} password
   */
  async checkBusinessLogged(business: Business, password: string) {
    if (!business) {
      LogWarn(
        this.logger,
        'Business not exist or wrong password',
        this.validateUser.name,
        business,
      );
      throw new UnauthorizedException(this.rLogin.wrongData);
    }
    await argon2.verify(business.password, password).catch((error: Error) => {
      LogWarn(this.logger, error, this.validateUser.name, business);
      throw new UnauthorizedException(this.rLogin.wrongData);
    });
  }

  /**
   * Check if the user is active, if not throws exception
   *
   * @param {StatusEnum} status - status property of a user
   */
  checkStatus(status: StatusEnum): void {
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
  ): Promise<ILoginResponse> {
    if (!refreshToken) {
      LogWarn(
        this.logger,
        this.rToken.notCookies.message,
        this.refreshToken.name,
      );
      throw new UnauthorizedException(this.rToken.notCookies);
    }

    const decodedToken = this.jwtService.decode<ITokenGenerate | null>(token);
    if (!decodedToken) {
      LogWarn(
        this.logger,
        this.rToken.tokenNotValid.message,
        this.refreshToken.name,
      );
      throw new UnauthorizedException(this.rToken.tokenNotValid);
    }

    if (decodedToken.isBusiness) {
      const business = await this.businessesGettersService
        .findOneByIdBusinessAndToken(
          decodedToken.idBusiness,
          decodedToken.email,
          decodedToken.status,
        )
        .catch((error: Error) => {
          LogError(this.logger, error, this.refreshToken.name);
          throw new UnauthorizedException(this.rToken.tokenNotValid);
        });
      const tokenDB = await this.tokenService.updateRefreshToken(
        refreshToken,
        token,
        business,
        this.rToken,
      );
      return { ...this.rToken.success, business, ...tokenDB };
    } else {
      const user = await this.usersGettersService
        .findOneByIdUserAndToken(
          decodedToken.idUser,
          decodedToken.email,
          decodedToken.status,
        )
        .catch((error: Error) => {
          LogError(this.logger, error, this.refreshToken.name);
          throw new UnauthorizedException(this.rToken.tokenNotValid);
        });
      const tokenDB = await this.tokenService.updateRefreshToken(
        refreshToken,
        token,
        user,
        this.rToken,
      );
      return { ...this.rToken.success, user, ...tokenDB };
    }
  }

  /**
   *  Function that validates the username (or email) and password,
   *  if both are correct, generates session token
   * @param {LoginDto} body - Login data
   * @returns {Promise<ILoginResponse>}
   */
  async validateUser(body: LoginDto): Promise<ILoginResponse> {
    const user = await this.usersGettersService.findOneByEmailWithPassword(
      body.email,
    );
    await this.checkUserLogged(user, body.password);
    // Check user status
    this.checkStatus(user.status);
    delete user.password;
    return await this.generateToken(user);
  }

  /**
   * Login user with Google OAuth token.
   * User must already exist in the database.
   * @param {LoginGoogleInput} data - Input containing the Google ID token
   * @returns {Promise<ILoginResponse>}
   */
  async loginWithGoogle(data: LoginGoogleInput): Promise<ILoginResponse> {
    const profile = await this.setDataUserFromGoogle(data.token);
    const user = await this.usersGettersService.findOneByEmailWithPassword(
      profile.email,
    );
    this.checkStatus(user.status);
    delete user?.password;
    return await this.generateToken(user);
  }

  /**
   * Register user with Google OAuth token.
   * User must NOT already exist in the database.
   * @param {RegisterGoogleInput} data - Input containing the Google ID token and role
   * @returns {Promise<ILoginResponse>}
   */
  async registerWithGoogle(data: RegisterGoogleInput): Promise<ILoginResponse> {
    if (
      data.role !== RolesCodesEnum.USER &&
      data.role !== RolesCodesEnum.BUSINESS
    ) {
      LogWarn(
        this.logger,
        this.rRegister.noPermission.message,
        this.registerWithGoogle.name,
      );
      throw new UnauthorizedException(this.rRegister.noPermission);
    }
    const profile = await this.setDataUserFromGoogle(data.token);
    const userExists = await this.usersGettersService.checkUserExistByEmail(
      profile.email,
    );
    if (userExists) {
      LogWarn(
        this.logger,
        this.rRegister.mailExists.message,
        this.registerWithGoogle.name,
      );
      throw new UnauthorizedException(this.rRegister.mailExists);
    }
    const username =
      profile.username ??
      (await this.usersService.generateUsername(
        profile.firstName,
        profile.lastName,
      ));
    const createData: CreateUserInput = {
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username,
      role: data.role,
      password: '',
    };
    const user = await this.usersService.create(
      createData,
      ProvidersEnum.GOOGLE,
    );
    this.checkStatus(user.status);
    delete user?.password;
    return await this.generateToken(user);
  }

  /**
   * Login business with Google OAuth token.
   * Business must already exist in the database.
   * @param {LoginGoogleInput} data - Input containing the Google ID token
   * @returns {Promise<ILoginResponse>}
   */
  async loginWithGoogleBusiness(
    data: LoginGoogleInput,
  ): Promise<ILoginResponse> {
    const profile = await this.setDataUserFromGoogle(data.token);
    const business =
      await this.businessesGettersService.findOneByEmailWithPassword(
        profile.email,
      );
    this.checkStatus(business.status);
    delete business?.password;
    return await this.generateToken(business);
  }

  /**
   * Register business with Google OAuth token.
   * Business must NOT already exist in the database.
   * @param {RegisterGoogleBusinessInput} data - Input containing the Google ID token
   * @returns {Promise<ILoginResponse>}
   */
  async registerWithGoogleBusiness(
    data: RegisterGoogleBusinessInput,
  ): Promise<ILoginResponse> {
    const profile = await this.setDataUserFromGoogle(data.token);
    const businessExists =
      await this.businessesGettersService.checkBusinessExistByEmail(
        profile.email,
      );
    if (businessExists) {
      LogWarn(
        this.logger,
        businessesResponses.create.mailExists.message,
        this.registerWithGoogleBusiness.name,
      );
      throw new UnauthorizedException(businessesResponses.create.mailExists);
    }
    const businessName =
      [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
      profile.email;
    const createData: CreateBusinessInput = {
      email: profile.email,
      name: businessName,
      role: RolesCodesEnum.BUSINESS,
      password: '',
    };
    const business = await this.businessesService.create(
      createData,
      ProvidersEnum.GOOGLE,
    );
    this.checkStatus(business.status);
    delete business?.password;
    return await this.generateToken(business);
  }

  /**
   * Verify Google ID token and extract user profile data.
   * @param {string} token - Google ID token from the frontend
   * @returns {Promise<{ email: string; firstName: string; lastName: string; username: string | null }>}
   */
  private async setDataUserFromGoogle(token: string): Promise<{
    email: string;
    firstName: string;
    lastName: string;
    username: string | null;
  }> {
    const googleUser = await this.googleVerify(token);
    return {
      email: googleUser.email,
      firstName: googleUser.name,
      lastName: googleUser.lastName ?? '',
      username: null,
    };
  }

  /**
   * Verify Google ID token and handle verification errors.
   * @param {string} tokenGoogle - Google ID token
   * @returns {Promise<IGoogleLogin>}
   */
  private async googleVerify(tokenGoogle: string): Promise<IGoogleLogin> {
    return await this.verifyGoogleToken(tokenGoogle).catch((err: Error) => {
      LogError(this.logger, err, this.googleVerify.name);
      throw new UnauthorizedException(this.rLogin.loginTypeInvalid);
    });
  }

  /**
   * Verify Google ID token using Google Auth Library.
   * @param {string} token - Google ID token from the frontend
   * @returns {Promise<IGoogleLogin>}
   */
  private async verifyGoogleToken(token: string): Promise<IGoogleLogin> {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: token,
      audience: this.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException(this.rLogin.loginTypeInvalid);
    }
    return {
      name: payload.given_name ?? '',
      lastName: payload.family_name ?? '',
      email: payload.email ?? '',
    };
  }

  /**
   *  Function that validates the username (or email) and password,
   *  if both are correct, generates session token
   * @param {LoginDto} body - Login data
   * @returns {Promise<ILoginResponse>}
   */
  async validateBusiness(body: LoginDto): Promise<ILoginResponse> {
    const business =
      await this.businessesGettersService.findOneByEmailWithPassword(
        body.email,
      );
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
    const user = await this.usersGettersService.findOneByEmailWithPassword(
      body.email,
    );
    const roles = user.userRoles
      .filter(
        (ur) =>
          ur.role.code === RolesCodesEnum.ADMIN ||
          ur.role.code === RolesCodesEnum.MODERATOR,
      )
      .map((ur) => ur.role);

    if (!this.isAdmin(roles)) {
      LogWarn(
        this.logger,
        this.rLogin.notAdmin.message,
        this.validateUserAdmin.name,
        user,
      );
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
   * @param {string} cookiePrefix - Prefix for cookie names
   * @returns {Promise<Response>}
   */
  async setCookies(
    res: Response,
    token: string,
    refreshToken: string,
    result: ILoginResponse,
    cookiePrefix: string,
  ): Promise<LoginResponse> {
    const sameSite = 'none' as const;
    const tokenName = `${cookiePrefix}token`;
    const refreshTokenName = `${cookiePrefix}refreshToken`;
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite,
      maxAge: 24 * 3600 * 1000, // 1 day
      path: '/',
    };
    // Access token cookie
    res.cookie(tokenName, token, cookieOptions);
    // Refresh token cookie - consider limiting `path` to a refresh endpoint if desired
    res.cookie(refreshTokenName, refreshToken, cookieOptions);
    // Do not call res.send here — GraphQL resolvers should return plain data.
    return { ...result };
  }

  /**
   * Read tokens from request cookies, refresh them and set new cookies in response
   */
  async refreshAndSetCookies(
    req: Request,
    res: Response,
    cookiePrefix: string,
  ): Promise<LoginResponse> {
    const prefixedAccess: unknown = req.cookies[`${cookiePrefix}token`];
    const fallbackAccess: unknown = req.cookies.token;
    const token =
      typeof prefixedAccess === 'string' && prefixedAccess.length > 0
        ? prefixedAccess
        : typeof fallbackAccess === 'string'
          ? fallbackAccess
          : '';
    const prefixedRefresh: unknown = req.cookies[`${cookiePrefix}refreshToken`];
    const fallbackRefresh: unknown = req.cookies.refreshToken;
    const refreshToken =
      typeof prefixedRefresh === 'string' && prefixedRefresh.length > 0
        ? prefixedRefresh
        : typeof fallbackRefresh === 'string'
          ? fallbackRefresh
          : '';

    if (!refreshToken) {
      LogWarn(
        this.logger,
        this.rToken.notCookies.message,
        this.refreshAndSetCookies.name,
      );
      throw new UnauthorizedException(this.rToken.notCookies);
    }

    if (!this.jwtService.decode<ITokenGenerate | null>(token)) {
      LogWarn(
        this.logger,
        this.rToken.tokenNotValid.message,
        this.refreshAndSetCookies.name,
      );
      throw new UnauthorizedException(this.rToken.tokenNotValid);
    }

    const result = await this.refreshToken(refreshToken, token);
    const newToken = result.token;
    const newRefresh = result.refreshToken;
    delete result.token;
    delete result.refreshToken;
    return await this.setCookies(
      res,
      newToken,
      newRefresh,
      result,
      cookiePrefix,
    );
  }

  /**
   * Logout and erase the cookies
   * @param {Request} req - request Object
   * @param {Response} res - response Object
   * @param {IUserOrBusinessReq} userOrBusiness - User or Business making the logout
   * @param {IResponseWithData} response - response with the structure to return
   * @returns {Promise<IResponse>}
   */
  async logout(
    req: Request,
    res: Response,
    userOrBusiness: IUserOrBusinessReq,
    response: IResponseWithData,
    cookiePrefix: string,
  ): Promise<IResponse> {
    const domains = getAcceptableDomains();
    const agent = getRequestAgent(req, domains);
    const tokenName = `${cookiePrefix}token`;
    const refreshName = `${cookiePrefix}refreshToken`;
    const pickCookie = (primary: unknown, fallback: unknown): string =>
      typeof primary === 'string' && primary.length > 0
        ? primary
        : typeof fallback === 'string'
          ? fallback
          : '';
    const dataToken: ILogout = {
      token: pickCookie(req.cookies[tokenName], req.cookies.token),
      refreshToken: pickCookie(
        req.cookies[refreshName],
        req.cookies.refreshToken,
      ),
      domain: agent,
      secure: agent.includes(this.configService.get<string>('MAIN_DOMAIN')),
      httpOnly: agent.includes(this.configService.get<string>('MAIN_DOMAIN')),
    };

    LogWarn(this.logger, 'Logout', this.logout.name, userOrBusiness);
    this.logger.log(agent);

    if (userOrBusiness['businessId']) {
      const business = userOrBusiness as IBusinessReq;
      await this.tokenService.removeTokenBusiness(
        dataToken.refreshToken,
        dataToken.token,
        business,
      );
    } else {
      const user = userOrBusiness as IUserReq;
      await this.tokenService.removeTokenUser(
        dataToken.refreshToken,
        dataToken.token,
        user,
      );
    }

    // Cookie options must match EXACTLY those used in setCookies.
    // setCookies does NOT set domain (host-only cookie), so we must not add it here.
    // Adding domain causes clearCookie to fail in production (e.g. API at api.example.com,
    // frontend at app.example.com - cookie is for api.example.com, not app.example.com).
    const cookieOptions = {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'none' as const,
    };

    // Clear both prefixed and default cookie names to be safe
    res.clearCookie(tokenName, cookieOptions);
    res.clearCookie(refreshName, cookieOptions);
    if (tokenName !== 'token') {
      res.clearCookie('token', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
    }
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
    const business = isBusiness ? (user as Business) : null;
    const userResponse = isBusiness ? null : (user as User);
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
        const permissionCode = p.permission.code as AdminPermissionsEnum;
        if (permissionCode === AdminPermissionsEnum.LOGIN) {
          havePermission = true;
        }
      });
    }
    return havePermission;
  }
}
