import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { ProductSku } from '../../entities';
import { Repository } from 'typeorm';
import { ProductSkusGettersService } from './product-skus-getters.service';
import { ProductSkusSettersService } from './product-skus-setters.service';
import { UpdateProductSkuInput } from './dto/update-product-sku.input';
import { IBusinessReq } from '../../common/interfaces';

/**
 * Orchestrating service for product SKU operations.
 * Handles CRUD operations and stock management.
 */
@Injectable()
export class ProductSkusService extends BasicService<ProductSku> {
    private readonly logger = new Logger(ProductSkusService.name);

    constructor(
        @Inject(REQUEST)
        private readonly businessRequest: Request,
        @InjectRepository(ProductSku)
        private readonly productSkuRepository: Repository<ProductSku>,
        private readonly productSkusGettersService: ProductSkusGettersService,
        private readonly productSkusSettersService: ProductSkusSettersService,
    ) {
        super(productSkuRepository, businessRequest);
    }

    /**
     * Find a product SKU by ID.
     * @param {number} id - The SKU ID.
     * @returns {Promise<ProductSku>} The found product SKU.
     */
    async findOne(id: number): Promise<ProductSku> {
        return await this.productSkusGettersService.findOneWithRelations(id);
    }

    /**
     * Find all SKUs for a product.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<ProductSku[]>} Array of product SKUs.
     */
    async findAllByProduct(idProduct: number): Promise<ProductSku[]> {
        return await this.productSkusGettersService.findAllByProduct(idProduct);
    }

    /**
     * Get total stock for a product.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<number>} Total quantity.
     */
    async getTotalStock(idProduct: number): Promise<number> {
        return await this.productSkusGettersService.getTotalStockByProduct(
            idProduct,
        );
    }

    /**
     * Update a product SKU (e.g. quantity or price).
     * @param {UpdateProductSkuInput} input - The update data.
     * @param {IBusinessReq} businessReq - The business request.
     * @returns {Promise<ProductSku>} The updated product SKU.
     */
    async updateSku(
        input: UpdateProductSkuInput,
        businessReq: IBusinessReq,
    ): Promise<ProductSku> {
        const sku = await this.productSkusGettersService.findOne(input.id);
        const updateData: Partial<ProductSku> = {};
        if (input.quantity !== undefined) updateData.quantity = input.quantity;
        if (input.price !== undefined) updateData.price = input.price;
        if (input.skuCode !== undefined) updateData.skuCode = input.skuCode;
        return await this.productSkusSettersService.update(sku, updateData, businessReq);
    }
}
