import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DiscountsConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { AuditOperationEnum } from '../common/enums';
import { IBusinessReq } from '../common/interfaces';
import { LogWarn } from '../common/helpers';
import { DiscountProductAuditsSettersService } from '../modules/discount-product-audits/discount-product-audits-setters.service';

/** Payload for RecordAudit job. */
interface RecordAuditJobData {
    idProduct: number;
    idDiscountOld?: number;
    idDiscountNew?: number;
    operation: AuditOperationEnum;
    businessReq: IBusinessReq;
}

/**
 * Consumer for discount-related background jobs.
 * Records discount-product audit entries asynchronously.
 */
@Processor(QueueNamesEnum.discounts)
export class DiscountsConsumer extends WorkerHost {
    private readonly log = new Logger(DiscountsConsumer.name);

    constructor(
        private readonly discountProductAuditsSettersService: DiscountProductAuditsSettersService,
    ) {
        super();
    }

    /**
     * Process incoming jobs.
     * @param {Job} job - The job to process.
     */
    async process(job: Job): Promise<void> {
        switch (job.name) {
            case DiscountsConsumerEnum.RecordAudit:
                await this.processRecordAudit(job);
                break;
            default:
                LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
        }
    }

    /**
     * Records a discount-product audit entry.
     * @param {Job<RecordAuditJobData>} job - BullMQ job with audit data.
     */
    private async processRecordAudit(job: Job<RecordAuditJobData>): Promise<void> {
        const { idProduct, idDiscountOld, idDiscountNew, operation, businessReq } = job.data;
        if (!idProduct || !businessReq?.businessId) {
            LogWarn(this.log, `Missing required data in job ${job.id}`, this.processRecordAudit.name);
            return;
        }
        await this.discountProductAuditsSettersService.record(
            idProduct,
            idDiscountOld,
            idDiscountNew,
            operation,
            businessReq,
        );
    }
}
