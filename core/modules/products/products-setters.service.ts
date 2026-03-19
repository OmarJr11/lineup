import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { Product } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessReq, IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { AuditOperationEnum, AuditableEntityNameEnum } from '../../common/enums';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { toEntityAuditValues } from '../entity-audits/entity-audit-values.helper';

@Injectable()
export class ProductsSettersService extends BasicService<Product> {
    private logger = new Logger(ProductsSettersService.name);
    private readonly rCreate = productsResponses.create;
    private readonly rUpdate = productsResponses.update;
    private readonly rDelete = productsResponses.delete;

    constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
      private readonly entityAuditsQueueService: EntityAuditsQueueService,
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
      try {
        const product = await this.save(data, businessReq);
        await this.entityAuditsQueueService.addRecordJob({
          entityName: AuditableEntityNameEnum.Product,
          entityId: product.id,
          operation: AuditOperationEnum.INSERT,
          newValues: toEntityAuditValues(product),
          userOrBusinessReq: businessReq,
        });
        return product;
      } catch (error) {
        LogError(this.logger, error, this.create.name, businessReq);
        throw new InternalServerErrorException(this.rCreate.error);
      }
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
      try {
        const oldValues = toEntityAuditValues(product);
        const updated = await this.updateEntity(data, product, businessReq);
        await this.entityAuditsQueueService.addRecordJob({
          entityName: AuditableEntityNameEnum.Product,
          entityId: product.id,
          operation: AuditOperationEnum.UPDATE,
          oldValues,
          newValues: toEntityAuditValues(updated),
          userOrBusinessReq: businessReq,
        });
        return updated;
      } catch (error) {
        LogError(this.logger, error, this.update.name, businessReq);
        throw new InternalServerErrorException(this.rUpdate.error);
      }
    }

    /**
     * Remove a product.
     * @param {Product} product - The product to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async remove(product: Product, businessReq: IBusinessReq) {
      try {
        await this.entityAuditsQueueService.addRecordJob({
          entityName: AuditableEntityNameEnum.Product,
          entityId: product.id,
          operation: AuditOperationEnum.DELETE,
          oldValues: toEntityAuditValues(product),
          userOrBusinessReq: businessReq,
        });
        return await this.deleteEntityByStatus(product, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.remove.name, businessReq);
        throw new InternalServerErrorException(this.rDelete.error);
      }
    }

    /**
     * Increment the likes count on a product.
     * @param {Product} product - The product.
     * @param {IUserReq} userReq - The user request object.
     */
    async incrementLikes(product: Product, userReq: IUserReq) {
        const likes = product.likes + 1;
        await this.updateEntity({ likes }, product, userReq);
    }

    /**
     * Decrement the likes count on a product.
     * @param {Product} product - The product.
     * @param {IUserReq} userReq - The user request object.
     */
    async decrementLikes(product: Product, userReq: IUserReq) {
        const likes = product.likes - 1;
        await this.updateEntity({ likes }, product, userReq);
    }

    /**
     * Update the ratingAverage field on a product.
     * @param {Product} product - The product.
     * @param {number} ratingAverage - The new computed average (0.00–5.00).
     * @param {IUserReq} userReq - The user request object.
     */
    async updateRatingAverage(product: Product, ratingAverage: number, userReq: IUserReq): Promise<void> {
        await this.updateEntity({ ratingAverage }, product, userReq);
    }

    /**
     * Increment the visits count on a product.
     * @param {Product} product - The product.
     */
    async incrementVisits(product: Product) {
        const visits = Number(product.visits) + 1;
        const businessReq: IBusinessReq = {
          businessId: product.idCreationBusiness,
          path: ''
        };
        await this.updateEntity({ visits }, product, businessReq);
    }
}
