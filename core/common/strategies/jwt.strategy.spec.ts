import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_secret';
    strategy = new JwtStrategy();
  });

  describe('validate', () => {
    it('returns business payload when isBusiness is true', async () => {
      const result = await strategy.validate({
        isBusiness: true,
        sub: '42',
        username: 'biz',
        path: '/biz-path',
      });

      expect(result).toEqual({
        businessId: 42,
        path: '/biz-path',
      });
    });

    it('returns user payload when isBusiness is false', async () => {
      const result = await strategy.validate({
        isBusiness: false,
        sub: '10',
        username: 'john_doe',
        path: '',
      });

      expect(result).toEqual({
        userId: 10,
        username: 'john_doe',
      });
    });
  });
});
