import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  LessThan,
  LessThanOrEqual,
  Not,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { discountsResponses } from '../../common/responses';
import { DiscountScopeEnum, StatusEnum } from '../../common/enums';
import { DiscountTypeEnum } from '../../common/enums/discount-type.enum';
import { InfinityScrollInput } from '../../common/dtos';
import { IAdminLabeledCount, IPaginatedResult } from '../../common/interfaces';
import { Discount, EntityAudit } from '../../entities';
import { DiscountProductsGettersService } from '../discount-products/discount-products-getters.service';
import { EntityAuditsGettersService } from '../entity-audits/entity-audits-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import type { ITimeSeriesStats } from '../business-statistics/interfaces/business-visits-stats.interface';

const DEFAULT_TOP_LIMIT = 10;
/**
 * Read-only service for querying discounts.
 */
@Injectable()
export class DiscountsGettersService extends BasicService<Discount> {
  private readonly logger = new Logger(DiscountsGettersService.name);
  private readonly rList = discountsResponses.list;
  private readonly relations = ['currency', 'business', 'catalog'];

  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    private readonly discountProductsGettersService: DiscountProductsGettersService,
    private readonly entityAuditsGettersService: EntityAuditsGettersService,
    private readonly catalogsGettersService: CatalogsGettersService,
    private readonly productsGettersService: ProductsGettersService,
  ) {
    super(discountRepository);
  }

  /**
   * Find a discount by ID with relations.
   * @param {number} id - The discount ID.
   * @returns {Promise<Discount>} The found discount.
   */
  async findOne(id: number): Promise<Discount> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id, status: Not(StatusEnum.DELETED) },
        relations: this.relations,
      });
    } catch (error: unknown) {
      LogError(this.logger, error as Error, this.findOne.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find a discount by ID and scope (type).
   * @param {number} id - The discount ID.
   * @param {DiscountScopeEnum} scope - The discount scope.
   * @returns {Promise<Discount>} The found discount.
   */
  async findOneByIdAndScope(
    id: number,
    scope: DiscountScopeEnum,
  ): Promise<Discount> {
    try {
      const discount = await this.findOneWithOptionsOrFail({
        where: { id, scope, status: Not(StatusEnum.DELETED) },
        relations: this.relations,
      });
      return discount;
    } catch (error: unknown) {
      LogError(this.logger, error as Error, this.findOneByIdAndScope.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find a discount by ID and verify business ownership based on scope.
   * @param {number} id - The discount ID.
   * @param {number} businessId - The business ID.
   * @returns {Promise<Discount>} The found discount.
   */
  async findOneAndVerifyOwnership(
    id: number,
    businessId: number,
  ): Promise<Discount> {
    const discount = await this.findOne(id);
    await this.verifyBusinessOwnership(discount, businessId);
    return discount;
  }

  /**
   * Verify that the business owns the discount based on its scope.
   * @param {Discount} discount - The discount to verify.
   * @param {number} businessId - The business ID.
   */
  async verifyBusinessOwnership(
    discount: Discount,
    businessId: number,
  ): Promise<void> {
    switch (discount.scope) {
      case DiscountScopeEnum.BUSINESS:
        if (Number(discount.idCreationBusiness) !== Number(businessId)) {
          LogError(
            this.logger,
            this.rList.notFound.message,
            this.verifyBusinessOwnership.name,
          );
          throw new ForbiddenException(this.rList.notFound);
        }
        break;
      case DiscountScopeEnum.CATALOG:
        if (!discount.idCatalog) {
          LogError(
            this.logger,
            this.rList.notFound.message,
            this.verifyBusinessOwnership.name,
          );
          throw new NotFoundException(this.rList.notFound);
        }
        await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(
          discount.idCatalog,
          businessId,
        );
        break;
      case DiscountScopeEnum.PRODUCT: {
        const discountProducts =
          await this.discountProductsGettersService.findAllByDiscountId(
            discount.id,
          );
        const firstProduct = discountProducts[0];
        if (!firstProduct) {
          LogError(
            this.logger,
            this.rList.notFound.message,
            this.verifyBusinessOwnership.name,
          );
          throw new NotFoundException(this.rList.notFound);
        }
        await this.productsGettersService.findOneByBusinessId(
          firstProduct.idProduct,
          businessId,
        );
        break;
      }
      default:
        LogError(
          this.logger,
          this.rList.notFound.message,
          this.verifyBusinessOwnership.name,
        );
        throw new ForbiddenException(this.rList.notFound);
    }
  }

  /**
   * Find all discounts belonging to a business, regardless of scope (business, catalog, product).
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<Discount[]>} Array of discounts.
   */
  async findAllByBusiness(idBusiness: number): Promise<Discount[]> {
    return await this.find({
      where: {
        idCreationBusiness: idBusiness,
        status: Not(StatusEnum.DELETED),
      },
      relations: this.relations,
      order: { creationDate: 'DESC' },
    });
  }

  /**
   * Find all discounts with scope = catalog for a given catalog.
   * @param {number} idCatalog - The catalog ID.
   * @returns {Promise<Discount[]>} Array of catalog-scope discounts.
   */
  async findAllByCatalog(idCatalog: number): Promise<Discount[]> {
    return await this.find({
      where: {
        idCatalog,
        scope: DiscountScopeEnum.CATALOG,
        status: Not(StatusEnum.DELETED),
      },
      relations: this.relations,
      order: { creationDate: 'DESC' },
    });
  }

  /**
   * Find all discounts by IDs.
   * @param {number[]} ids - The discount IDs.
   * @returns {Promise<Discount[]>} Array of discounts.
   */
  async findAllByIds(ids: number[]): Promise<Discount[]> {
    return await this.find({ where: { id: In(ids) } });
  }

  /**
   * Find all discounts with scope = catalog belonging to a business.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<Discount[]>} Array of catalog-scope discounts.
   */
  async findAllByScopeCatalog(idBusiness: number): Promise<Discount[]> {
    return await this.find({
      where: {
        idCreationBusiness: idBusiness,
        scope: DiscountScopeEnum.CATALOG,
        status: Not(StatusEnum.DELETED),
      },
      relations: this.relations,
      order: { creationDate: 'DESC' },
    });
  }

  /**
   * Find all discounts with scope = product belonging to a business.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<Discount[]>} Array of product-scope discounts.
   */
  async findAllByScopeProduct(idBusiness: number): Promise<Discount[]> {
    return await this.find({
      where: {
        idCreationBusiness: idBusiness,
        scope: DiscountScopeEnum.PRODUCT,
        status: Not(StatusEnum.DELETED),
      },
      relations: this.relations,
      order: { creationDate: 'DESC' },
    });
  }

  /**
   * Find discounts by scope with pagination.
   * Uses subquery for IDs so LIMIT applies to discounts, not joined rows (avoids fewer/duplicate results).
   * @param {DiscountScopeEnum} scope - The scope filter.
   * @param {number} idBusiness - The business ID.
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   * @returns {Promise<IPaginatedResult<Discount>>} Paginated result.
   */
  async findAllByScopePaginated(
    scope: DiscountScopeEnum,
    idBusiness: number,
    pagination: InfinityScrollInput,
  ): Promise<IPaginatedResult<Discount>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;
    const order = pagination.order || 'DESC';
    const orderBy = pagination.orderBy || 'creation_date';
    const baseWhere = () => {
      const qb = this.createQueryBuilder('d')
        .where('d.idCreationBusiness = :idBusiness', { idBusiness })
        .andWhere('d.status <> :status', { status: StatusEnum.DELETED });
      if (scope !== DiscountScopeEnum.BUSINESS) {
        qb.andWhere('d.scope = :scope', { scope });
      }
      return qb;
    };
    const [paginatedDiscounts, total] = await Promise.all([
      baseWhere()
        .select('d.id')
        .orderBy(`d.${orderBy}`, order)
        .limit(limit)
        .offset(skip)
        .getMany(),
      baseWhere().getCount(),
    ]);
    const ids = paginatedDiscounts.map((d) => d.id);
    if (ids.length === 0) return { items: [], total, page, limit };
    const items = await this.createQueryBuilder('d')
      .leftJoinAndSelect('d.currency', 'currency')
      .leftJoinAndSelect('d.business', 'business')
      .leftJoinAndSelect('business.image', 'businessImage')
      .leftJoinAndSelect('d.catalog', 'catalog')
      .leftJoinAndSelect('catalog.image', 'catalogImage')
      .leftJoinAndSelect('d.discountProducts', 'discountProducts')
      .leftJoinAndSelect(
        'discountProducts.product',
        'product',
        'product.status <> :status',
        { status: StatusEnum.DELETED },
      )
      .leftJoinAndSelect('product.productFiles', 'productFiles')
      .leftJoinAndSelect('productFiles.file', 'productFile')
      .where('d.id IN (:...ids)', { ids })
      .orderBy(`d.${orderBy}`, order)
      .getMany();
    return { items, total, page, limit };
  }

  /**
   * Find all ACTIVE discounts whose endDate has passed (now > endDate).
   * @returns {Promise<Discount[]>} Array of expired discounts ready to be removed.
   */
  async findAllActiveWithEndDatePassed(): Promise<Discount[]> {
    const now = new Date();
    return await this.find({
      where: {
        status: StatusEnum.ACTIVE,
        endDate: LessThan(now),
      },
    });
  }

  /**
   * Find all PENDING discounts whose startDate has been reached (now >= startDate).
   * @returns {Promise<Discount[]>} Array of pending discounts ready to be activated.
   */
  async findAllPendingWithStartDateReached(): Promise<Discount[]> {
    const now = new Date();
    return await this.find({
      where: {
        status: StatusEnum.PENDING,
        startDate: LessThanOrEqual(now),
      },
    });
  }

  /**
   * Find the active discount for a product (from discount_product table).
   * @param {number} idProduct - The product ID.
   * @returns {Promise<Discount | null>} The discount or null if none.
   */
  async findActiveDiscountByProduct(
    idProduct: number,
  ): Promise<Discount | null> {
    const discountProduct =
      await this.discountProductsGettersService.findByProductIdWithDiscount(
        idProduct,
      );
    if (!discountProduct?.discount) return null;
    const discount = discountProduct.discount;
    if (discount.status !== StatusEnum.ACTIVE) return null;
    const now = new Date();
    if (discount.startDate <= now && discount.endDate >= now) return discount;
    return null;
  }

  /**
   * Find audit history for a product.
   * @param {number} idProduct - The product ID.
   * @param {number} [limit=50] - Max records.
   * @returns {Promise<EntityAudit[]>} Array of audit records.
   */
  async findAuditByProduct(
    idProduct: number,
    limit: number = 50,
  ): Promise<EntityAudit[]> {
    return await this.entityAuditsGettersService.findByDiscountProductByProductId(
      idProduct,
      limit,
    );
  }

  /**
   * Discounts by lifecycle bucket for statistics.
   * Optional overlap on [startDate, endDate]; snapshot at period end (or now).
   * Optional limit caps rows (id ASC). Ignored when undefined or ≤ 0.
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<{ label: string; count: number }[]>} The discounts by status.
   */
  async getByStatusForStatistics(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<{ label: string; count: number }[]> {
    const qb = this.createDiscountStatisticsBaseQuery(idBusiness);
    this.attachDiscountStatisticsOverlapFilter(qb, startDate, endDate);
    qb.select([
      'd.id',
      'd.status',
      'd.startDate',
      'd.endDate',
      'd.isExpired',
    ]).orderBy('d.id', 'ASC');
    const discounts = await qb.getMany();
    const asOf = startDate && endDate ? new Date(endDate) : new Date();
    const buckets: Record<string, number> = {
      active: 0,
      pending: 0,
      expired: 0,
    };
    for (const d of discounts) {
      if (d.isExpired || new Date(d.endDate) < asOf) {
        buckets.expired++;
      } else if (new Date(d.startDate) > asOf) {
        buckets.pending++;
      } else {
        buckets.active++;
      }
    }
    return [
      { label: 'active', count: buckets.active },
      { label: 'pending', count: buckets.pending },
      { label: 'expired', count: buckets.expired },
    ];
  }

  /**
   * Discounts by type (same visibility, overlap, and row cap as by status).
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<{ label: string; count: number }[]>} The discounts by type.
   */
  async getByTypeForStatistics(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<{ label: string; count: number }[]> {
    const qb = this.createDiscountStatisticsBaseQuery(idBusiness);
    this.attachDiscountStatisticsOverlapFilter(qb, startDate, endDate);
    qb.select(['d.discountType']).orderBy('d.id', 'ASC');
    const rows = await qb.getMany();
    const map: Record<string, number> = {
      [DiscountTypeEnum.PERCENTAGE]: 0,
      [DiscountTypeEnum.FIXED]: 0,
    };
    for (const r of rows) {
      const t = r.discountType;
      if (t === DiscountTypeEnum.PERCENTAGE || t === DiscountTypeEnum.FIXED) {
        map[t]++;
      }
    }
    return [
      {
        label: DiscountTypeEnum.PERCENTAGE,
        count: map[DiscountTypeEnum.PERCENTAGE] ?? 0,
      },
      {
        label: DiscountTypeEnum.FIXED,
        count: map[DiscountTypeEnum.FIXED] ?? 0,
      },
    ];
  }

  /**
   * Among discounts **created** in `[startDate, endDate]`, counts those whose `end_date`
   * falls in that same window (inclusive) — campaigns created in the period that also
   * expire during it (“van a vencer” dentro del rango analizado).
   *
   * @param {number} idBusiness - The business ID.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   * @returns {Promise<ITimeSeriesStats>} Total matching discounts.
   */
  async getExpiringSoonStatsForStatistics(
    idBusiness: number,
    startDate: string,
    endDate: string,
  ): Promise<ITimeSeriesStats> {
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    const buildBase = (): SelectQueryBuilder<Discount> => {
      const qb = this.createDiscountStatisticsBaseQuery(idBusiness);
      qb.andWhere('d.creationDate >= :expRangeStart', {
        expRangeStart: rangeStart,
      }).andWhere('d.creationDate <= :expRangeEnd', { expRangeEnd: rangeEnd });
      return qb;
    };
    const discounts = await buildBase().getMany();

    const today = new Date();
    const d = today.getUTCDate();
    const m = today.getUTCMonth();
    const y = today.getUTCFullYear();
    const asOf = new Date(Date.UTC(y, m, d + 7, 23, 59, 59, 999));
    let total = 0;
    for (const d of discounts) {
      if (
        d.status === StatusEnum.ACTIVE &&
        new Date(d.endDate) <= asOf &&
        asOf >= new Date(d.startDate)
      ) {
        total++;
      }
    }

    return { total };
  }

  /**
   * Find audit history for a discount.
   * @param {number} idDiscount - The discount ID.
   * @param {number} [limit=50] - Max records.
   * @returns {Promise<EntityAudit[]>} Array of audit records.
   */
  async findAuditByDiscount(
    idDiscount: number,
    limit: number = 50,
  ): Promise<EntityAudit[]> {
    return await this.entityAuditsGettersService.findByDiscountProductByDiscountId(
      idDiscount,
      limit,
    );
  }

  /**
   * Loads start/end dates for lifecycle bucketing (admin global statistics).
   * @returns {Promise<Pick<Discount, 'startDate' | 'endDate'>[]>} Discount date ranges.
   */
  async findDiscountDateRangesForAdminStatistics(): Promise<
    Pick<Discount, 'startDate' | 'endDate'>[]
  > {
    return this.find({
      where: { status: Not(StatusEnum.DELETED) },
      select: ['startDate', 'endDate'],
    });
  }

  /**
   * Groups all non-deleted discounts by type (admin statistics).
   * @returns {Promise<IAdminLabeledCount[]>} Counts per discount type.
   */
  async getGlobalDiscountsByTypeForAdminStatistics(): Promise<
    IAdminLabeledCount[]
  > {
    const rows = await this.createQueryBuilder('d')
      .select('d.discount_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('d.status <> :status', { status: StatusEnum.DELETED })
      .groupBy('d.discount_type')
      .getRawMany<{ type: string; count: string }>();
    const map: Record<string, number> = {
      [DiscountTypeEnum.PERCENTAGE]: 0,
      [DiscountTypeEnum.FIXED]: 0,
    };
    for (const r of rows) {
      map[r.type] = parseInt(r.count ?? '0', 10);
    }
    return [
      {
        label: DiscountTypeEnum.PERCENTAGE,
        count: map[DiscountTypeEnum.PERCENTAGE] ?? 0,
      },
      {
        label: DiscountTypeEnum.FIXED,
        count: map[DiscountTypeEnum.FIXED] ?? 0,
      },
    ];
  }

  /**
   * Counts non-deleted discounts ending within the next `days` window (admin, global).
   * @param {number} days - Horizon in days.
   * @returns {Promise<number>} Count.
   */
  async getGlobalExpiringSoonDiscountCountForAdminStatistics(
    days: number,
  ): Promise<number> {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    return this.createQueryBuilder('d')
      .where('d.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('d.end_date >= :now', { now })
      .andWhere('d.end_date <= :future', { future })
      .getCount();
  }

  /**
   * Parses an inclusive `[rangeStart, rangeEnd]` on `end_date` from ISO bounds.
   * @param {string} [startDate] - Range start.
   * @param {string} [endDate] - Range end.
   * @returns {{ rangeStart: Date; rangeEnd: Date } | null} Null when missing or invalid.
   */
  private resolveExpiringSoonFilterWindow(
    startDate?: string,
    endDate?: string,
  ): { rangeStart: Date; rangeEnd: Date } | null {
    if (!startDate || !endDate) {
      return null;
    }
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    if (
      Number.isNaN(rangeStart.getTime()) ||
      Number.isNaN(rangeEnd.getTime()) ||
      rangeStart > rangeEnd
    ) {
      return null;
    }
    return { rangeStart, rangeEnd };
  }

  /**
   * Base QB for business discount statistics (expired soft-deletes included).
   * @param {number} idBusiness - Business id.
   * @returns {SelectQueryBuilder<Discount>} Alias `d`.
   */
  private createDiscountStatisticsBaseQuery(
    idBusiness: number,
  ): SelectQueryBuilder<Discount> {
    return this.createQueryBuilder('d')
      .where('d.idCreationBusiness = :idBusiness', { idBusiness })
      .andWhere(
        '(d.status <> :deletedStatus OR (d.status = :deletedStatus AND d.isExpired = :expiredTrue))',
        {
          deletedStatus: StatusEnum.DELETED,
          expiredTrue: true,
        },
      );
  }

  /**
   * Keeps discounts whose campaign interval intersects the given period.
   * @param {SelectQueryBuilder<Discount>} queryBuilder - Alias `d`.
   * @param {string} startDate - The start date of the time period.
   * @param {string} endDate - The end date of the time period.
   */
  private attachDiscountStatisticsOverlapFilter(
    queryBuilder: SelectQueryBuilder<Discount>,
    startDate: string,
    endDate: string,
  ): void {
    if (startDate && endDate) {
      queryBuilder
        .andWhere('d.creationDate <= :rangeEnd', { rangeEnd: endDate })
        .andWhere('d.creationDate >= :rangeStart', {
          rangeStart: startDate,
        });
    }
  }
}
