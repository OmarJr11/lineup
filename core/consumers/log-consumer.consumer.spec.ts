import { LogConsumer } from './log-consumer.consumer';
import { EventEmitter } from 'events';

describe('LogConsumer', () => {
  it('registers all queue event listeners and handles emitted events', () => {
    const consumer = new LogConsumer();
    const fakeQueueEvents = new EventEmitter();

    consumer.listenToQueue(fakeQueueEvents as any);

    expect(() => {
      fakeQueueEvents.emit('added', { jobId: '1', name: 'testJob' });
      fakeQueueEvents.emit('completed', { jobId: '1' });
      fakeQueueEvents.emit('failed', { jobId: '1', failedReason: 'Timeout' });
      fakeQueueEvents.emit('error', new Error('Queue error'));
      fakeQueueEvents.emit('waiting', { jobId: '2' });
      fakeQueueEvents.emit('active', { jobId: '2' });
      fakeQueueEvents.emit('stalled', { jobId: '2' });
      fakeQueueEvents.emit('progress', { jobId: '2' }, '50%');
      fakeQueueEvents.emit('paused');
      fakeQueueEvents.emit('resumed');
      fakeQueueEvents.emit('cleaned', { count: '5' }, 'completed');
      fakeQueueEvents.emit('drained');
      fakeQueueEvents.emit('removed', { jobId: '3', prev: 'waiting' });
    }).not.toThrow();
  });
});
