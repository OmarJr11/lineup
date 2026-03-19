import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { entityAuditsResponses } from '../../common/responses';
import { EntityAudit } from '../../entities';
import { AuditableEntityNameEnum } from '../../common/enums';

/**
 * Read-only service for querying entity audit records.
 */
@Injectable()
export class EntityAuditsGettersService extends BasicService<EntityAudit> {
    private readonly logger = new Logger(EntityAuditsGettersService.name);
    private readonly rList = entityAuditsResponses.list;

    constructor(
        @InjectRepository(EntityAudit)
        private readonly entityAuditRepository: Repository<EntityAudit>,
    ) {
        super(entityAuditRepository);
    }

    /**
     * Find audit history for an entity by name and ID.
     * @param {string} entityName - The entity name (e.g. 'Product', 'Discount').
     * @param {number} entityId - The entity ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<EntityAudit[]>} Array of audit records.
     */
    async findByEntity(
        entityName: string,
        entityId: number,
        limit: number = 50,
    ): Promise<EntityAudit[]> {
        return await this.find({
            where: { entityName, entityId },
            relations: ['creationBusiness', 'creationUser'],
            order: { creationDate: 'DESC' },
            take: limit,
        });
    }

    /**
     * Find audit history for DiscountProduct by product ID.
     * @param {number} idProduct - The product ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<EntityAudit[]>} Array of audit records.
     */
    async findByDiscountProductByProductId(
        idProduct: number,
        limit: number = 50,
    ): Promise<EntityAudit[]> {
        return await this.findByEntity(AuditableEntityNameEnum.DiscountProduct, idProduct, limit);
    }

    /**
     * Find audit history for DiscountProduct by discount ID.
     * @param {number} idDiscount - The discount ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<EntityAudit[]>} Array of audit records.
     */
    async findByDiscountProductByDiscountId(
        idDiscount: number,
        limit: number = 50,
    ): Promise<EntityAudit[]> {
        return await this.createQueryBuilder('a')
            .where('a.entity_name = :entityName', { entityName: AuditableEntityNameEnum.DiscountProduct })
            .andWhere(
                "(a.old_values->>'idDiscount' = :idDiscount OR a.new_values->>'idDiscount' = :idDiscount)",
                { idDiscount: String(idDiscount) },
            )
            .leftJoinAndSelect('a.creationBusiness', 'creationBusiness')
            .leftJoinAndSelect('a.creationUser', 'creationUser')
            .orderBy('a.creation_date', 'DESC')
            .limit(limit)
            .getMany();
    }
}
