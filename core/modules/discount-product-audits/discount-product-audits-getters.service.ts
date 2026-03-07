import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { discountProductAuditsResponses } from '../../common/responses';
import { DiscountProductAudit } from '../../entities';

/**
 * Read-only service for querying discount-product audit records.
 */
@Injectable()
export class DiscountProductAuditsGettersService extends BasicService<DiscountProductAudit> {
    private readonly logger = new Logger(DiscountProductAuditsGettersService.name);
    private readonly rList = discountProductAuditsResponses.list;

    constructor(
        @InjectRepository(DiscountProductAudit)
        private readonly discountProductAuditRepository: Repository<DiscountProductAudit>,
    ) {
        super(discountProductAuditRepository);
    }

    /**
     * Find audit history for a product.
     * @param {number} idProduct - The product ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<DiscountProductAudit[]>} Array of audit records.
     */
    async findByProductId(
        idProduct: number,
        limit: number = 50
    ): Promise<DiscountProductAudit[]> {
        return await this.find({
            where: { idProduct },
            relations: ['product', 'creationBusiness'],
            order: { creationDate: 'DESC' },
            limit,
        });
    }

    /**
     * Find audit history for a discount.
     * @param {number} idDiscount - The discount ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<DiscountProductAudit[]>} Array of audit records.
     */
    async findByDiscountId(
        idDiscount: number,
        limit: number = 50
    ): Promise<DiscountProductAudit[]> {
        return await this.createQueryBuilder('a')
            .where('a.idDiscountOld = :idDiscount OR a.idDiscountNew = :idDiscount', {
                idDiscount,
            })
            .leftJoinAndSelect('a.product', 'product')
            .leftJoinAndSelect('a.creationBusiness', 'creationBusiness')
            .orderBy('a.creation_date', 'DESC')
            .limit(limit)
            .getMany();
    }
}
