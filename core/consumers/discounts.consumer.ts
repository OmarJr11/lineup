import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { DiscountsConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { AuditOperationEnum, StatusEnum } from '../common/enums';
import { IBusinessReq, IUserReq } from '../common/interfaces';
import { LogWarn } from '../common/helpers';
import { Discount } from '../entities';
import { DiscountProductAuditsSettersService } from '../modules/discount-product-audits/discount-product-audits-setters.service';
import { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';
import { DiscountsSettersService } from '../modules/discounts/discounts-setters.service';

/** Payload for ActivateDiscount job. */
interface ActivateDiscountJobData {
    ids: number[];
}

/** Payload for RemoveExpiredDiscount job. */
interface RemoveExpiredDiscountJobData {
    ids: number[];
}

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
        private readonly discountsGettersService: DiscountsGettersService,
        private readonly discountsSettersService: DiscountsSettersService,
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
            case DiscountsConsumerEnum.ActivateDiscount:
                await this.processActivateDiscount(job);
                break;
            case DiscountsConsumerEnum.RemoveExpiredDiscount:
                await this.processRemoveExpiredDiscount(job);
                break;
            default:
                LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
        }
    }

    /**
     * Activates a PENDING discount by setting status to ACTIVE.
     * @param {Job<ActivateDiscountJobData>} job - BullMQ job with discount ID.
     */
    private async processActivateDiscount(job: Job<ActivateDiscountJobData>): Promise<void> {
        const { ids } = job.data;
        if (!ids || ids.length === 0) {
            LogWarn(this.log, `Missing ids in job ${job.id}`, this.processActivateDiscount.name);
            return;
        }
        const discounts = await this.discountsGettersService.findAllByIds(ids);
        const userReq: IUserReq = { userId: 1, username: 'admin' };
        await this.discountsSettersService.updateMany(StatusEnum.ACTIVE, discounts, userReq);
    }

    /**
     * Removes (soft delete) expired ACTIVE discounts by setting status to DELETED.
     * @param {Job<RemoveExpiredDiscountJobData>} job - BullMQ job with discount IDs.
     */
    private async processRemoveExpiredDiscount(job: Job<RemoveExpiredDiscountJobData>): Promise<void> {
        const { ids } = job.data;
        if (!ids || ids.length === 0) {
            LogWarn(this.log, `Missing ids in job ${job.id}`, this.processRemoveExpiredDiscount.name);
            return;
        }
        const discounts = await this.discountsGettersService.findAllByIds(ids);
        const userReq: IUserReq = { userId: 1, username: 'admin' };
        for (const discount of discounts) await this.discountsSettersService
            .removeDiscount(discount, userReq);
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
