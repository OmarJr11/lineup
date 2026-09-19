import { DiscountsCronService } from './discounts.cron';
import { DiscountsConsumerEnum } from '../common/enums/consumers';
import type { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';

describe('DiscountsCronService', () => {
  const gettersMock = {
    findAllPendingWithStartDateReached: jest.fn(),
    findAllActiveWithEndDatePassed: jest.fn(),
  };
  const queueMock = { add: jest.fn() };
  let service: DiscountsCronService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DiscountsCronService(
      gettersMock as unknown as DiscountsGettersService,
      queueMock as never,
    );
  });

  it('enqueues activation for reached pending discounts', async () => {
    gettersMock.findAllPendingWithStartDateReached.mockResolvedValue([
      { id: 10 },
      { id: 11 },
    ]);

    await service.activatePendingDiscounts();

    expect(queueMock.add).toHaveBeenCalledWith(
      DiscountsConsumerEnum.ActivateDiscount,
      { ids: [10, 11] },
    );
  });

  it('does not enqueue activation when there are no pending discounts', async () => {
    gettersMock.findAllPendingWithStartDateReached.mockResolvedValue([]);

    await service.activatePendingDiscounts();

    expect(queueMock.add).not.toHaveBeenCalled();
  });

  it('enqueues removal for expired discounts', async () => {
    gettersMock.findAllActiveWithEndDatePassed.mockResolvedValue([{ id: 20 }]);

    await service.removeExpiredDiscounts();

    expect(queueMock.add).toHaveBeenCalledWith(
      DiscountsConsumerEnum.RemoveExpiredDiscount,
      { ids: [20] },
    );
  });

  it('does not enqueue removal when there are no expired discounts', async () => {
    gettersMock.findAllActiveWithEndDatePassed.mockResolvedValue([]);

    await service.removeExpiredDiscounts();

    expect(queueMock.add).not.toHaveBeenCalled();
  });
});
