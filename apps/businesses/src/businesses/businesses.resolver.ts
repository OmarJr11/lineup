import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import {
  BusinessesPermissionsEnum,
  ProvidersEnum,
} from '../../../../core/common/enums';
import { BusinessSchema, LoginResponse } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TokenGuard,
} from '../../../../core/common/guards';
import { IBusinessReq } from '../../../../core/common/interfaces';
import {
  BusinessDec,
  Permissions,
  Response,
} from '../../../../core/common/decorators';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { CreateBusinessInput } from '../../../../core/modules/businesses/dto/create-business.input';
import { toBusinessSchema } from '../../../../core/common/functions/businesses.function';
import { UpdateBusinessInput } from '../../../../core/modules/businesses/dto/update-business.input';
import { UpdateBusinessEmailInput } from '../../../../core/modules/businesses/dto/update-business-email.input';
import { businessesResponses } from '../../../../core/common/responses';
import { ChangePasswordInput } from '../../../../core/common/dtos';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { TokensService } from '../../../../core/modules/token/token.service';
import { Response as ResponseExpress } from 'express';
import { CookiesPrefixEnum } from '../../../../core/common/enums';

const cookiePrefix = CookiesPrefixEnum.BUSINESSES;

@UsePipes(new ValidationPipe())
@Resolver(() => BusinessSchema)
export class BusinessesResolver {
  private readonly _bCreate = businessesResponses.create;

  constructor(
    private readonly businessesService: BusinessesService,
    private readonly tokensService: TokensService,
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => LoginResponse)
  async createBusiness(
    @Args('data') data: CreateBusinessInput,
    @Context() ctx: any,
  ): Promise<LoginResponse> {
    const res: ResponseExpress = ctx.res;
    const business = await this.businessesService.create(
      data,
      ProvidersEnum.LineUp,
    );
    const { token, refreshToken } =
      await this.tokensService.generateTokens(business);
    const result = { ...this._bCreate.success, business };
    return await this.authService.setCookies(
      res,
      token,
      refreshToken,
      result,
      cookiePrefix,
    );
  }

  @Query(() => BusinessSchema, { name: 'findBusinessByPath' })
  async findByPath(@Args('path', { type: () => String }) path: string) {
    return toBusinessSchema(await this.businessesService.findOneByPath(path));
  }

  @Query(() => BusinessSchema, { name: 'myBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard)
  async myBusiness(@BusinessDec() businessReq: IBusinessReq) {
    const found = await this.businessesService.findOne(businessReq.businessId);
    return toBusinessSchema(found);
  }

  /**
   * Changes the password of the authenticated business.
   * Requires a valid one-time verification code sent to the business's registered destination.
   *
   * @param {ChangePasswordInput} data - Current password, new password, destination and verification code
   * @param {IBusinessReq} businessReq - Authenticated business extracted from JWT
   * @returns {Promise<boolean>}
   */
  @Mutation(() => Boolean, { name: 'changeBusinessPassword' })
  @UseGuards(JwtAuthGuard, TokenGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  @Response(businessesResponses.changePassword)
  async changePassword(
    @Args('data') data: ChangePasswordInput,
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<boolean> {
    return await this.businessesService.changePassword(data, businessReq);
  }

  @Mutation(() => BusinessSchema, { name: 'updateBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  @Response(businessesResponses.update)
  async updateBusiness(
    @Args('data') data: UpdateBusinessInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const business = await this.businessesService.update(data, businessReq);
    return toBusinessSchema(business);
  }

  /**
   * Updates the email of the authenticated business.
   * @param data - The new email
   * @param businessReq - Authenticated business from JWT
   * @returns The updated business schema
   */
  @Mutation(() => BusinessSchema, { name: 'updateBusinessEmail' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  @Response(businessesResponses.update)
  async updateBusinessEmail(
    @Args('data') data: UpdateBusinessEmailInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const business = await this.businessesService.updateEmail(
      data,
      businessReq,
    );
    return toBusinessSchema(business);
  }

  @Mutation(() => BusinessSchema, { name: 'removeBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURDELOWN)
  @Response(businessesResponses.delete)
  async removeBusiness(@BusinessDec() businessReq: IBusinessReq) {
    return await this.businessesService.remove(
      businessReq.businessId,
      businessReq,
    );
  }
}
