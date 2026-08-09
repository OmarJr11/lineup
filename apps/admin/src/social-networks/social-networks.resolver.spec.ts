import { SocialNetworksResolver } from './social-networks.resolver';
import { SocialNetworksService } from '../../../../core/modules/social-networks/social-networks.service';
import { SocialMediasEnum } from '../../../../core/common/enums';
import type { SocialNetwork } from '../../../../core/entities';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link SocialNetworksResolver}.
 */
describe('SocialNetworksResolver', () => {
  let resolver: SocialNetworksResolver;
  const socialNetworksServiceMock = {
    create: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const user: IUserReq = { userId: 1, username: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new SocialNetworksResolver(
      socialNetworksServiceMock as unknown as SocialNetworksService,
    );
  });

  describe('createSocialNetwork', () => {
    it('delegates to service and maps schema', async () => {
      const created = { id: 5, name: 'Ig' } as SocialNetwork;
      socialNetworksServiceMock.create.mockResolvedValue(created);
      const data = { name: 'Ig' };
      const result = await resolver.createSocialNetwork(data as never, user);
      expect(socialNetworksServiceMock.create).toHaveBeenCalledWith(data, user);
      expect(result).toEqual(created);
    });
  });

  describe('findById', () => {
    it('returns mapped social network', async () => {
      const sn = { id: 3, name: 'X' } as SocialNetwork;
      socialNetworksServiceMock.findById.mockResolvedValue(sn);
      await expect(resolver.findById(3)).resolves.toEqual(sn);
    });
  });

  describe('findByCode', () => {
    it('delegates to findByCode', async () => {
      const sn = { id: 1 } as SocialNetwork;
      socialNetworksServiceMock.findByCode.mockResolvedValue(sn);
      await expect(
        resolver.findByCode(SocialMediasEnum.INSTAGRAM),
      ).resolves.toEqual(sn);
    });
  });

  describe('findAll', () => {
    it('maps all items', async () => {
      const list = [{ id: 1 }, { id: 2 }] as SocialNetwork[];
      socialNetworksServiceMock.findAll.mockResolvedValue(list);
      await expect(resolver.findAll()).resolves.toEqual(list);
    });
  });

  describe('updateSocialNetwork', () => {
    it('delegates to service.update', async () => {
      const updated = { id: 2, name: 'Y' } as SocialNetwork;
      socialNetworksServiceMock.update.mockResolvedValue(updated);
      const data = { id: 2, name: 'Y' };
      const result = await resolver.updateSocialNetwork(data as never, user);
      expect(socialNetworksServiceMock.update).toHaveBeenCalledWith(data, user);
      expect(result).toEqual(updated);
    });
  });

  describe('removeSocialNetwork', () => {
    it('delegates to remove and returns true', async () => {
      socialNetworksServiceMock.remove.mockResolvedValue(undefined);
      await expect(resolver.removeSocialNetwork(9, user)).resolves.toBe(true);
      expect(socialNetworksServiceMock.remove).toHaveBeenCalledWith(9, user);
    });
  });
});
