import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { TokenHeaderInterceptor } from '../../../../core/common/interceptors';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
        providers: [
            { provide: AuthService, useValue: mockAuthService },
            { provide: TokenHeaderInterceptor, useValue: { intercept: jest.fn() } },
            { provide: JwtService, useValue: {} },
        ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call AuthService.validateUser on loginUser', async () => {
    const dto: LoginDto = { email: 'test@example.com', password: '123456' } as any;
    const result = { token: 'jwt-token' };
    mockAuthService.validateUser.mockResolvedValue(result);
    expect(await controller.loginUser(dto)).toBe(result);
    expect(service.validateUser).toHaveBeenCalledWith(dto);
  });
});
