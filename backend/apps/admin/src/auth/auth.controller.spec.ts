import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { LoginDto } from '../../../../core/modules/auth/dto/login.dto';
import { User } from '../../../../core/entities';
import { TokenHeaderInterceptor } from '../../../../core/common/interceptors';
import { JwtService } from '@nestjs/jwt';

// Mock AuthService
const mockAuthService = {
  validateUserAdmin: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

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

  it('should call AuthService.validateUserAdmin on loginUser', async () => {
    const dto: LoginDto = { email: 'test@example.com', password: '123456' } as any;
    const result = {
        code: 101006,
        status: true,
        message: 'Successful token refresh',
        token: 'validToken',
        refreshToken: 'newRefreshToken',
        user: {
            id: 1,
            email: 'omat@example.com',
            emailValidated: false,
            username: 'testuser',
            firstName: 'Test',
            lastName: 'User',
            status: 'active',
            provider: 'lineUp',
            userRoles: []
        } as User
    };
    jest.spyOn(service, 'validateUserAdmin').mockResolvedValue(result);
    expect(await controller.loginUser(dto)).toBe(result);
    expect(service.validateUserAdmin).toHaveBeenCalledWith(dto);
  });
});
