import { Job } from 'bullmq';
import { CurrencyConsumer } from './currency.consumer';
import { CurrencyConsumerEnum } from '../common/enums/consumers';
import { ScrappingCacheService } from '../modules/scrapping/scrapping.service';

/**
 * Unit tests for {@link CurrencyConsumer}.
 */
describe('CurrencyConsumer', () => {
  let consumer: CurrencyConsumer;
  const scrappingCacheServiceMock = {
    syncBcvOfficialRatesToCache: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new CurrencyConsumer(
      scrappingCacheServiceMock as unknown as ScrappingCacheService,
    );
  });

  it('runs BCV sync for SaveDataCurrencyBCV job', async () => {
    const job = {
      name: CurrencyConsumerEnum.SaveDataCurrencyBCV,
    } as Job;
    await consumer.process(job);
    expect(scrappingCacheServiceMock.syncBcvOfficialRatesToCache).toHaveBeenCalled();
  });

  it('ignores unknown job names without throwing', async () => {
    const job = { name: 'unknown' } as Job;
    await expect(consumer.process(job)).resolves.toBeUndefined();
    expect(
      scrappingCacheServiceMock.syncBcvOfficialRatesToCache,
    ).not.toHaveBeenCalled();
  });
});
