import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  Scope,
} from '@nestjs/common';
import { Discount, EntityAudit } from '../../entities';
import { DiscountsGettersService } from './discounts-getters.service';
import { DiscountsSettersService } from './discounts-setters.service';
import { CreateDiscountInput } from './dto/create-discount.input';
import { FindDiscountsByScopeInput } from './dto/find-discounts-by-scope.input';
import { InfinityScrollInput } from '../../common/dtos';
import { IPaginatedResult } from '../../common/interfaces';
import { UpdateDiscountInput } from './dto/update-discount.input';
import { IBusinessReq } from '../../common/interfaces';
import { DiscountScopeEnum } from '../../common/enums';
import { ProductsGettersService } from '../products/products-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { discountsResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

/**
 * Orchestrating service for discount operations.
 * Handles create/update/remove with scope-based product assignment and audit.
 */
@Injectable({ scope: Scope.REQUEST })
export class DiscountsService extends BasicService<Discount> {
  private logger = new Logger(DiscountsService.name);
  private readonly rCreate = discountsResponses.create;

  constructor(
    @Inject(REQUEST)
    private readonly businessRequest: Request,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    private readonly discountsGettersService: DiscountsGettersService,
    private readonly discountsSettersService: DiscountsSettersService,
    private readonly productsGettersService: ProductsGettersService,
    private readonly catalogsGettersService: CatalogsGettersService,
    private readonly businessesGettersService: BusinessesGettersService,
  ) {
    super(discountRepository, businessRequest);
  }

  /**
   * Create a discount and assign it to products based on scope.
   * Business: all products of the business.
   * Catalog: all products of the catalog (overrides business discount for those products).
   * Product: single product (overrides any existing discount).
   * @param {CreateDiscountInput} data - The discount data.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<Discount>} The created discount.
   */
  @Transactional()
  async create(
    data: CreateDiscountInput,
    businessReq: IBusinessReq,
  ): Promise<Discount> {
    const idBusiness = businessReq.businessId;
    await this.validateScopeOwnership(data, idBusiness);
    const discount = await this.discountsSettersService.createDiscount(
      data,
      businessReq,
    );
    const productIds = await this.resolveProductIds(data, idBusiness);
    for (const idProduct of productIds) {
      await this.discountsSettersService.upsertDiscountProduct(
        idProduct,
        discount.id,
        businessReq,
      );
    }
    return await this.discountsGettersService.findOne(discount.id);
  }

  /**
   * Update a discount definition (value, dates, type).
   * Does not change product assignments.
   * @param {UpdateDiscountInput} data - The update data.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<Discount>} The updated discount.
   */
  @Transactional()
  async update(
    data: UpdateDiscountInput,
    businessReq: IBusinessReq,
  ): Promise<Discount> {
    const discount =
      await this.discountsGettersService.findOneAndVerifyOwnership(
        data.id,
        businessReq.businessId,
      );
    return await this.discountsSettersService.updateDiscount(
      discount,
      data,
      businessReq,
    );
  }

  /**
   * Remove a discount and all its product assignments.
   * Records audit for each removed assignment.
   * @param {number} id - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Transactional()
  async remove(id: number, businessReq: IBusinessReq) {
    const discount =
      await this.discountsGettersService.findOneAndVerifyOwnership(
        id,
        businessReq.businessId,
      );
    await this.discountsSettersService.removeDiscount(discount, businessReq);
  }

  /**
   * Find a discount by ID.
   * @param {number} id - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<Discount>} The found discount.
   */
  async findOne(id: number, businessReq: IBusinessReq): Promise<Discount> {
    return await this.discountsGettersService.findOneAndVerifyOwnership(
      id,
      businessReq.businessId,
    );
  }

  /**
   * Find a discount by ID and business (ownership check).
   * @param {number} id - The discount ID.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<Discount>} The found discount.
   */
  async findOneByBusiness(id: number, idBusiness: number): Promise<Discount> {
    return await this.discountsGettersService.findOneAndVerifyOwnership(
      id,
      idBusiness,
    );
  }

  /**
   * Find all discounts belonging to the authenticated business.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<Discount[]>} Array of discounts.
   */
  async findAllMyDiscounts(businessReq: IBusinessReq): Promise<Discount[]> {
    return await this.discountsGettersService.findAllByBusiness(
      businessReq.businessId,
    );
  }

  /**
   * Find discounts by scope with pagination. Returns paginated discounts of the business for the given scope.
   * @param {FindDiscountsByScopeInput} input - Scope (business, catalog, or product).
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<IPaginatedResult<Discount>>} Paginated result.
   */
  async findAllMyDiscountsByScope(
    input: FindDiscountsByScopeInput,
    pagination: InfinityScrollInput,
    businessReq: IBusinessReq,
  ): Promise<IPaginatedResult<Discount>> {
    const idBusiness = businessReq.businessId;
    switch (input.scope) {
      case DiscountScopeEnum.BUSINESS:
      case DiscountScopeEnum.CATALOG:
      case DiscountScopeEnum.PRODUCT:
        return await this.discountsGettersService.findAllByScopePaginated(
          input.scope,
          idBusiness,
          pagination,
        );
      default:
        LogError(
          this.logger,
          this.rCreate.cantAssignDiscount.message,
          this.findAllMyDiscountsByScope.name,
        );
        throw new ForbiddenException(this.rCreate.cantAssignDiscount);
    }
  }

  /**
   * Find the active discount for a product. Verifies the product belongs to the business.
   * @param {number} idProduct - The product ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<Discount | null>} The discount or null.
   */
  async findActiveDiscountByProduct(
    idProduct: number,
    businessReq: IBusinessReq,
  ): Promise<Discount | null> {
    await this.productsGettersService.findOneByBusinessId(
      idProduct,
      businessReq.businessId,
    );
    return await this.discountsGettersService.findActiveDiscountByProduct(
      idProduct,
    );
  }

  /**
   * Find audit history for a product. Verifies the product belongs to the business.
   * @param {number} idProduct - The product ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @param {number} [limit=50] - Max records.
   * @returns {Promise<EntityAudit[]>} Array of audit records.
   */
  async findAuditByProduct(
    idProduct: number,
    businessReq: IBusinessReq,
    limit: number = 50,
  ): Promise<EntityAudit[]> {
    await this.productsGettersService.findOneByBusinessId(
      idProduct,
      businessReq.businessId,
    );
    return await this.discountsGettersService.findAuditByProduct(
      idProduct,
      limit,
    );
  }

  /**
   * Find audit history for a discount. Verifies the discount belongs to the business.
   * @param {number} idDiscount - The discount ID.
   * @param {IBusinessReq} businessReq - The business request.
   * @param {number} [limit=50] - Max records.
   * @returns {Promise<EntityAudit[]>} Array of audit records.
   */
  async findAuditByDiscount(
    idDiscount: number,
    businessReq: IBusinessReq,
    limit: number = 50,
  ): Promise<EntityAudit[]> {
    await this.discountsGettersService.findOneAndVerifyOwnership(
      idDiscount,
      businessReq.businessId,
    );
    return await this.discountsGettersService.findAuditByDiscount(
      idDiscount,
      limit,
    );
  }

  /**
   * Validate that the scope target (business, catalog, product) belongs to the requesting business.
   * @param {CreateDiscountInput} data - The discount data.
   * @param {number} idBusiness - The business ID.
   */
  private async validateScopeOwnership(
    data: CreateDiscountInput,
    idBusiness: number,
  ) {
    switch (data.scope) {
      case DiscountScopeEnum.BUSINESS:
        await this.businessesGettersService.findOne(idBusiness);
        break;
      case DiscountScopeEnum.CATALOG:
        await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(
          data.idCatalog,
          idBusiness,
        );
        break;
      case DiscountScopeEnum.PRODUCT:
        await this.productsGettersService.findOneByBusinessId(
          data.idProduct,
          idBusiness,
        );
        break;
      default:
        LogError(
          this.logger,
          this.rCreate.cantAssignDiscount.message,
          this.create.name,
        );
        throw new ForbiddenException(this.rCreate.cantAssignDiscount);
    }
  }

  /**
   * Resolve product IDs based on scope.
   * @param {CreateDiscountInput} data - The discount data.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number[]>} Array of product IDs.
   */
  private async resolveProductIds(
    data: CreateDiscountInput,
    idBusiness: number,
  ): Promise<number[]> {
    switch (data.scope) {
      case DiscountScopeEnum.BUSINESS:
        return await this.productsGettersService.findProductIdsByBusiness(
          idBusiness,
        );
        break;
      case DiscountScopeEnum.CATALOG:
        return await this.productsGettersService.findProductIdsByCatalog(
          data.idCatalog,
        );
        break;
      case DiscountScopeEnum.PRODUCT:
        return [data.idProduct];
        break;
      default:
        return [];
    }
  }
}
