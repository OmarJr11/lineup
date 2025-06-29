import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { BusinessesPermissionsEnum, UsersPermissionsEnum } from '../../../../core/common/enums';
import { BusinessSchema } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { IUserReq } from '../../../../core/common/interfaces';
import { UserDec, Permissions } from '../../../../core/common/decorators';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { CreateBusinessInput } from 'core/modules/businesses/dto/create-business.input';
import { toBusinessSchema } from 'core/common/functions/businesses.function';
import { UpdateBusinessInput } from 'core/modules/businesses/dto/update-business.input';

@UsePipes(new ValidationPipe())
@Resolver(() => BusinessSchema)
export class BusinessesResolver {
  constructor(private readonly businessesService: BusinessesService) {}

  @Mutation(() => BusinessSchema, { name: 'createBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURCREALL)
  async createBusiness(
    @Args('data') data: CreateBusinessInput,
    @UserDec() user: IUserReq
  ) {
    const business = await this.businessesService.create(data, user);
    return toBusinessSchema(business);
  }

  @Query(() => BusinessSchema, { name: 'findOneBusiness' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toBusinessSchema(await this.businessesService.findOne(id));
  }

  @Mutation(() => BusinessSchema, { name: 'updateBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  async updateBusiness(
    @Args('data') data: UpdateBusinessInput,
    @UserDec() user: IUserReq
  ) {
    const business = await this.businessesService.update(data.id, data, user);
    return toBusinessSchema(business);
  }

  @Mutation(() => BusinessSchema, { name: 'removeBusiness' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURDELOWN)
  async removeBusiness(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() user: IUserReq
  ) {
    return await this.businessesService.remove(id, user);
  }
}
