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
    };
  }

  get queues(): Record<string, Queue> {
    return this._queues;
  }

  constructor(
    @InjectQueue(QueuesManager.queueNames.cache) cacheQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.catalogs) catalogsQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.searchData) searchDataQueue: Queue,
    @InjectQueue(QueuesManager.queueNames.mails) mailsQueue: Queue,
  ) {
    this.queues[QueuesManager.queueNames.cache] = cacheQueue;
    this.queues[QueuesManager.queueNames.catalogs] = catalogsQueue;
    this.queues[QueuesManager.queueNames.searchData] = searchDataQueue;
    this.queues[QueuesManager.queueNames.mails] = mailsQueue;

    if (
      Object.keys(this.queues).length !=
      Object.keys(QueuesManager.queueNames).length
    ) {
      throw new Error(`Queues length mismatch! All queues should be loaded`);
    }

    this.resumeQueues();
    this.logger.log('Setting up graceful stop for queues');
    this.setupGracefulStop();
  }

  setupGracefulStop() {
    process.on('SIGTERM', this.gracefulStop.bind(this));
    process.on('SIGINT', this.gracefulStop.bind(this));
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
    setTimeout(
      function () {
        this.sigReceiving = false;
      }.bind(this),
      1000,
    );

    this.sigReceived = true;
    this.logger.warn(`Received ${sig}. Pausing queues`);
    await Promise.all(Object.values(this.queues).map((q) => q.pause()));
    process.exit(0);
  }

  async resumeQueues() {
    this.logger.log('Resuming queues if they are paused');
    await Promise.all(
      Object.values(this.queues).map(async (q) => {
        if (q.isPaused()) {
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
        defaultJobOptions: { removeOnComplete: true }
      }),
    );
  }
}
