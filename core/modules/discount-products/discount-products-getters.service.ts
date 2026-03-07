import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { discountProductsResponses } from '../../common/responses';
import { StatusEnum } from '../../common/enums';
import { DiscountProduct } from '../../entities';

/**
 * Read-only service for querying discount-product assignments.
 */
@Injectable()
export class DiscountProductsGettersService extends BasicService<DiscountProduct> {
    private readonly logger = new Logger(DiscountProductsGettersService.name);
    private readonly rList = discountProductsResponses.list;
    private readonly relations = ['product', 'discount', 'creationBusiness'];

    constructor(
        @InjectRepository(DiscountProduct)
        private readonly discountProductRepository: Repository<DiscountProduct>,
    ) {
        super(discountProductRepository);
    }

    /**
     * Find DiscountProduct by product ID.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<DiscountProduct | null>} The discount product or null.
     */
    async findByProductId(idProduct: number): Promise<DiscountProduct | null> {
        return await this.findOneWithOptions({
            where: { idProduct },
            relations: this.relations,
        });
    }

    /**
     * Find DiscountProduct by product ID with discount relation.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<DiscountProduct>} The discount product or null.
     */
    async findByProductIdWithDiscount(idProduct: number): Promise<DiscountProduct> {
        try {
            return await this.createQueryBuilder('dp')
                .leftJoinAndSelect('dp.discount', 'discount')
                .leftJoinAndSelect('discount.currency', 'currency')
                .where('dp.idProduct = :idProduct', { idProduct })
                .andWhere('discount.status = :status', { status: StatusEnum.ACTIVE })
                .getOneOrFail();
        } catch (error) {
            LogError(this.logger, error, this.findByProductIdWithDiscount.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find all DiscountProduct records for a discount.
     * @param {number} idDiscount - The discount ID.
     * @returns {Promise<DiscountProduct[]>} Array of discount products.
     */
    async findAllByDiscountId(idDiscount: number): Promise<DiscountProduct[]> {
        return await this.find({
            where: { idDiscount },
            relations: this.relations,
        });
    }
}
