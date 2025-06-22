import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Put,
  UseGuards,
  Query
} from '@nestjs/common';
import { UsersService } from '../../../../core/modules/users/users.service';
import { CreateUserDto } from '../../../../core/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '../../../../core/modules/users/dto/update-user.dto';
import { userResponses } from '../../../../core/common/responses';
import { ProvidersEnum, UsersPermissionsEnum } from '../../../../core/common/enums';
import { IUserReq } from '../../../../core/common/interfaces';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserDec } from '../../../../core/common/decorators/user.decorator';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { Permissions, Response } from '../../../../core/common/decorators';
import { InfinityScrollDto } from '../../../../core/common/dtos';

@ApiTags('Users')
@UsePipes(new ValidationPipe())
@Controller('users')
export class UsersController {
  private readonly _uCreate = userResponses.create;
  private readonly _uList = userResponses.list;
  private readonly _uUpdate = userResponses.update;
  private readonly _uDelete = userResponses.delete;

  constructor(private readonly usersService: UsersService) { }

  @ApiOperation({ summary: 'Create user (Admin or Moderator)' })
  @ApiResponse({ status: 201, description: 'User (Admin or Moderator) created.' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRCREALL)
  @Response(userResponses.create)
  @Post()
  async create(@Body() data: CreateUserDto) {
    return {
      ...this._uCreate.success,
      user: await this.usersService.create(data, ProvidersEnum.LineUp, true),
    };
  }

  @ApiOperation({ summary: 'Find all users' })
  @ApiResponse({ status: 200, description: 'All Users listed.' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRLISALL)
  @Response(userResponses.list)
  @Get()
  async findAll(@Query() query: InfinityScrollDto) {
    return {
      ...this._uList.success,
      result: await this.usersService.findAll(query)
    };
  }

  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'User listed.' })
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return {
      ...this._uList.success,
      user: await this.usersService.findOne(id),
    };
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated.' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRLISOWN)
  @Response(userResponses.list)
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() data: UpdateUserDto,
    @UserDec() user: IUserReq
  ) {
    return {
      ...this._uUpdate.success,
      user: await this.usersService.update(id, data, user)
    };
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted.' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(UsersPermissionsEnum.USRDELOWN)
  @Response(userResponses.list)
  @Delete(':id')
  async remove(@Param('id') id: number, @UserDec() user: IUserReq) {
    await this.usersService.remove(id, user);
    return this._uDelete.success;
  }
}
