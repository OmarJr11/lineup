import { BusinessesResolver } from './businesses.resolver';
import { BusinessesService } from '../../../../core/modules/businesses/businesses.service';
import { BusinessFollowersService } from '../../../../core/modules/business-followers/business-followers.service';
import { BusinessFollowersGettersService } from '../../../../core/modules/business-followers/business-followers-getters.service';
import { StatusEnum } from '../../../../core/common/enums';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link BusinessesResolver} (users app).
 */
describe('BusinessesResolver (users)', () => {
  let resolver: BusinessesResolver;
  const businessesServiceMock = {
    findOne: jest.fn(),
    findOneByPath: jest.fn(),
    findAll: jest.fn(),
  };
  const businessFollowersServiceMock = {
    followBusiness: jest.fn(),
    unfollowBusiness: jest.fn(),
  };
  const businessFollowersGettersServiceMock = {
    findOneByBusinessAndUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new BusinessesResolver(
      businessesServiceMock as unknown as BusinessesService,
      businessFollowersServiceMock as unknown as BusinessFollowersService,
      businessFollowersGettersServiceMock as unknown as BusinessFollowersGettersService,
    );
  });

  it('followBusiness maps follower', async () => {
    const user = { userId: 1 } as IUserReq;
    const follower = { id: 9 };
    businessFollowersServiceMock.followBusiness.mockResolvedValue(follower);
    const out = await resolver.followBusiness(5, user);
    expect(businessFollowersServiceMock.followBusiness).toHaveBeenCalledWith(
      5,
      user,
    );
    expect(out).toBe(follower);
  });

  it('findAll returns paginated businesses', async () => {
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    const row = { id: 1 };
    businessesServiceMock.findAll.mockResolvedValue([row]);
    const out = await resolver.findAll(pagination);
    expect(out.items).toEqual([row]);
    expect(out.total).toBe(1);
  });

  it('isFollowingBusiness is false when no follower', async () => {
    const user = { userId: 2 } as IUserReq;
    businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
      null,
    );
    await expect(
      resolver.isFollowingBusiness(3, user),
    ).resolves.toBe(false);
  });

  it('isFollowingBusiness is false when follower is deleted', async () => {
    const user = { userId: 2 } as IUserReq;
    businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
      { status: StatusEnum.DELETED },
    );
    await expect(
      resolver.isFollowingBusiness(3, user),
    ).resolves.toBe(false);
  });

  it('isFollowingBusiness is true when active follower exists', async () => {
    const user = { userId: 2 } as IUserReq;
    businessFollowersGettersServiceMock.findOneByBusinessAndUser.mockResolvedValue(
      { status: StatusEnum.ACTIVE },
    );
    await expect(
      resolver.isFollowingBusiness(3, user),
    ).resolves.toBe(true);
  });
});
