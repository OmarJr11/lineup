import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import {
  IBusinessReq,
  IUserOrBusinessReq,
  IUserReq,
} from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { discountsResponses } from '../../common/responses';
import {
  AuditOperationEnum,
  AuditableEntityNameEnum,
  DiscountScopeEnum,
  DiscountTypeEnum,
  StatusEnum,
} from '../../common/enums';
import { Discount, DiscountProduct } from '../../entities';
import { CreateDiscountInput } from './dto/create-discount.input';
import { UpdateDiscountInput } from './dto/update-discount.input';
import { DiscountProductsGettersService } from '../discount-products/discount-products-getters.service';
import { DiscountProductsSettersService } from '../discount-products/discount-products-setters.service';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { toEntityAuditValues } from '../entity-audits/entity-audit-values.helper';

/** Metadata for discount audit records (scope, type, value). */
export interface DiscountAuditMetadata {
  scope: DiscountScopeEnum;
  discountType: DiscountTypeEnum;
  value: number;
  idCurrency?: number;
}

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
    private readonly entityAuditsQueueService: EntityAuditsQueueService,
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
      const { startDate, endDate } = this.formatDiscountDateRange(
        data.startDate,
        data.endDate,
      );
      const status = this.resolveStatusFromStartDate(startDate);
      const discount = await this.save(
        { ...data, startDate, endDate, status },
        businessReq,
      );
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.Discount,
        entityId: discount.id,
        operation: AuditOperationEnum.INSERT,
        newValues: toEntityAuditValues(discount),
        userOrBusinessReq: businessReq,
      });
      return discount;
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
      const updateData = { ...data };
      if (data.startDate || data.endDate !== undefined) {
        const startDate = data.startDate ?? discount.startDate;
        const endDate = data.endDate ?? discount.endDate;
        const formatted = this.formatDiscountDateRange(startDate, endDate);
        if (data.startDate) updateData.startDate = formatted.startDate;
        if (data.endDate) updateData.endDate = formatted.endDate;
      }
      const oldValues = toEntityAuditValues(discount);
      const updated = await this.updateEntity(
        updateData,
        discount,
        businessReq,
      );
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.Discount,
        entityId: discount.id,
        operation: AuditOperationEnum.UPDATE,
        oldValues,
        newValues: toEntityAuditValues(updated),
        userOrBusinessReq: businessReq,
      });
      return updated;
    } catch (error) {
      LogError(this.logger, error, this.updateDiscount.name, businessReq);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Update multiple discounts.
   * @param {StatusEnum} status - The status to update.
   * @param {Discount[]} discounts - The discounts to update.
   * @param {IUserReq} userReq - The user request.
   */
  @Transactional()
  async updateMany(
    status: StatusEnum,
    discounts: Discount[],
    userReq: IUserOrBusinessReq,
  ) {
    try {
      await this.updateEntity({ status }, discounts, userReq);
      for (const discount of discounts) {
        const discountProducts =
          await this.discountProductsGettersService.findAllByDiscountId(
            discount.id,
          );
        for (const discountProduct of discountProducts) {
          await this.entityAuditsQueueService.addRecordJob({
            entityName: AuditableEntityNameEnum.DiscountProduct,
            entityId: discountProduct.idProduct,
            operation: AuditOperationEnum.UPDATE,
            oldValues: {
              idProduct: discountProduct.idProduct,
              idDiscount: discountProduct.idDiscount,
            },
            newValues: {
              idProduct: discountProduct.idProduct,
              idDiscount: discountProduct.idDiscount,
            },
            userOrBusinessReq: {
              businessId: discount.idCreationBusiness,
              path: 'business',
            },
          });
        }
      }
    } catch (error) {
      LogError(this.logger, error, this.updateMany.name);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Create or update DiscountProduct for a product (upsert by id_product).
   * Records audit when updating.
   * @param {number} idProduct - The product ID.
   * @param {number} idDiscount - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @param {DiscountAuditMetadata} [auditMetadata] - Optional metadata for audit (scope, discountType, value).
   */
  @Transactional()
  async upsertDiscountProduct(
    idProduct: number,
    idDiscount: number,
    businessReq: IBusinessReq,
    auditMetadata?: DiscountAuditMetadata,
  ): Promise<DiscountProduct> {
    const existing =
      await this.discountProductsGettersService.findByProductId(idProduct);
    const auditPayload = {
      scope: auditMetadata?.scope,
      discountType: auditMetadata?.discountType,
      value: auditMetadata?.value,
      idCurrency: auditMetadata?.idCurrency,
    };
    if (existing) {
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.DiscountProduct,
        entityId: idProduct,
        operation: AuditOperationEnum.UPDATE,
        oldValues: { idProduct, idDiscount: existing.idDiscount },
        newValues: { idProduct, idDiscount },
        userOrBusinessReq: businessReq,
      });
      await this.discountProductsSettersService.updateDiscount(
        existing,
        idDiscount,
        businessReq,
      );
      return await this.discountProductsGettersService.findByProductId(
        idProduct,
      );
    }
    await this.entityAuditsQueueService.addRecordJob({
      entityName: AuditableEntityNameEnum.DiscountProduct,
      entityId: idProduct,
      operation: AuditOperationEnum.INSERT,
      newValues: { idProduct, idDiscount },
      userOrBusinessReq: businessReq,
    });
    return await this.discountProductsSettersService.create(
      idProduct,
      idDiscount,
      businessReq,
    );
  }

  /**
   * Remove a discount and all its DiscountProduct records.
   * Records audit for each removed DiscountProduct before deletion.
   * @param {Discount} discount - The discount to remove.
   * @param {IUserOrBusinessReq} businessReq - The business request.
   */
  @Transactional()
  async removeDiscount(discount: Discount, businessReq: IUserOrBusinessReq) {
    try {
      const discountProducts =
        await this.discountProductsGettersService.findAllByDiscountId(
          discount.id,
        );
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.Discount,
        entityId: discount.id,
        operation: AuditOperationEnum.DELETE,
        oldValues: toEntityAuditValues(discount),
        userOrBusinessReq: businessReq,
      });
      for (const dp of discountProducts) {
        await this.entityAuditsQueueService.addRecordJob({
          entityName: AuditableEntityNameEnum.DiscountProduct,
          entityId: dp.idProduct,
          operation: AuditOperationEnum.DELETE,
          oldValues: { idProduct: dp.idProduct, idDiscount: dp.idDiscount },
          userOrBusinessReq: businessReq,
        });
      }
      await this.discountProductsSettersService.removeMany(
        discountProducts,
        businessReq,
      );
      await this.deleteEntityByStatus(discount, businessReq);
    } catch (error) {
      LogError(this.logger, error, this.removeDiscount.name, businessReq);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }

  /**
   * Format startDate to 00:00:00 and endDate to 23:59:59.
   * @param {Date} startDate - The start date.
   * @param {Date} endDate - The end date.
   * @returns {{ startDate: Date; endDate: Date }} Formatted dates.
   */
  private formatDiscountDateRange(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }

  /**
   * Resolve status from startDate: PENDING if future, ACTIVE if today or past.
   * @param {Date} startDate - The discount start date.
   * @returns {StatusEnum} PENDING or ACTIVE.
   */
  private resolveStatusFromStartDate(startDate: Date): StatusEnum {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    return start > today ? StatusEnum.PENDING : StatusEnum.ACTIVE;
  }
}
