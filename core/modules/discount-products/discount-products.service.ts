import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { DiscountProduct } from '../../entities';
import { DiscountProductsGettersService } from './discount-products-getters.service';
import { DiscountProductsSettersService } from './discount-products-setters.service';
import { IBusinessReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Transactional } from 'typeorm-transactional-cls-hooked';

/**
 * Orchestrating service for discount-product operations.
 */
@Injectable({ scope: Scope.REQUEST })
export class DiscountProductsService extends BasicService<DiscountProduct> {
  private readonly logger = new Logger(DiscountProductsService.name);

  constructor(
    @Inject(REQUEST)
    private readonly request: Request,
    @InjectRepository(DiscountProduct)
    private readonly discountProductRepository: Repository<DiscountProduct>,
    private readonly discountProductsGettersService: DiscountProductsGettersService,
    private readonly discountProductsSettersService: DiscountProductsSettersService,
  ) {
    super(discountProductRepository, request);
  }

  /**
   * Find DiscountProduct by product ID.
   * @param {number} idProduct - The product ID.
   * @returns {Promise<DiscountProduct>} The DiscountProduct.
   */
  async findByProductId(idProduct: number): Promise<DiscountProduct> {
    return await this.discountProductsGettersService.findByProductId(idProduct);
  }

  /**
   * Find DiscountProduct by product ID with discount.
   * @param {number} idProduct - The product ID.
   * @returns {Promise<DiscountProduct>} The DiscountProduct.
   */
  async findByProductIdWithDiscount(
    idProduct: number,
  ): Promise<DiscountProduct> {
    return await this.discountProductsGettersService.findByProductIdWithDiscount(
      idProduct,
    );
  }

  /**
   * Find all DiscountProducts for a discount.
   * @param {number} idDiscount - The discount ID.
   * @returns {Promise<DiscountProduct[]>} The DiscountProducts.
   */
  async findAllByDiscountId(idDiscount: number): Promise<DiscountProduct[]> {
    return await this.discountProductsGettersService.findAllByDiscountId(
      idDiscount,
    );
  }

  /**
   * Create or update DiscountProduct (upsert by id_product).
   * @param {number} idProduct - The product ID.
   * @param {number} idDiscount - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<DiscountProduct>} The DiscountProduct.
   */
  @Transactional()
  async upsert(
    idProduct: number,
    idDiscount: number,
    businessReq: IBusinessReq,
  ): Promise<DiscountProduct> {
    const existing =
      await this.discountProductsGettersService.findByProductId(idProduct);
    if (existing) {
      await this.discountProductsSettersService.updateDiscount(
        existing,
        idDiscount,
        businessReq,
      );
      return await this.discountProductsGettersService.findByProductId(
        idProduct,
      );
    }
    return await this.discountProductsSettersService.create(
      idProduct,
      idDiscount,
      businessReq,
    );
  }

  /**
   * Remove all DiscountProducts for a discount.
   * @param {number} idDiscount - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Transactional()
  async removeByDiscountId(idDiscount: number, businessReq: IBusinessReq) {
    const discountProducts =
      await this.discountProductsGettersService.findAllByDiscountId(idDiscount);
    await this.discountProductsSettersService.removeMany(
      discountProducts,
      businessReq,
    );
  }
}
