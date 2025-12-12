import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { BusinessesPermissionsEnum, ProvidersEnum } from '../../../../core/common/enums';
import { BusinessSchema, LoginResponse, PaginatedBusinesses } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { BusinessDec, Permissions, Response, UserDec} from '../../../../core/common/decorators';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { CreateBusinessInput } from '../../../../core/modules/businesses/dto/create-business.input';
import { toBusinessSchema } from '../../../../core/common/functions/businesses.function';
import { UpdateBusinessInput } from '../../../../core/modules/businesses/dto/update-business.input';
import { businessesResponses } from '../../../../core/common/responses';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { TokensService } from '../../../../core/modules/token/token.service';
import { Response as ResponseExpress } from 'express';

@UsePipes(new ValidationPipe())
@Resolver(() => BusinessSchema)
export class BusinessesResolver {
  private readonly _bCreate = businessesResponses.create;
  
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly tokensService: TokensService,
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => LoginResponse )
  async createBusiness(
    @Args('data') data: CreateBusinessInput,
    @Context() ctx: any,
  ): Promise<LoginResponse> {
    const res: ResponseExpress = ctx.res;
    const business = await this.businessesService.create(data, ProvidersEnum.LineUp);
    const { token, refreshToken } =
    await this.tokensService.generateTokens(business);
    const result = { ...this._bCreate.success, business };
    return await this.authService.setCookies(res, token, refreshToken, result, 'lineup_');
  }

  @Query(() => BusinessSchema, { name: 'findOneBusiness' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toBusinessSchema(await this.businessesService.findOne(id));
  }

  @Query(() => PaginatedBusinesses, { name: 'findAllBusinesses' })
  async findAll(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput
  ) {
    const items = (await this.businessesService.findAll(pagination))
      .map(business => toBusinessSchema(business));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  @Query(() => BusinessSchema, { name: 'myBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard)
  async myBusiness(
    @BusinessDec() businessReq: IBusinessReq
  ) {
    return toBusinessSchema(await this.businessesService.findOne(businessReq.businessId));
  }

  @Mutation(() => BusinessSchema, { name: 'updateBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  @Response(businessesResponses.update)
  async updateBusiness(
    @Args('data') data: UpdateBusinessInput,
    @BusinessDec() businessReq: IBusinessReq
  ) {
    const business = await this.businessesService.update(data, businessReq);
    return toBusinessSchema(business);
  }

  @Mutation(() => BusinessSchema, { name: 'removeBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURDELOWN)
  @Response(businessesResponses.delete)
  async removeBusiness(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() businessReq: IBusinessReq
  ) {
    return await this.businessesService.remove(id, businessReq);
  }
}
