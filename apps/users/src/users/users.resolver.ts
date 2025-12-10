import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { ProvidersEnum, UsersPermissionsEnum } from '../../../../core/common/enums';
import { toUserSchema } from '../../../../core/common/functions';
import { CreateUserInput } from '../../../../core/modules/users/dto/create-user.input';
import { UsersService } from '../../../../core/modules/users/users.service';
import { UserSchema } from '../../../../core/schemas';
import { UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { UpdateUserInput } from '../../../../core/modules/users/dto/update-user.input';
import { ICookieInterceptor, IUserReq } from '../../../../core/common/interfaces';
import { UserDec, Permissions } from '../../../../core/common/decorators';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { TokensService } from '../../../../core/modules/token/token.service';
import { userResponses } from '../../../../core/common/responses';
import { LoginResponse } from '../../../../core/schemas/login-response.schema';
import { Response } from 'express';

@UsePipes(new ValidationPipe())
@Resolver(() => UserSchema)
export class UsersResolver {
  private readonly _uCreate = userResponses.create;

  constructor(
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly authService: AuthService,
  ) {}

  @UseInterceptors(ICookieInterceptor)
  @Mutation(() => LoginResponse )
  async createUser(
    @Args('data') data: CreateUserInput,
    @Context() ctx: any,
  ): Promise<LoginResponse> {
    const res: Response = ctx.res;
    const user = await this.usersService.create(data, ProvidersEnum.LineUp);
    const { token, refreshToken } =
    await this.tokensService.generateTokens(user);
    const result = { ...this._uCreate.success, user };
    return await this.authService.setCookies(res, token, refreshToken, result, 'lineup_');
  }

  @Query(() => UserSchema, { name: 'userById' })
  async userById(
    @Args('id', { type: () => Int }) id: number
  ): Promise<UserSchema> {
    const user = await this.usersService.findOne(id);
    return toUserSchema(user);
  }

  @Mutation(() => UserSchema)
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRLISOWN)
  async updateUser(
    @Args('data') data: UpdateUserInput,
    @UserDec() user: IUserReq
  ): Promise<UserSchema> {
    const updatedUser = await this.usersService.update(data, user);
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
