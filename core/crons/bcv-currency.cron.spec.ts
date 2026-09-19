import { BcvCurrencyCronService } from './bcv-currency.cron';
import {
  CurrencyConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';

describe('BcvCurrencyCronService', () => {
  const currencyQueueMock = { add: jest.fn() };
  let service: BcvCurrencyCronService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BcvCurrencyCronService(currencyQueueMock as never);
  });

  it('enqueues the BCV sync job', async () => {
    await service.enqueueSaveBcvOfficialRates();

    expect(currencyQueueMock.add).toHaveBeenCalledWith(
      CurrencyConsumerEnum.SaveDataCurrencyBCV,
      {},
    );
  });

  it('runs the sync job during module initialization', async () => {
    await service.onModuleInit();

    expect(currencyQueueMock.add).toHaveBeenCalledTimes(1);
    expect(currencyQueueMock.add).toHaveBeenCalledWith(
      CurrencyConsumerEnum.SaveDataCurrencyBCV,
      {},
    );
  });

  it('uses the currency queue contract', () => {
    expect(QueueNamesEnum.currency).toBe('currency-queue');
  });
});
