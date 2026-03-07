import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { DiscountProductAudit } from '../../entities';
import { DiscountProductAuditsGettersService } from './discount-product-audits-getters.service';
import { DiscountProductAuditsSettersService } from './discount-product-audits-setters.service';
import { AuditOperationEnum } from '../../common/enums';
import { IBusinessReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * Orchestrating service for discount-product audit operations.
 */
@Injectable({ scope: Scope.REQUEST })
export class DiscountProductAuditsService extends BasicService<DiscountProductAudit> {
    private readonly logger = new Logger(DiscountProductAuditsService.name);

    constructor(
        @Inject(REQUEST)
        private readonly request: Request,
        @InjectRepository(DiscountProductAudit)
        private readonly discountProductAuditRepository: Repository<DiscountProductAudit>,
        private readonly discountProductAuditsGettersService: DiscountProductAuditsGettersService,
        private readonly discountProductAuditsSettersService: DiscountProductAuditsSettersService,
    ) {
        super(discountProductAuditRepository, request);
    }

    /**
     * Find audit history for a product.
     */
    async findByProductId(idProduct: number, limit = 50): Promise<DiscountProductAudit[]> {
        return await this.discountProductAuditsGettersService.findByProductId(idProduct, limit);
    }

    /**
     * Find audit history for a discount.
     */
    async findByDiscountId(idDiscount: number, limit = 50): Promise<DiscountProductAudit[]> {
        return await this.discountProductAuditsGettersService.findByDiscountId(idDiscount, limit);
    }

    /**
     * Record an audit entry.
     */
    async record(
        idProduct: number,
        idDiscountOld: number | undefined,
        idDiscountNew: number | undefined,
        operation: AuditOperationEnum,
        businessReq: IBusinessReq,
    ): Promise<DiscountProductAudit> {
        return await this.discountProductAuditsSettersService.record(
            idProduct,
            idDiscountOld,
            idDiscountNew,
            operation,
            businessReq,
        );
    }
}
