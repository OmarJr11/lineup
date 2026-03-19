import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { EntityAudit } from '../../entities';
import { EntityAuditsGettersService } from './entity-audits-getters.service';
import { EntityAuditsSettersService } from './entity-audits-setters.service';
import { RecordEntityAuditDto } from './dto';
import { AuditOperationEnum } from '../../common/enums';
import { IBusinessReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * Orchestrating service for entity audit operations.
 */
@Injectable({ scope: Scope.REQUEST })
export class EntityAuditsService extends BasicService<EntityAudit> {
    private readonly logger = new Logger(EntityAuditsService.name);

    constructor(
        @Inject(REQUEST)
        private readonly request: Request,
        @InjectRepository(EntityAudit)
        private readonly entityAuditRepository: Repository<EntityAudit>,
        private readonly entityAuditsGettersService: EntityAuditsGettersService,
        private readonly entityAuditsSettersService: EntityAuditsSettersService,
    ) {
        super(entityAuditRepository, request);
    }

    /**
     * Find audit history for an entity.
     * @param {string} entityName - The entity name.
     * @param {number} entityId - The entity ID.
     * @param {number} [limit=50] - Max records.
     */
    async findByEntity(
        entityName: string,
        entityId: number,
        limit: number = 50,
    ): Promise<EntityAudit[]> {
        return await this.entityAuditsGettersService
            .findByEntity(entityName, entityId, limit);
    }

    /**
     * Find audit history for DiscountProduct by product ID.
     */
    async findByDiscountProductByProductId(
        idProduct: number,
        limit: number = 50,
    ): Promise<EntityAudit[]> {
        return await this.entityAuditsGettersService
            .findByDiscountProductByProductId(idProduct, limit);
    }

    /**
     * Find audit history for DiscountProduct by discount ID.
     */
    async findByDiscountProductByDiscountId(
        idDiscount: number,
        limit: number = 50,
    ): Promise<EntityAudit[]> {
        return await this.entityAuditsGettersService
            .findByDiscountProductByDiscountId(idDiscount,limit);
    }

    /**
     * Record a generic audit entry.
     */
    async record(input: RecordEntityAuditDto, businessReq: IBusinessReq): Promise<EntityAudit> {
        return await this.entityAuditsSettersService.record(input, businessReq);
    }

    /**
     * Record a DiscountProduct audit (backward-compatible).
     */
    async recordDiscountProduct(
        idProduct: number,
        idDiscountOld: number | undefined,
        idDiscountNew: number | undefined,
        operation: AuditOperationEnum,
        businessReq: IBusinessReq,
    ): Promise<EntityAudit> {
        const input: RecordEntityAuditDto = {
            entityName: 'DiscountProduct',
            entityId: idProduct,
            operation,
            oldValues: { idProduct, idDiscount: idDiscountOld },
            newValues: { idProduct, idDiscount: idDiscountNew },
        };
        return await this.entityAuditsSettersService.record(input, businessReq);
    }
}
