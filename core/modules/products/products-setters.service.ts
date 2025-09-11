import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { Product } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class ProductsSettersService extends BasicService<Product> {
    private logger = new Logger(ProductsSettersService.name);
    private readonly rCreate = productsResponses.create;
    private readonly rUpdate = productsResponses.update;
    private readonly rDelete = productsResponses.delete;

    constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ) {
      super(productRepository);
    }

    /**
     * Create a new product.
     * @param {CreateProductInput} data - The data for the new product.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Product>} The created product.
     */
    @Transactional()
    async create(
        data: CreateProductInput,
        businessReq: IBusinessReq
    ): Promise<Product> {
        return await this.save(data, businessReq)
            .catch((error) => {
                LogError(this.logger, error, this.create.name, businessReq);
                throw new InternalServerErrorException(this.rCreate.error);
            });
    }

    /**
     * Update a product.
     * @param {Product} product - The product to update.
     * @param {UpdateProductInput} data - The data for updating the product.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async update(
        product: Product,
        data: UpdateProductInput,
        businessReq: IBusinessReq
    ) {
      return await this.updateEntity(data, product, businessReq)
        .catch((error) => {
          LogError(this.logger, error, this.update.name, businessReq);
          throw new InternalServerErrorException(this.rUpdate.error);
        });
    }

    /**
     * Remove a product.
     * @param {Product} product - The product to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async remove(product: Product, businessReq: IBusinessReq) {
        return await this.deleteEntityByStatus(product, businessReq)
            .catch((error) => {
                LogError(this.logger, error, this.remove.name, businessReq);
                throw new InternalServerErrorException(this.rDelete.error);
            });
    }
}
