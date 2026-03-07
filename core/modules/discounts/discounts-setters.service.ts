import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { discountsResponses } from '../../common/responses';
import { AuditOperationEnum } from '../../common/enums';
import { DiscountsConsumerEnum, QueueNamesEnum } from '../../common/enums/consumers';
import { Discount, DiscountProduct } from '../../entities';
import { CreateDiscountInput } from './dto/create-discount.input';
import { UpdateDiscountInput } from './dto/update-discount.input';
import { DiscountProductsGettersService } from '../discount-products/discount-products-getters.service';
import { DiscountProductsSettersService } from '../discount-products/discount-products-setters.service';

/**
 * Write service responsible for persisting discount records.
 */
@Injectable()
export class DiscountsSettersService extends BasicService<Discount> {
    private readonly logger = new Logger(DiscountsSettersService.name);
    private readonly rCreate = discountsResponses.create;
    private readonly rUpdate = discountsResponses.update;
    private readonly rDelete = discountsResponses.delete;

    constructor(
        @InjectRepository(Discount)
        private readonly discountRepository: Repository<Discount>,
        private readonly discountProductsGettersService: DiscountProductsGettersService,
        private readonly discountProductsSettersService: DiscountProductsSettersService,
        @InjectQueue(QueueNamesEnum.discounts)
        private readonly discountsQueue: Queue,
    ) {
        super(discountRepository);
    }

    /**
     * Create a new discount (definition only, no product assignments).
     * @param {CreateDiscountInput} data - The discount data.
     * @param {IBusinessReq} businessReq - The business request.
     * @returns {Promise<Discount>} The created discount.
     */
    @Transactional()
    async createDiscount(
        data: CreateDiscountInput,
        businessReq: IBusinessReq,
    ): Promise<Discount> {
        try {
            return await this.save(data, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.createDiscount.name, businessReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }

    /**
     * Update a discount.
     * @param {Discount} discount - The discount to update.
     * @param {UpdateDiscountInput} data - The update data.
     * @param {IBusinessReq} businessReq - The business request.
     * @returns {Promise<Discount>} The updated discount.
     */
    @Transactional()
    async updateDiscount(
        discount: Discount,
        data: UpdateDiscountInput,
        businessReq: IBusinessReq,
    ): Promise<Discount> {
        try {
            return await this.updateEntity(data, discount, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.updateDiscount.name, businessReq);
            throw new InternalServerErrorException(this.rUpdate.error);
        }
    }

    /**
     * Create or update DiscountProduct for a product (upsert by id_product).
     * Records audit when updating.
     * @param {number} idProduct - The product ID.
     * @param {number} idDiscount - The discount ID.
     * @param {IBusinessReq} businessReq - The business request.
     */
    @Transactional()
    async upsertDiscountProduct(
        idProduct: number,
        idDiscount: number,
        businessReq: IBusinessReq,
    ): Promise<DiscountProduct> {
        const existing = await this.discountProductsGettersService.findByProductId(idProduct);
        if (existing) {
            await this.discountsQueue.add(
                DiscountsConsumerEnum.RecordAudit,
                {
                    idProduct,
                    idDiscountOld: existing.idDiscount,
                    idDiscountNew: idDiscount,
                    operation: AuditOperationEnum.UPDATE,
                    businessReq,
                },
            );
            await this.discountProductsSettersService.updateDiscount(
                existing,
                idDiscount,
                businessReq,
            );
            return await this.discountProductsGettersService.findByProductId(idProduct)
        }
        await this.discountsQueue.add(
            DiscountsConsumerEnum.RecordAudit,
            {
                idProduct,
                idDiscountOld: undefined,
                idDiscountNew: idDiscount,
                operation: AuditOperationEnum.INSERT,
                businessReq,
            },
        );
        return await this.discountProductsSettersService.create(idProduct, idDiscount, businessReq);
    }

    /**
     * Remove a discount and all its DiscountProduct records.
     * Records audit for each removed DiscountProduct before deletion.
     * @param {Discount} discount - The discount to remove.
     * @param {IBusinessReq} businessReq - The business request.
     */
    @Transactional()
    async removeDiscount(discount: Discount, businessReq: IBusinessReq) {
        try {
            const discountProducts = await this.discountProductsGettersService
                .findAllByDiscountId(discount.id);
            for (const dp of discountProducts) {
                await this.discountsQueue.add(
                    DiscountsConsumerEnum.RecordAudit,
                    {
                        idProduct: dp.idProduct,
                        idDiscountOld: dp.idDiscount,
                        idDiscountNew: undefined,
                        operation: AuditOperationEnum.DELETE,
                        businessReq,
                    },
                );
            }
            await this.discountProductsSettersService.removeMany(discountProducts, businessReq);
            await this.deleteEntityByStatus(discount, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.removeDiscount.name, businessReq);
            throw new InternalServerErrorException(this.rDelete.error);
        }
    }
}
