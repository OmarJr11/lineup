import { Job } from 'bullmq';
import { NotificationsConsumer } from './notifications.consumer';
import { NotificationsSettersService } from '../modules/notifications/notifications-setters.service';
import { NotificationsConsumerEnum } from '../common/enums/consumers';
import {
  NotificationContentScenarioEnum,
  NotificationTypeEnum,
} from '../common/enums';

/**
 * Unit tests for {@link NotificationsConsumer}.
 */
describe('NotificationsConsumer', () => {
  let consumer: NotificationsConsumer;
  const notificationsSettersServiceMock = {
    createAndDispatch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new NotificationsConsumer(
      notificationsSettersServiceMock as unknown as NotificationsSettersService,
    );
  });

  it('createForUser builds params from notificationsPublic and dispatches', async () => {
    const userOrBusinessReq = { userId: 42 };
    const job = {
      name: NotificationsConsumerEnum.CreateForUser,
      data: {
        entityName: 'users',
        userOrBusinessReq,
        scenario: NotificationContentScenarioEnum.USER_CHANGE_PASSWORD,
        type: NotificationTypeEnum.WARNING,
      },
    } as Job;
    await consumer.process(job);
    expect(
      notificationsSettersServiceMock.createAndDispatch,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationTypeEnum.WARNING,
        idUser: 42,
        payload: expect.objectContaining({
          idUser: 42,
          entity: 'users',
          scenario: NotificationContentScenarioEnum.USER_CHANGE_PASSWORD,
        }),
      }),
      userOrBusinessReq,
    );
  });

  it('createForBusiness uses custom link for DISCOUNT_ACTIVATED', async () => {
    const userOrBusinessReq = { businessId: 7, path: '' };
    const job = {
      name: NotificationsConsumerEnum.CreateForBusiness,
      data: {
        entityName: 'discounts',
        userOrBusinessReq,
        scenario: NotificationContentScenarioEnum.DISCOUNT_ACTIVATED,
        type: NotificationTypeEnum.INFO,
        data: { id: 99 },
      },
    } as Job;
    await consumer.process(job);
    expect(
      notificationsSettersServiceMock.createAndDispatch,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          link: 'businesses/discounts/99',
          id: 99,
        }),
      }),
      userOrBusinessReq,
    );
  });
});
