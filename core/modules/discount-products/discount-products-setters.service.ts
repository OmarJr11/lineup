import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IBusinessReq, IUserOrBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { discountProductsResponses } from '../../common/responses';
import { DiscountProduct } from '../../entities';

/**
 * Write service responsible for persisting discount-product records.
 */
@Injectable()
export class DiscountProductsSettersService extends BasicService<DiscountProduct> {
  private readonly logger = new Logger(DiscountProductsSettersService.name);
  private readonly rCreate = discountProductsResponses.create;
  private readonly rDelete = discountProductsResponses.delete;
  constructor(
    @InjectRepository(DiscountProduct)
    private readonly discountProductRepository: Repository<DiscountProduct>,
  ) {
    super(discountProductRepository);
  }

  /**
   * Create a new discount-product assignment.
   * @param {number} idProduct - The product ID.
   * @param {number} idDiscount - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<DiscountProduct>} The created discount product.
   */
  @Transactional()
  async create(
    idProduct: number,
    idDiscount: number,
    businessReq: IBusinessReq,
  ): Promise<DiscountProduct> {
    try {
      const payload = { idProduct, idDiscount };
      return await this.save(payload, businessReq);
    } catch (error) {
      LogError(this.logger, error, this.create.name, businessReq);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Update the discount for a product.
   * @param {DiscountProduct} discountProduct - The discount product to update.
   * @param {number} idDiscount - The new discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Transactional()
  async updateDiscount(
    discountProduct: DiscountProduct,
    idDiscount: number,
    businessReq: IBusinessReq,
  ) {
    try {
      const formattedDiscountProduct =
        this.formatDiscountProductForUpdate(discountProduct);
      const data = { idDiscount };
      await this.updateEntity(data, formattedDiscountProduct, businessReq);
    } catch (error) {
      LogError(this.logger, error, this.updateDiscount.name, businessReq);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Remove discount-product records.
   * @param {DiscountProduct[]} discountProducts - The records to remove.
   * @param {IUserOrBusinessReq} businessReq - The business request.
   */
  @Transactional()
  async removeMany(
    discountProducts: DiscountProduct[],
    businessReq: IUserOrBusinessReq,
  ) {
    if (discountProducts.length > 0) {
      try {
        await this.deleteEntity(discountProducts, { data: businessReq });
      } catch (error) {
        LogError(this.logger, error, this.removeMany.name, businessReq);
        throw new InternalServerErrorException(this.rDelete.error);
      }
    }
  }

  /**
   * Format the discount product for the update.
   * @param {DiscountProduct} discountProduct - The discount product to format.
   * @returns {DiscountProduct} The formatted discount product.
   */
  private formatDiscountProductForUpdate(
    discountProduct: DiscountProduct,
  ): DiscountProduct {
    delete discountProduct.product;
    delete discountProduct.discount;
    delete discountProduct.creationBusiness;
    return discountProduct;
  }
}
