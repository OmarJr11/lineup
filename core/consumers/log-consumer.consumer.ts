import { Logger } from '@nestjs/common';
import { QueueEvents } from 'bullmq';

export class LogConsumer {
  private logger = new Logger('Queue');
  listenToQueue(queueEvents: QueueEvents) {
    queueEvents.on('added', (job) => {
      this.onAdded(job);
    });
    queueEvents.on('completed', (job) => {
      this.onCompleted(job);
    });
    queueEvents.on('failed', (job) => {
      this.onFailed(job);
    });
    queueEvents.on('error', (error) => {
      this.onError(error);
    });
    queueEvents.on('waiting', (job) => {
      this.onWaiting(job);
    });
    queueEvents.on('active', (job) => {
      this.onActive(job);
    });
    queueEvents.on('stalled', (job) => {
      this.onStalled(job);
    });
    queueEvents.on('progress', (job, progress) => {
      this.onProgress(job, progress);
    });
    queueEvents.on('paused', () => {
      this.onPaused();
    });
    queueEvents.on('resumed', () => {
      this.onResumed();
    });
    queueEvents.on('cleaned', (jobs, type) => {
      this.onCleaned(jobs, type);
    });
    queueEvents.on('drained', () => {
      this.onDrained();
    });
    queueEvents.on('removed', (job) => {
      this.onRemoved(job);
    });
  }

  private onAdded(job: { jobId: string; name: string }) {
    this.logger.log(
      `Job ${job.name} #${job.jobId} has been added to the queue`,
    );
  }

  private onCompleted(job: { jobId: string }) {
    this.logger.log(`Job #${job.jobId} has been completed`);
  }

  private onFailed(job: { jobId: string; failedReason: string }) {
    this.logger.error(
      `The job failed with reason: ${job.failedReason}. Job: ${JSON.stringify(job)}`,
    );
  }

  private onError(error: Error) {
    this.logger.error(`Error in job: ${JSON.stringify(error)}`);
  }

  private onWaiting(job: { jobId: string }) {
    this.logger.log(`
            The Job [${job.jobId}] is waiting to be processed as soon as a worker is idling.
        `);
  }

  private onActive(job: { jobId: string }) {
    this.logger.log(`Processing job: ${JSON.stringify(job.jobId)}`);
  }

  private onStalled(job: { jobId: string }) {
    this.logger.warn(`Job has been marked as stalled: ${job.jobId}`);
  }

  private onProgress(job: { jobId: string }, progress: string) {
    this.logger.log(
      `Job ${job.jobId} progress was updated to value ${progress}`,
    );
  }

  private onPaused() {
    this.logger.warn('The queue has been paused');
  }

  private onResumed() {
    this.logger.warn('The queue has been resumed');
  }

  private onCleaned(jobs: { count: string }, type: string) {
    this.logger.warn(
      `Old jobs type: ${type}, have bend cleaned from the queue. ${jobs.count}`,
    );
  }

  private onDrained() {
    this.logger.log('The queue has processed all the waiting jobs');
  }

  private onRemoved(job: { jobId: string; prev: string }) {
    this.logger.warn(
      `The job was successfully removed: ${JSON.stringify(job)}`,
    );
  }
}
