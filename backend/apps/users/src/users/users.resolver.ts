import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProvidersEnum, UsersPermissionsEnum } from '../../../../core/common/enums';
import { toUserSchema } from '../../../../core/common/functions';
import { CreateUserInput } from '../../../../core/modules/users/dto/create-user.input';
import { UsersService } from '../../../../core/modules/users/users.service';
import { UserSchema } from '../../../../core/schemas';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { UpdateUserInput } from '../../../../core/modules/users/dto/update-user.input';
import { IUserReq } from '../../../../core/common/interfaces';
import { UserDec, Permissions } from '../../../../core/common/decorators';

@UsePipes(new ValidationPipe())
@Resolver(() => UserSchema)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => UserSchema, { name: 'createUser' })
  async createUser(
    @Args('data') data: CreateUserInput
  ): Promise<UserSchema> {
    const user = await this.usersService.create(data, ProvidersEnum.LineUp);
    return toUserSchema(user);
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
  @Permissions(UsersPermissionsEnum.USRLISOWN)
  async updateUser(
    @Args('id', { type: () => Int }) id: number,
    @Args('data') data: UpdateUserInput,
    @UserDec() user: IUserReq
  ): Promise<UserSchema> {
    const updatedUser = await this.usersService.update(id, data, user);
    return toUserSchema(updatedUser);
  }

  @Mutation(() => Boolean, { name: 'removeUser' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRDELOWN)
  async removeUser(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() user: IUserReq
  ): Promise<boolean> {
    await this.usersService.remove(id, user);
    return true;
  }
}
