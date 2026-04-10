import { Job, Queue } from 'bullmq';
import { ProductsConsumer } from './products.consumer';
import { ProductsGettersService } from '../modules/products/products-getters.service';
import { ProductsSettersService } from '../modules/products/products-setters.service';
import { ProductsConsumerEnum } from '../common/enums/consumers';
import { NotificationsConsumerEnum } from '../common/enums/consumers';
import {
  NotificationContentScenarioEnum,
  NotificationTypeEnum,
} from '../common/enums';

/**
 * Unit tests for {@link ProductsConsumer}.
 */
describe('ProductsConsumer', () => {
  let consumer: ProductsConsumer;
  const productsGettersServiceMock = {
    findOneActiveSummaryForLowStockJob: jest.fn(),
    findOne: jest.fn(),
  };
  const productsSettersServiceMock = {
    setStockNotified: jest.fn(),
  };
  const notificationsQueueMock = {
    add: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new ProductsConsumer(
      productsGettersServiceMock as unknown as ProductsGettersService,
      productsSettersServiceMock as unknown as ProductsSettersService,
      notificationsQueueMock as unknown as Queue,
    );
  });

  it('does nothing when ids array is empty', async () => {
    const job = {
      id: '1',
      name: ProductsConsumerEnum.NotifyLowStock,
      data: { ids: [] },
    } as Job;
    await consumer.process(job);
    expect(
      productsGettersServiceMock.findOneActiveSummaryForLowStockJob,
    ).not.toHaveBeenCalled();
  });

  it('enqueues notification and sets stock notified per product', async () => {
    const summary = {
      id: 10,
      idCreationBusiness: 3,
      title: 'Item',
    };
    const fullProduct = { id: 10, title: 'Item' };
    productsGettersServiceMock.findOneActiveSummaryForLowStockJob.mockResolvedValue(
      summary,
    );
    productsGettersServiceMock.findOne.mockResolvedValue(fullProduct);
    const job = {
      id: '2',
      name: ProductsConsumerEnum.NotifyLowStock,
      data: { ids: [10] },
    } as Job;
    await consumer.process(job);
    expect(notificationsQueueMock.add).toHaveBeenCalledWith(
      NotificationsConsumerEnum.CreateForBusiness,
      expect.objectContaining({
        scenario: NotificationContentScenarioEnum.PRODUCT_LOW_STOCK,
        type: NotificationTypeEnum.WARNING,
        data: expect.objectContaining({ id: 10 }),
      }),
    );
    expect(productsSettersServiceMock.setStockNotified).toHaveBeenCalledWith(
      fullProduct,
      true,
      expect.objectContaining({ businessId: 3 }),
    );
  });
});
