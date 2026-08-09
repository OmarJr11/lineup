import { BusinessesResolver } from './businesses.resolver';
import type { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import type { Business } from '../../../../core/entities';
import type { IUserReq } from '../../../../core/common/interfaces';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { UpdateBusinessInput } from '../../../../core/modules/businesses/dto/update-business.input';

/**
 * Unit tests for {@link BusinessesResolver} (admin app).
 */
describe('BusinessesResolver (admin)', () => {
  let resolver: BusinessesResolver;
  const businessesServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const adminUser: IUserReq = { userId: 99, username: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new BusinessesResolver(
      businessesServiceMock as unknown as BusinessesService,
    );
  });

  describe('findAllBusinesses', () => {
    it('maps businesses to schema and returns pagination envelope', async () => {
      const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
      const rows = [{ id: 1 }, { id: 2 }] as Business[];
      businessesServiceMock.findAll.mockResolvedValue(rows);
      const result = await resolver.findAllBusinesses(pagination);
      expect(businessesServiceMock.findAll).toHaveBeenCalledWith(pagination);
      expect(result.items).toEqual(rows);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('findOneBusiness', () => {
    it('delegates to findOne', async () => {
      const b = { id: 5 } as Business;
      businessesServiceMock.findOne.mockResolvedValue(b);
      await expect(resolver.findOneBusiness(5)).resolves.toEqual(b);
    });
  });

  describe('updateBusiness', () => {
    it('delegates to businessesService.update with admin user', async () => {
      const data: UpdateBusinessInput = { id: 1, name: 'New' };
      const updated = { id: 1, name: 'New' } as Business;
      businessesServiceMock.update.mockResolvedValue(updated);
      const result = await resolver.updateBusiness(data, adminUser);
      expect(businessesServiceMock.update).toHaveBeenCalledWith(
        data,
        adminUser,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('removeBusiness', () => {
    it('delegates to remove and returns true', async () => {
      businessesServiceMock.remove.mockResolvedValue(undefined);
      await expect(resolver.removeBusiness(3, adminUser)).resolves.toBe(true);
      expect(businessesServiceMock.remove).toHaveBeenCalledWith(3, adminUser);
    });
  });
});
