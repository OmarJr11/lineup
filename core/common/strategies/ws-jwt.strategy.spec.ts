import { ForbiddenException } from '@nestjs/common';
import { WsJwtStrategy } from './ws-jwt.strategy';
import { StatusEnum } from '../enums';

describe('WsJwtStrategy', () => {
  let strategy: WsJwtStrategy;
  let userServiceMock: any;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    userServiceMock = {
      findOneOrFail: jest.fn(),
    };
    strategy = new WsJwtStrategy(userServiceMock);
  });

  describe('validate', () => {
    it('returns user payload when active user is found', async () => {
      userServiceMock.findOneOrFail.mockResolvedValue({ id: 12, status: StatusEnum.ACTIVE });

      const result = await strategy.validate({
        sub: 12,
        username: 'alice',
      });

      expect(userServiceMock.findOneOrFail).toHaveBeenCalledWith(12, {
        where: [{ status: StatusEnum.ACTIVE }],
      });
      expect(result).toEqual({
        userId: 12,
        username: 'alice',
      });
    });

    it('throws ForbiddenException when active user is not found', async () => {
      userServiceMock.findOneOrFail.mockRejectedValue(new Error('User not found'));

      await expect(
        strategy.validate({
          sub: 99,
          username: 'ghost',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
