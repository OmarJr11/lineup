import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EntityAuditsConsumerEnum,
  QueueNamesEnum,
} from '../common/enums/consumers';
import { IUserOrBusinessReq } from '../common/interfaces';
import { LogWarn } from '../common/helpers';
import { EntityAuditsSettersService } from '../modules/entity-audits/entity-audits-setters.service';
import { RecordEntityAuditDto } from '../modules/entity-audits/dto';

/** Payload for RecordAudit job. */
export interface RecordEntityAuditJobData
  extends Omit<RecordEntityAuditDto, 'userOrBusinessReq'> {
  userOrBusinessReq: IUserOrBusinessReq;
}

/**
 * Consumer for entity audit jobs.
 * Records audit entries for Product, ProductSku, Discount, Business, Catalog, Location,
 * ProductVariation, ProductFile, Role, Permission, User, SocialNetworkBusiness, DiscountProduct.
 */
@Processor(QueueNamesEnum.entityAudits)
export class EntityAuditsConsumer extends WorkerHost {
  private readonly log = new Logger(EntityAuditsConsumer.name);

  constructor(
    private readonly entityAuditsSettersService: EntityAuditsSettersService,
  ) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case EntityAuditsConsumerEnum.RecordAudit:
        await this.processRecordAudit(job);
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Records an entity audit entry.
   * @param {Job<RecordEntityAuditJobData>} job - BullMQ job with audit data.
   */
  private async processRecordAudit(
    job: Job<RecordEntityAuditJobData>,
  ): Promise<void> {
    const {
      entityName,
      entityId,
      operation,
      oldValues,
      newValues,
      userOrBusinessReq,
    } = job.data;
    if (!entityName || !entityId || !userOrBusinessReq) {
      LogWarn(
        this.log,
        `Missing required data in job ${job.id}`,
        this.processRecordAudit.name,
      );
      return;
    }
    const hasCreator =
      userOrBusinessReq.businessId != null || userOrBusinessReq.userId != null;
    if (!hasCreator) {
      LogWarn(
        this.log,
        `Missing businessId or userId in job ${job.id}`,
        this.processRecordAudit.name,
      );
      return;
    }
    const input: RecordEntityAuditDto = {
      entityName,
      entityId,
      operation,
      oldValues: oldValues ?? null,
      newValues: newValues ?? null,
    };
    await this.entityAuditsSettersService.record(input, userOrBusinessReq);
  }
}
