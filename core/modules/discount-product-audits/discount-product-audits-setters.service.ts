import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { discountProductAuditsResponses } from '../../common/responses';
import { AuditOperationEnum } from '../../common/enums';
import { DiscountProductAudit } from '../../entities';

/**
 * Write service responsible for persisting discount-product audit records.
 */
@Injectable()
export class DiscountProductAuditsSettersService extends BasicService<DiscountProductAudit> {
    private readonly logger = new Logger(DiscountProductAuditsSettersService.name);
    private readonly rCreate = discountProductAuditsResponses.create;

    constructor(
        @InjectRepository(DiscountProductAudit)
        private readonly discountProductAuditRepository: Repository<DiscountProductAudit>,
    ) {
        super(discountProductAuditRepository);
    }

    /**
     * Record an audit entry for a discount-product change.
     * @param {number} idProduct - The product ID.
     * @param {number | undefined} idDiscountOld - Previous discount ID (null for INSERT).
     * @param {number | undefined} idDiscountNew - New discount ID (null for DELETE).
     * @param {AuditOperationEnum} operation - The operation type.
     * @param {IBusinessReq} businessReq - The business request.
     */
    @Transactional()
    async record(
        idProduct: number,
        idDiscountOld: number | undefined,
        idDiscountNew: number | undefined,
        operation: AuditOperationEnum,
        businessReq: IBusinessReq,
    ): Promise<DiscountProductAudit> {
        try {
            const data = {
                idProduct,
                idDiscountOld: idDiscountOld ?? null,
                idDiscountNew: idDiscountNew ?? null,
                operation,
            };
            return await this.save(data, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.record.name, businessReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }
}
