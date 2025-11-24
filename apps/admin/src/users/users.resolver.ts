import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from '../../../../core/modules/users/users.service';
import { CreateUserInput } from '../../../../core/modules/users/dto/create-user.input';
import { UpdateUserInput } from '../../../../core/modules/users/dto/update-user.input';
import { userResponses } from '../../../../core/common/responses';
import { ProvidersEnum, UsersPermissionsEnum } from '../../../../core/common/enums';
import { IUserReq } from '../../../../core/common/interfaces';
import { UserDec } from '../../../../core/common/decorators/user.decorator';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { Permissions, Response } from '../../../../core/common/decorators';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { PaginatedUsers, UserSchema } from '../../../../core/schemas';
import { toUserSchema } from '../../../../core/common/functions';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';

@UsePipes(new ValidationPipe())
@Resolver(() => UserSchema)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  @Mutation(() => UserSchema, { name: 'createUserAdmin' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRCREALL)
  @Response(userResponses.create)
  async createUser(
    @Args('data') data: CreateUserInput
  ): Promise<UserSchema> {
    const user = await this.usersService.create(data, ProvidersEnum.LineUp, true);
    return toUserSchema(user);
  }

  @Query(() => PaginatedUsers, { name: 'findAllUsers' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRLISALL)
  @Response(userResponses.list)
  async findAllUsers(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput
  ): Promise<PaginatedUsers> {
    const items = (await this.usersService.findAll(pagination))
      .map(user => toUserSchema(user));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  @Query(() => UserSchema, { name: 'findOneUser' })
  async findOneUser(
    @Args('id', { type: () => Int }) id: number
  ): Promise<UserSchema> {
    const user = await this.usersService.findOne(id);
    return toUserSchema(user);
  }

  @Mutation(() => UserSchema, { name: 'updateUser' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRUPDALL)
  @Response(userResponses.list)
  async updateUser(
    @Args('data') data: UpdateUserInput,
    @UserDec() user: IUserReq
  ): Promise<UserSchema> {
    const updatedUser = await this.usersService.update(data, user);
    return toUserSchema(updatedUser);
  }

  @Mutation(() => Boolean, { name: 'removeUser' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRDELALL)
  async removeUser(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() user: IUserReq
  ): Promise<boolean> {
    await this.usersService.remove(id, user);
    return true;
  }
}
