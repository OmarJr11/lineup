import { QueueLogsConsumer } from './queue-logs.consumer';
import { QueueNamesEnum } from '../common/enums';

// Mock QueueEvents to avoid real Redis connections
jest.mock('bullmq', () => ({
  QueueEvents: jest.fn().mockImplementation((name) => ({
    name,
    on: jest.fn(),
  })),
}));

// Mock LogConsumer
jest.mock('./log-consumer.consumer', () => ({
  LogConsumer: jest.fn().mockImplementation(() => ({
    listenToQueue: jest.fn(),
  })),
}));

/**
 * Unit tests for {@link QueueLogsConsumer}.
 */
describe('QueueLogsConsumer', () => {
  it('creates QueueEvents for each queue name', () => {
    const { QueueEvents } = require('bullmq');

    new QueueLogsConsumer();

    const queueNames = Object.values(QueueNamesEnum);
    expect(QueueEvents).toHaveBeenCalledTimes(queueNames.length);
    queueNames.forEach((name) => {
      expect(QueueEvents).toHaveBeenCalledWith(
        name,
        expect.objectContaining({
          connection: expect.objectContaining({
            host: expect.any(String),
            port: expect.any(Number),
          }),
        }),
      );
    });
  });

  it('calls listenToQueue on LogConsumer for each queue', () => {
    const { LogConsumer } = require('./log-consumer.consumer');

    new QueueLogsConsumer();

    const queueNames = Object.values(QueueNamesEnum);
    const instance = LogConsumer.mock.results[LogConsumer.mock.results.length - 1].value;
    expect(instance.listenToQueue).toHaveBeenCalledTimes(queueNames.length);
  });
});
