import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { DiscountsConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { AuditOperationEnum, DiscountScopeEnum, DiscountTypeEnum, StatusEnum } from '../common/enums';
import { IBusinessReq, IUserReq } from '../common/interfaces';
import { LogWarn } from '../common/helpers';
import { EntityAuditsSettersService } from '../modules/entity-audits/entity-audits-setters.service';
import { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';
import { DiscountsSettersService } from '../modules/discounts/discounts-setters.service';
import { RecordEntityAuditDto } from '../modules/entity-audits/dto';
import { EntityAuditValues } from '../common/types';

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
    /** Metadata for new discount (INSERT) or current discount (DELETE). For UPDATE, fetches old from DB. */
    scope?: DiscountScopeEnum;
    discountType?: DiscountTypeEnum;
    value?: number;
    idCurrency?: number;
}

/**
 * Consumer for discount-related background jobs.
 * Records discount-product audit entries asynchronously.
 */
@Processor(QueueNamesEnum.discounts)
export class DiscountsConsumer extends WorkerHost {
    private readonly log = new Logger(DiscountsConsumer.name);

    constructor(
        private readonly entityAuditsSettersService: EntityAuditsSettersService,
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
    private async processRemoveExpiredDiscount(job: Job<RemoveExpiredDiscountJobData>)  {
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
        const {
            idProduct,
            idDiscountOld,
            idDiscountNew,
            operation,
            businessReq,
            scope,
            discountType,
            value,
            idCurrency,
        } = job.data;
        if (!idProduct || !businessReq?.businessId) {
            LogWarn(this.log, `Missing required data in job ${job.id}`, this.processRecordAudit.name);
            return;
        }
        const newDiscountValues = this.buildDiscountAuditValues(
            idProduct,
            idDiscountNew,
            scope,
            discountType,
            value,
            idCurrency,
        );
        let oldDiscountValues: EntityAuditValues = null;
        if (operation !== AuditOperationEnum.INSERT) {
            if (operation === AuditOperationEnum.DELETE && scope != null && discountType != null && value != null) {
                oldDiscountValues = this.buildDiscountAuditValues(
                    idProduct,
                    idDiscountOld,
                    scope,
                    discountType,
                    value,
                    idCurrency,
                );
            } else if (idDiscountOld != null) {
                const oldDiscount = await this.discountsGettersService.findOne(idDiscountOld);
                oldDiscountValues = this.buildDiscountAuditValues(
                    idProduct,
                    idDiscountOld,
                    oldDiscount.scope,
                    oldDiscount.discountType,
                    Number(oldDiscount.value),
                    oldDiscount.idCurrency ?? undefined,
                );
            } else {
                oldDiscountValues = {
                    idProduct,
                    idDiscount: idDiscountOld,
                } as EntityAuditValues;
            }
        }
        const input: RecordEntityAuditDto = {
            entityName: 'DiscountProduct',
            entityId: idProduct,
            operation,
            oldValues: oldDiscountValues,
            newValues: operation !== AuditOperationEnum.DELETE ? newDiscountValues : null,
        };
        await this.entityAuditsSettersService.record(input, businessReq);
    }

    /**
     * Builds audit values object with discount metadata.
     * @param idProduct - Product ID.
     * @param idDiscount - Discount ID.
     * @param scope - Discount scope.
     * @param discountType - Discount type.
     * @param value - Discount value.
     * @param idCurrency - Optional currency ID.
     * @returns Audit values object.
     */
    private buildDiscountAuditValues(
        idProduct: number,
        idDiscount: number | undefined,
        scope?: DiscountScopeEnum,
        discountType?: DiscountTypeEnum,
        value?: number,
        idCurrency?: number,
    ): EntityAuditValues {
        const base: EntityAuditValues = { idProduct, idDiscount };
        if (scope != null && discountType != null && value != null) {
            return {
                ...base,
                scope,
                discountType,
                value,
                ...(idCurrency != null && { idCurrency }),
            };
        }
        return base;
    }
}
