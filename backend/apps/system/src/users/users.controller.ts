import { Controller, Get, Post, Body, Param, Delete, Put, UsePipes, ValidationPipe, UseInterceptors } from '@nestjs/common';
import { UsersService } from '../../../../core/system/users/users.service';
import { userResponses } from '../../../../core/common/responses';
import { CookieInterceptor } from '../../../../core/common/interfaces';
import { CreateUserDto } from '../../../../core/system/users/dto/create-user.dto';

@Controller('users')
export class UsersController {
  private readonly rCreate = userResponses.create;
  private readonly rUpdate = userResponses.update;
  private readonly rList = userResponses.list;

  constructor(private readonly usersService: UsersService) {}

  @UseInterceptors(CookieInterceptor)
  @UsePipes(new ValidationPipe())
  @Post()
  async create(@Body() data: CreateUserDto) {
    return {
      ...this.rCreate.success,
      user: await this.usersService.create(data)
    };
  }
}
