import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { ProductSku } from '../../entities';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductSkusGettersService } from './product-skus-getters.service';
import { ProductSkusSettersService } from './product-skus-setters.service';
import { StockMovementsSettersService } from '../stock-movements/stock-movements-setters.service';
import { UpdateProductSkuInput } from './dto/update-product-sku.input';
import { UpdateProductSkusInput } from './dto/update-product-skus.input';
import { AdjustStockInput } from './dto/adjust-stock.input';
import { RegisterPurchaseInput } from './dto/register-purchase.input';
import { IBusinessReq } from '../../common/interfaces';
import { StockMovementTypeEnum } from '../../common/enums';
import { LogWarn } from '../../common/helpers';
import { productSkusResponses } from '../../common/responses';

/**
 * Orchestrating service for product SKU operations.
 * Handles CRUD operations and stock management.
 */
@Injectable()
export class ProductSkusService extends BasicService<ProductSku> {
    private readonly logger = new Logger(ProductSkusService.name);
    private readonly rRegisterPurchase = productSkusResponses.registerPurchase;

    constructor(
        @Inject(REQUEST)
        private readonly businessRequest: Request,
        @InjectRepository(ProductSku)
        private readonly productSkuRepository: Repository<ProductSku>,
        private readonly productSkusGettersService: ProductSkusGettersService,
        private readonly productSkusSettersService: ProductSkusSettersService,
        private readonly stockMovementsSettersService: StockMovementsSettersService,
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
     * Find a product SKU by ID and business ID (validates ownership).
     * @param {number} id - The SKU ID.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<ProductSku>} The found product SKU.
     */
    async findOneByBusinessId(id: number, idBusiness: number): Promise<ProductSku> {
        return await this.productSkusGettersService
            .findOneByBusinessId(id, idBusiness);
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
     * Find all SKUs for a product by business (validates ownership).
     * @param {number} idProduct - The product ID.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<ProductSku[]>} Array of product SKUs.
     */
    async findAllByProductAndBusiness(
        idProduct: number,
        idBusiness: number,
    ): Promise<ProductSku[]> {
        return await this.productSkusGettersService
            .findAllByProductAndBusiness(idProduct, idBusiness);
    }

    /**
     * Get total stock for a product.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<number>} Total quantity.
     */
    async getTotalStock(idProduct: number): Promise<number> {
        return await this.productSkusGettersService
            .getTotalStockByProduct(idProduct);
    }

    /**
     * Update a product SKU (price, currency, quantity).
     * Validates that the SKU belongs to the business.
     * @param {UpdateProductSkuInput} input - The update data.
     * @param {IBusinessReq} businessReq - The business request.
     * @returns {Promise<ProductSku>} The updated product SKU.
     */
    async updateSku(
        input: UpdateProductSkuInput,
        businessReq: IBusinessReq,
    ): Promise<ProductSku> {
        const sku = await this.productSkusGettersService.findOneByBusinessId(input.id, businessReq.businessId);
        await this.productSkusSettersService.update(sku, input, businessReq);
        return await this.productSkusGettersService.findOneWithRelations(input.id);
    }

    /**
     * Update multiple SKUs. Each item specifies the SKU id and the fields to update.
     * Validates that each SKU belongs to the business.
     * @param {UpdateProductSkusInput} input - The update data (array of SKU updates).
     * @param {IBusinessReq} businessReq - The business request.
     * @returns {Promise<ProductSku[]>} The updated product SKUs.
     */
    @Transactional()
    async updateAllSkusByProduct(
        input: UpdateProductSkusInput,
        businessReq: IBusinessReq,
    ): Promise<ProductSku[]> {
        const updatedIds: number[] = [];
        for (const item of input.skus) {
            const sku = await this.productSkusGettersService.findOneByBusinessId(item.id, businessReq.businessId);
            if (item.price !== undefined && item.idCurrency !== undefined) {
                await this.productSkusSettersService.update(sku, {
                    price: item.price,
                    idCurrency: item.idCurrency,
                }, businessReq);
            }
            if (item.quantity !== undefined) {
                const quantityDelta = item.quantity - (sku.quantity ?? 0);
                if (quantityDelta !== 0) {
                    await this.adjustStock(
                        { idProductSku: item.id, quantityDelta, notes: 'Update from product SKUs edit' },
                        businessReq,
                    );
                }
            }
            updatedIds.push(item.id);
        }
        return Promise.all(
            updatedIds.map((id) => this.productSkusGettersService.findOneWithRelations(id)),
        );
    }

    /**
     * Adjust stock for a product SKU (add or subtract). Records the movement in history.
     * @param {AdjustStockInput} input - The adjustment data.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<ProductSku>} The updated product SKU.
     */
    @Transactional()
    async adjustStock(
        input: AdjustStockInput,
        businessReq: IBusinessReq,
    ): Promise<ProductSku> {
        const sku = await this.productSkusGettersService
            .findOneByBusinessId(input.idProductSku, businessReq.businessId);
        const previousQuantity = sku.quantity ?? 0;
        const newQuantity = previousQuantity + input.quantityDelta;
        if (newQuantity < 0) {
            LogWarn(this.logger, this.rRegisterPurchase.insufficientStock.message, this.adjustStock.name, businessReq);
            throw new BadRequestException(this.rRegisterPurchase.insufficientStock);
        }
        const movementType =
            input.quantityDelta > 0
                ? StockMovementTypeEnum.ADJUSTMENT_IN
                : StockMovementTypeEnum.ADJUSTMENT_OUT;
        await this.stockMovementsSettersService.create(
            {
                idProductSku: sku.id,
                type: movementType,
                quantityDelta: input.quantityDelta,
                previousQuantity,
                newQuantity,
                notes: input.notes,
            },
            businessReq,
        );

        const data = { quantity: newQuantity };
        return await this.productSkusSettersService.update(sku, data, businessReq);
    }

    /**
     * Register a purchase made by a customer (sale). Decreases stock and records the movement in history.
     * @param {RegisterPurchaseInput} input - The sale data (quantity sold).
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<ProductSku>} The updated product SKU.
     */
    @Transactional()
    async registerPurchase(
        input: RegisterPurchaseInput,
        businessReq: IBusinessReq,
    ): Promise<ProductSku> {
        const sku = await this.productSkusGettersService
            .findOneByBusinessId(input.idProductSku, businessReq.businessId);
        const previousQuantity = sku.quantity ?? 0;
        const newQuantity = previousQuantity - input.quantity;
        if (newQuantity < 0) {
            LogWarn(this.logger, this.rRegisterPurchase.insufficientStock.message, this.registerPurchase.name, businessReq);
            throw new BadRequestException(this.rRegisterPurchase.insufficientStock);
        }
        await this.stockMovementsSettersService.create(
            {
                idProductSku: sku.id,
                type: StockMovementTypeEnum.SALE,
                quantityDelta: -input.quantity,
                previousQuantity,
                newQuantity,
                notes: input.notes,
            },
            businessReq,
        );
        const data = { quantity: newQuantity };
        return await this.productSkusSettersService.update(sku, data, businessReq);
    }

    /**
     * Remove a product SKU (soft delete). Records the removal in history.
     * @param {number} idProductSku - The product SKU ID.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async removeProductSku(idProductSku: number, businessReq: IBusinessReq) {
        const sku = await this.productSkusGettersService
            .findOneByBusinessId(idProductSku, businessReq.businessId);
        const currentQuantity = sku.quantity ?? 0;
        await this.stockMovementsSettersService.create(
            {
                idProductSku: sku.id,
                type: StockMovementTypeEnum.REMOVAL,
                quantityDelta: -currentQuantity,
                previousQuantity: currentQuantity,
                newQuantity: 0,
                notes: 'SKU/variation removed',
            },
            businessReq,
        );
        await this.productSkusSettersService.remove(sku, businessReq);
    }
}
