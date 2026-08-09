import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from '../../../../core/modules/notifications/notifications.service';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link NotificationsResolver} (users app).
 */
describe('NotificationsResolver (users)', () => {
  let resolver: NotificationsResolver;
  const notificationsServiceMock = {
    findPaginatedForUser: jest.fn(),
    countUnreadForUser: jest.fn(),
    markAsReadForUser: jest.fn(),
    markAllAsReadForUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new NotificationsResolver(
      notificationsServiceMock as unknown as NotificationsService,
    );
  });

  it('myNotifications maps rows', async () => {
    const user = { userId: 3 } as IUserReq;
    const pagination = { page: 1, limit: 20 } as InfinityScrollInput;
    const row = { id: 8 };
    notificationsServiceMock.findPaginatedForUser.mockResolvedValue([row]);
    const out = await resolver.myNotifications(user, pagination);
    expect(notificationsServiceMock.findPaginatedForUser).toHaveBeenCalledWith(
      3,
      pagination,
    );
    expect(out.items).toEqual([row]);
    expect(out.total).toBe(1);
  });

  it('markAllNotificationsRead returns true', async () => {
    const user = { userId: 1 } as IUserReq;
    await expect(
      resolver.markAllNotificationsRead(user),
    ).resolves.toBe(true);
    expect(
      notificationsServiceMock.markAllAsReadForUser,
    ).toHaveBeenCalledWith(user);
  });
});
