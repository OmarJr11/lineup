import { ProductsCronService } from './products.cron';
import { ProductsConsumerEnum } from '../common/enums/consumers';
import type { ProductsGettersService } from '../modules/products/products-getters.service';

describe('ProductsCronService', () => {
  const gettersMock = {
    resetStockNotifiedForRestockedProducts: jest.fn(),
    findProductIdsWithLowStockPendingNotification: jest.fn(),
  };
  const queueMock = { add: jest.fn() };
  let service: ProductsCronService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsCronService(
      gettersMock as unknown as ProductsGettersService,
      queueMock as never,
    );
  });

  it('resets restocked products and enqueues low-stock ids', async () => {
    gettersMock.findProductIdsWithLowStockPendingNotification.mockResolvedValue(
      [31, 32],
    );

    await service.enqueueLowStockNotifications();

    expect(
      gettersMock.resetStockNotifiedForRestockedProducts,
    ).toHaveBeenCalled();
    expect(queueMock.add).toHaveBeenCalledWith(
      ProductsConsumerEnum.NotifyLowStock,
      { ids: [31, 32] },
    );
  });

  it('does not enqueue when no product needs a notification', async () => {
    gettersMock.findProductIdsWithLowStockPendingNotification.mockResolvedValue(
      [],
    );

    await service.enqueueLowStockNotifications();

    expect(
      gettersMock.resetStockNotifiedForRestockedProducts,
    ).toHaveBeenCalled();
    expect(queueMock.add).not.toHaveBeenCalled();
  });
});
