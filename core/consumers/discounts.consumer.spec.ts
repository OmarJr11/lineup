import { Job, Queue } from 'bullmq';
import { DiscountsConsumer } from './discounts.consumer';
import { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';
import { DiscountsSettersService } from '../modules/discounts/discounts-setters.service';
import { DiscountsConsumerEnum } from '../common/enums/consumers';
import { NotificationsConsumerEnum } from '../common/enums/consumers';
import { NotificationContentScenarioEnum, StatusEnum } from '../common/enums';
import type { Discount } from '../entities';

/**
 * Unit tests for {@link DiscountsConsumer}.
 */
describe('DiscountsConsumer', () => {
  let consumer: DiscountsConsumer;
  const discountsGettersServiceMock = {
    findAllByIds: jest.fn(),
  };
  const discountsSettersServiceMock = {
    updateMany: jest.fn(),
    markAsExpired: jest.fn(),
    removeDiscount: jest.fn(),
  };
  const notificationsQueueMock = {
    add: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new DiscountsConsumer(
      discountsGettersServiceMock as unknown as DiscountsGettersService,
      discountsSettersServiceMock as unknown as DiscountsSettersService,
      notificationsQueueMock as unknown as Queue,
    );
  });

  it('activate skips when ids empty', async () => {
    const job = {
      name: DiscountsConsumerEnum.ActivateDiscount,
      data: { ids: [] },
    } as Job;
    await consumer.process(job);
    expect(discountsGettersServiceMock.findAllByIds).not.toHaveBeenCalled();
  });

  it('activate updates discounts and enqueues notifications', async () => {
    const discounts = [
      { id: 1, idCreationBusiness: 10 },
      { id: 2, idCreationBusiness: 10 },
    ] as Discount[];
    discountsGettersServiceMock.findAllByIds.mockResolvedValue(discounts);
    const job = {
      name: DiscountsConsumerEnum.ActivateDiscount,
      data: { ids: [1, 2] },
    } as Job;
    await consumer.process(job);
    expect(discountsSettersServiceMock.updateMany).toHaveBeenCalledWith(
      StatusEnum.ACTIVE,
      discounts,
      { userId: 1, username: 'admin' },
    );
    expect(notificationsQueueMock.add).toHaveBeenCalledTimes(2);
    expect(notificationsQueueMock.add).toHaveBeenCalledWith(
      NotificationsConsumerEnum.CreateForBusiness,
      expect.objectContaining({
        scenario: NotificationContentScenarioEnum.DISCOUNT_ACTIVATED,
      }),
    );
  });

  it('removeExpired processes each discount', async () => {
    const discounts = [{ id: 3, idCreationBusiness: 7 }] as Discount[];
    discountsGettersServiceMock.findAllByIds.mockResolvedValue(discounts);
    const job = {
      name: DiscountsConsumerEnum.RemoveExpiredDiscount,
      data: { ids: [3] },
    } as Job;
    await consumer.process(job);
    expect(discountsSettersServiceMock.markAsExpired).toHaveBeenCalled();
    expect(discountsSettersServiceMock.removeDiscount).toHaveBeenCalled();
    expect(notificationsQueueMock.add).toHaveBeenCalledWith(
      NotificationsConsumerEnum.CreateForBusiness,
      expect.objectContaining({
        scenario: NotificationContentScenarioEnum.DISCOUNT_EXPIRED,
      }),
    );
  });
});
