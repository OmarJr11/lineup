import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BusinessesPermissionsEnum, ProvidersEnum, UsersPermissionsEnum } from '../../../../core/common/enums';
import { BusinessSchema } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { IBusinessReq, IUserReq } from '../../../../core/common/interfaces';
import { UserDec, Permissions, BusinessDec } from '../../../../core/common/decorators';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { CreateBusinessInput } from 'core/modules/businesses/dto/create-business.input';
import { toBusinessSchema } from 'core/common/functions/businesses.function';
import { UpdateBusinessInput } from 'core/modules/businesses/dto/update-business.input';

@UsePipes(new ValidationPipe())
@Resolver(() => BusinessSchema)
export class BusinessesResolver {
  constructor(private readonly businessesService: BusinessesService) {}

  @Mutation(() => BusinessSchema, { name: 'createBusiness' })
  async createBusiness(@Args('data') data: CreateBusinessInput) {
    const business = await this.businessesService.create(data, ProvidersEnum.LineUp);
    return toBusinessSchema(business);
  }

  @Query(() => BusinessSchema, { name: 'findOneBusiness' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toBusinessSchema(await this.businessesService.findOne(id));
  }

  @Mutation(() => BusinessSchema, { name: 'updateBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard/*, PermissionsGuard*/) //FIX GUARDS Token and Permissions
  //@Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  async updateBusiness(
    @Args('data') data: UpdateBusinessInput,
    @BusinessDec() businessReq: IBusinessReq
  ) {
    const business = await this.businessesService.update(data.id, data, businessReq);
    return toBusinessSchema(business);
  }

  @Mutation(() => BusinessSchema, { name: 'removeBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard) //FIX GUARDS
  @Permissions(BusinessesPermissionsEnum.BURDELOWN)
  async removeBusiness(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() businessReq: IBusinessReq
  ) {
    return await this.businessesService.remove(id, businessReq);
  }
}
