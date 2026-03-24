import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueNamesEnum } from '../common/enums';

export class QueuesManager {
  private _queues: Record<string, Queue> = {};
  private logger = new Logger(QueuesManager.name);

  static get queueNames(): Record<string, string> {
    return {
      cache: QueueNamesEnum.cache,
      catalogs: QueueNamesEnum.catalogs,
      searchData: QueueNamesEnum.searchData,
      mails: QueueNamesEnum.mails,
      reviews: QueueNamesEnum.reviews,
      discounts: QueueNamesEnum.discounts,
      entityAudits: QueueNamesEnum.entityAudits,
      files: QueueNamesEnum.files,
      products: QueueNamesEnum.products,
      currency: QueueNamesEnum.currency,
    };
  }

  get queues(): Record<string, Queue> {
    return this._queues;
  }

  constructor(
    @InjectQueue(QueuesManager.queueNames.cache)
    private readonly cacheQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.catalogs)
    private readonly catalogsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.searchData)
    private readonly searchDataQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.mails)
    private readonly mailsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.reviews)
    private readonly reviewsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.discounts)
    private readonly discountsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.entityAudits)
    private readonly entityAuditsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.files)
    private readonly filesQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.products)
    private readonly productsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.currency)
    private readonly currencyQueue: Queue,
  ) {
    this.queues[QueuesManager.queueNames.cache] = cacheQueue;
    this.queues[QueuesManager.queueNames.catalogs] = catalogsQueue;
    this.queues[QueuesManager.queueNames.searchData] = searchDataQueue;
    this.queues[QueuesManager.queueNames.mails] = mailsQueue;
    this.queues[QueuesManager.queueNames.reviews] = reviewsQueue;
    this.queues[QueuesManager.queueNames.discounts] = discountsQueue;
    this.queues[QueuesManager.queueNames.entityAudits] = entityAuditsQueue;
    this.queues[QueuesManager.queueNames.files] = filesQueue;
    this.queues[QueuesManager.queueNames.products] = productsQueue;
    this.queues[QueuesManager.queueNames.currency] = currencyQueue;

    if (
      Object.keys(this.queues).length !==
      Object.keys(QueuesManager.queueNames).length
    ) {
      throw new Error(`Queues length mismatch! All queues should be loaded`);
    }

    void this.resumeQueues();
    this.logger.log('Setting up graceful stop for queues');
    this.setupGracefulStop();
  }

  setupGracefulStop(): void {
    process.on('SIGTERM', this.handleShutdownSignal);
    process.on('SIGINT', this.handleShutdownSignal);
  }

  private sigReceived = false;
  private sigReceiving = false;
  async gracefulStop(sig: string) {
    if (this.sigReceiving) {
      return;
    }
    this.sigReceiving = true;

    if (this.sigReceived) {
      this.logger.warn(`Received second signal ${sig}. Exiting`);
      process.exit(1);
    }

    // Process receives 2 signals in a row because of it's parent/child hierarchy
    // We should react to only one
    setTimeout(() => {
      this.sigReceiving = false;
    }, 1000);

    this.sigReceived = true;
    this.logger.warn(`Received ${sig}. Pausing queues`);
    await Promise.all(Object.values(this.queues).map((q) => q.pause()));
    process.exit(0);
  }

  async resumeQueues() {
    this.logger.log('Resuming queues if they are paused');
    await Promise.all(
      Object.values(this.queues).map(async (q) => {
        if (await q.isPaused()) {
          this.logger.log(`Resuming queue: ${q.name}`);
          await q.resume();
        }
      }),
    );
  }

  static queuesForImport() {
    return Object.keys(QueuesManager.queueNames).map((qk) =>
      BullModule.registerQueue({
        name: QueuesManager.queueNames[qk],
        defaultJobOptions: { removeOnComplete: true },
      }),
    );
  }

  private readonly handleShutdownSignal = (signal: NodeJS.Signals): void => {
    void this.gracefulStop(signal);
  };
}
