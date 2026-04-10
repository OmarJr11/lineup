import { BusinessesResolver } from './businesses.resolver';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { TokensService } from '../../../../core/modules/token/token.service';
import { AuthService } from '../../../../core/modules/auth/auth.service';
import { CookiesPrefixEnum, ProvidersEnum } from '../../../../core/common/enums';
import type { CreateBusinessInput } from '../../../../core/modules/businesses/dto/create-business.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link BusinessesResolver}.
 */
describe('BusinessesResolver', () => {
  let resolver: BusinessesResolver;
  const businessesServiceMock = {
    create: jest.fn(),
    findOneByPath: jest.fn(),
    findOne: jest.fn(),
    changePassword: jest.fn(),
    update: jest.fn(),
    updateEmail: jest.fn(),
    remove: jest.fn(),
  };
  const tokensServiceMock = {
    generateTokens: jest.fn(),
  };
  const authServiceMock = {
    setCookies: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new BusinessesResolver(
      businessesServiceMock as unknown as BusinessesService,
      tokensServiceMock as unknown as TokensService,
      authServiceMock as unknown as AuthService,
    );
  });

  describe('createBusiness', () => {
    it('creates business, generates tokens, and delegates cookie handling', async () => {
      const data = { name: 'Shop' } as CreateBusinessInput;
      const business = { id: 5, path: '/p' };
      const loginPayload = { ok: true };
      businessesServiceMock.create.mockResolvedValue(business);
      tokensServiceMock.generateTokens.mockResolvedValue({
        token: 't',
        refreshToken: 'r',
      });
      authServiceMock.setCookies.mockResolvedValue(loginPayload);
      const ctx = { res: {} };
      const result = await resolver.createBusiness(data, ctx);
      expect(businessesServiceMock.create).toHaveBeenCalledWith(
        data,
        ProvidersEnum.LineUp,
      );
      expect(tokensServiceMock.generateTokens).toHaveBeenCalledWith(business);
      expect(authServiceMock.setCookies).toHaveBeenCalledWith(
        ctx.res,
        't',
        'r',
        expect.objectContaining({ business }),
        CookiesPrefixEnum.BUSINESSES,
      );
      expect(result).toBe(loginPayload);
    });
  });

  describe('findByPath', () => {
    it('delegates to businessesService.findOneByPath', async () => {
      const entity = { id: 1, path: '/x' };
      businessesServiceMock.findOneByPath.mockResolvedValue(entity);
      const out = await resolver.findByPath('/x');
      expect(businessesServiceMock.findOneByPath).toHaveBeenCalledWith('/x');
      expect(out).toBe(entity);
    });
  });

  describe('myBusiness', () => {
    it('loads business by id from JWT context', async () => {
      const businessReq = { businessId: 9 } as IBusinessReq;
      const entity = { id: 9 };
      businessesServiceMock.findOne.mockResolvedValue(entity);
      const out = await resolver.myBusiness(businessReq);
      expect(businessesServiceMock.findOne).toHaveBeenCalledWith(9);
      expect(out).toBe(entity);
    });
  });

  describe('removeBusiness', () => {
    it('delegates to businessesService.remove', async () => {
      const businessReq = { businessId: 3 } as IBusinessReq;
      businessesServiceMock.remove.mockResolvedValue(true);
      const out = await resolver.removeBusiness(businessReq);
      expect(businessesServiceMock.remove).toHaveBeenCalledWith(3, businessReq);
      expect(out).toBe(true);
    });
  });
});
