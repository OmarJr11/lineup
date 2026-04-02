import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ProductVariation } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productVariationsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductVariationInput } from '../products/dto/product-variation.input';
import {
  AuditOperationEnum,
  AuditableEntityNameEnum,
} from '../../common/enums';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { toEntityAuditValues } from '../entity-audits/entity-audit-values.helper';

@Injectable()
export class ProductVariationsSettersService extends BasicService<ProductVariation> {
  private logger = new Logger(ProductVariationsSettersService.name);
  private readonly rCreate = productVariationsResponses.create;
  private readonly rUpdate = productVariationsResponses.update;
  private readonly rDelete = productVariationsResponses.delete;

  constructor(
    @InjectRepository(ProductVariation)
    private readonly productVariationRepository: Repository<ProductVariation>,
    private readonly entityAuditsQueueService: EntityAuditsQueueService,
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
    businessReq: IBusinessReq,
  ): Promise<ProductVariation> {
    try {
      const variation = await this.save(data, businessReq);
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.ProductVariation,
        entityId: variation.id,
        operation: AuditOperationEnum.INSERT,
        newValues: toEntityAuditValues(variation),
        userOrBusinessReq: businessReq,
      });
      return variation;
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
    businessReq: IBusinessReq,
  ) {
    try {
      const oldValues = toEntityAuditValues(productVariation);
      const updated = await this.updateEntity(
        data,
        productVariation,
        businessReq,
      );
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.ProductVariation,
        entityId: productVariation.id,
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
   * Remove a product variation.
   * @param {ProductVariation} productVariation - The product variation to remove.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  @Transactional()
  async remove(productVariation: ProductVariation, businessReq: IBusinessReq) {
    try {
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.ProductVariation,
        entityId: productVariation.id,
        operation: AuditOperationEnum.DELETE,
        oldValues: toEntityAuditValues(productVariation),
        userOrBusinessReq: businessReq,
      });
      return await this.deleteEntityByStatus(productVariation, businessReq);
    } catch (error) {
      LogError(this.logger, error, this.remove.name, businessReq);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }
}
