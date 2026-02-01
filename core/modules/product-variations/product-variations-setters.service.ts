import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ProductVariation } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productVariationsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductVariationInput } from '../products/dto/product-variation.input';

@Injectable()
export class ProductVariationsSettersService extends BasicService<ProductVariation> {
    private logger = new Logger(ProductVariationsSettersService.name);
    private readonly rCreate = productVariationsResponses.create;
    private readonly rUpdate = productVariationsResponses.update;
    private readonly rDelete = productVariationsResponses.delete;

    constructor(
      @InjectRepository(ProductVariation)
      private readonly productVariationRepository: Repository<ProductVariation>,
    ) {
      super(productVariationRepository);
    }

    /**
     * Create a new product variation.
     * @param {ProductVariationInput} data - The data for the new product variation.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<ProductVariation>} The created product variation.
     */
    @Transactional()
    async create(
        data: ProductVariationInput,
        businessReq: IBusinessReq
    ): Promise<ProductVariation> {
      try {
        return await this.save(data, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.create.name, businessReq);
        throw new InternalServerErrorException(this.rCreate.error);
      }
    }

    /**
     * Update a product variation.
     * @param {ProductVariation} productVariation - The product variation to update.
     * @param {ProductVariationInput} data - The data for updating the product variation.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async update(
        productVariation: ProductVariation,
        data: ProductVariationInput,
        businessReq: IBusinessReq
    ) {
      try {
        return await this.updateEntity(data, productVariation, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.update.name, businessReq);
        throw new InternalServerErrorException(this.rUpdate.error);
      }
    }

    /**
     * Remove a product variation.
     * @param {ProductVariation} productVariation - The product variation to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async remove(productVariation: ProductVariation, businessReq: IBusinessReq) {
      try {
        return await this.deleteEntityByStatus(productVariation, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.remove.name, businessReq);
        throw new InternalServerErrorException(this.rDelete.error);
      }
    }
}
