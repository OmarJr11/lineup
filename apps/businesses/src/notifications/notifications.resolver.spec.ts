import { NotificationsResolver } from './notifications.resolver';
import { NotificationsService } from '../../../../core/modules/notifications/notifications.service';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link NotificationsResolver}.
 */
describe('NotificationsResolver', () => {
  let resolver: NotificationsResolver;
  const notificationsServiceMock = {
    findPaginatedForBusiness: jest.fn(),
    countUnreadForBusiness: jest.fn(),
    markAsReadForBusiness: jest.fn(),
    markAllAsReadForBusiness: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new NotificationsResolver(
      notificationsServiceMock as unknown as NotificationsService,
    );
  });

  it('myBusinessNotifications maps rows to schema list', async () => {
    const businessReq = { businessId: 2 } as IBusinessReq;
    const pagination = { page: 1, limit: 20 } as InfinityScrollInput;
    const row = { id: 9 };
    notificationsServiceMock.findPaginatedForBusiness.mockResolvedValue([row]);
    const out = await resolver.myBusinessNotifications(
      businessReq,
      pagination,
    );
    expect(
      notificationsServiceMock.findPaginatedForBusiness,
    ).toHaveBeenCalledWith(2, pagination);
    expect(out.items).toEqual([row]);
    expect(out.total).toBe(1);
    expect(out.page).toBe(1);
    expect(out.limit).toBe(20);
  });

  it('unreadBusinessNotificationsCount delegates', async () => {
    const businessReq = { businessId: 4 } as IBusinessReq;
    notificationsServiceMock.countUnreadForBusiness.mockResolvedValue(3);
    await expect(
      resolver.unreadBusinessNotificationsCount(businessReq),
    ).resolves.toBe(3);
  });

  it('markAllBusinessNotificationsRead returns true', async () => {
    const businessReq = { businessId: 1 } as IBusinessReq;
    await expect(
      resolver.markAllBusinessNotificationsRead(businessReq),
    ).resolves.toBe(true);
    expect(
      notificationsServiceMock.markAllAsReadForBusiness,
    ).toHaveBeenCalledWith(businessReq);
  });
});
