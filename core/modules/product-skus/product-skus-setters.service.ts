import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productSkusResponses } from '../../common/responses';
import { ProductSku } from '../../entities';
import { VariationOptions } from '../../common/types';
import { CreateProductSkuInput } from './dto/create-product-sku.input';
import { UpdateProductSkuInput } from './dto/update-product-sku.input';
import { VariationOptionItemInput } from './dto/variation-option-item.input';

/**
 * Write service responsible for persisting product SKU records.
 */
@Injectable()
export class ProductSkusSettersService extends BasicService<ProductSku> {
    private readonly logger = new Logger(ProductSkusSettersService.name);
    private readonly rCreate = productSkusResponses.create;
    private readonly rUpdate = productSkusResponses.update;
    private readonly rDelete = productSkusResponses.delete;

    constructor(
        @InjectRepository(ProductSku)
        private readonly productSkuRepository: Repository<ProductSku>,
    ) {
        super(productSkuRepository);
    }

    /**
     * Create a new product SKU.
     * @param {CreateProductSkuInput} data - The data for the new product SKU.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<ProductSku>} The created product SKU.
     */
    @Transactional()
    async create(
        data: CreateProductSkuInput,
        businessReq: IBusinessReq,
    ): Promise<ProductSku> {
        try {
            const variationOptionsRecord = this.toVariationOptionsRecord(data.variationOptions);
            const payload = {
                ...data,
                variationOptions: variationOptionsRecord,
                quantity: data.quantity ?? 0,
            };
            return await this.save(payload, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.create.name, businessReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }

    /**
     * Update a product SKU.
     * @param {ProductSku} productSku - The product SKU to update.
     * @param {UpdateProductSkuInput | Partial<ProductSku>} data - The data for updating.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<ProductSku>} The updated product SKU.
     */
    @Transactional()
    async update(
        productSku: ProductSku,
        data: UpdateProductSkuInput | Partial<ProductSku>,
        businessReq: IBusinessReq,
    ): Promise<ProductSku> {
        try {
            return await this.updateEntity(data, productSku, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.update.name, businessReq);
            throw new InternalServerErrorException(this.rUpdate.error);
        }
    }

    /**
     * Remove a product SKU (soft delete by status).
     * @param {ProductSku} productSku - The product SKU to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async remove(productSku: ProductSku, businessReq: IBusinessReq): Promise<void> {
        try {
            await this.deleteEntityByStatus(productSku, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.remove.name, businessReq);
            throw new InternalServerErrorException(this.rDelete.error);
        }
    }

    /** Converts an array of { variationTitle: string; option: string } to a VariationOptions record.
     * 
     * @param {VariationOptionItemInput[]} items - The array of variation option items.
     * @returns {VariationOptions | undefined} The variation options record.
     */
    private toVariationOptionsRecord(
        items?: VariationOptionItemInput[],
    ): VariationOptions | undefined {
        if (!items?.length) return undefined;
        return items.reduce((acc, { variationTitle, option }) => {
            acc[variationTitle] = option;
            return acc;
        }, {} as VariationOptions) as VariationOptions;
    }
}
