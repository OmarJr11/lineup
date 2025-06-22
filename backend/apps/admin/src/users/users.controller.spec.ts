import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from '../../../../core/modules/users/users.service';
import { CreateUserDto } from '../../../../core/modules/users/dto/create-user.dto';
import { UpdateUserDto } from '../../../../core/modules/users/dto/update-user.dto';
import { userResponses } from '../../../../core/common/responses';
import { JwtAuthGuard, TokenGuard, PermissionsGuard } from '../../../../core/common/guards';
import { InfinityScrollDto } from '../../../../core/common/dtos';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(TokenGuard).useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should create a user', async () => {
    const dto: CreateUserDto = { email: 'test@example.com', password: '123456' } as any;
    const user = { id: 1, email: 'test@example.com' };
    mockUsersService.create.mockResolvedValue(user);
    const expected = {
      ...userResponses.create.success,
      user,
    };
    expect(await controller.create(dto)).toEqual(expected);
    expect(service.create).toHaveBeenCalledWith(dto, expect.anything(), true);
  });

  it('should return all users', async () => {
    const query: InfinityScrollDto = {} as any;
    const result = [{ id: 1, email: 'test@example.com' }];
    mockUsersService.findAll.mockResolvedValue(result);
    const expected = {
      ...userResponses.list.success,
      result,
    };
    expect(await controller.findAll(query)).toEqual(expected);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should return user by id', async () => {
    const user = { id: 1, email: 'test@example.com' };
    mockUsersService.findOne.mockResolvedValue(user);
    const expected = {
      ...userResponses.list.success,
      user,
    };
    expect(await controller.findOne(1)).toEqual(expected);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should update a user', async () => {
    const user = { id: 1, email: 'test@example.com' };
    const dto: UpdateUserDto = { firstName: 'Test' } as any;
    const reqUser = { id: 1 } as any;
    mockUsersService.update.mockResolvedValue(user);
    const expected = {
      ...userResponses.update.success,
      user,
    };
    expect(await controller.update(1, dto, reqUser)).toEqual(expected);
    expect(service.update).toHaveBeenCalledWith(1, dto, reqUser);
  });

  it('should delete a user', async () => {
    const reqUser = { id: 1 } as any;
    mockUsersService.remove.mockResolvedValue(undefined);
    expect(await controller.remove(1, reqUser)).toEqual(userResponses.delete.success);
    expect(service.remove).toHaveBeenCalledWith(1, reqUser);
  });
});
