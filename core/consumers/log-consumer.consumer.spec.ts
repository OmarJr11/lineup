import { EventEmitter } from 'events';
import { Logger } from '@nestjs/common';
import type { QueueEvents } from 'bullmq';
import { LogConsumer } from './log-consumer.consumer';

/**
 * Unit tests for {@link LogConsumer}.
 */
describe('LogConsumer', () => {
  it('registers listeners and logs on added event', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const consumer = new LogConsumer();
    const ee = new EventEmitter();
    consumer.listenToQueue(ee as unknown as QueueEvents);
    ee.emit('added', { jobId: '99', name: 'test-job' });
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('test-job'),
    );
    logSpy.mockRestore();
  });

  it('logs failed jobs with reason', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const consumer = new LogConsumer();
    const ee = new EventEmitter();
    consumer.listenToQueue(ee as unknown as QueueEvents);
    ee.emit('failed', {
      jobId: '1',
      failedReason: 'boom',
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('boom'),
    );
    errorSpy.mockRestore();
  });
});
