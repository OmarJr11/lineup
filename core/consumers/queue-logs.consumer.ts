import { QueueEvents } from 'bullmq';
import { LogConsumer } from './log-consumer.consumer';
import { QueueNamesEnum } from '../common/enums';

export class QueueLogsConsumer {
  private queueEvents: QueueEvents[];
  constructor() {
    const logConsumerInstance = new LogConsumer();
    const queueNames = Object.values(QueueNamesEnum);
    const redisHost = process.env.REDIS_HOST || 'redis';
    const redisPort = process.env.REDIS_PORT
      ? Number(process.env.REDIS_PORT)
      : 6379;
    this.queueEvents = queueNames.map(
      (name) =>
        new QueueEvents(name, {
          connection: { host: redisHost, port: redisPort },
        }),
    );
    this.queueEvents.forEach((queueEvent) => {
      logConsumerInstance.listenToQueue(queueEvent);
    });
  }
}
