import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  EntityAuditsConsumerEnum,
  QueueNamesEnum,
} from '../../common/enums/consumers';
import { RecordEntityAuditJobData } from '../../consumers/entity-audits.consumer';

/**
 * Service to add entity audit jobs to the queue.
 * Use this in setters to record audits asynchronously.
 */
@Injectable()
export class EntityAuditsQueueService {
  constructor(
    @InjectQueue(QueueNamesEnum.entityAudits)
    private readonly entityAuditsQueue: Queue,
  ) {}

  /**
   * Add a record audit job to the queue.
   * @param {RecordEntityAuditJobData} payload - The audit data.
   */
  async addRecordJob(payload: RecordEntityAuditJobData): Promise<void> {
    await this.entityAuditsQueue.add(
      EntityAuditsConsumerEnum.RecordAudit,
      payload,
    );
  }
}
