import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { stockMovementsResponses } from '../../common/responses';
import { ITimePeriodFilter } from '../../common/interfaces';
import { IStockMovementStatItem } from './interfaces/stock-movement-stat-item.interface';
import { StockMovement } from '../../entities';
import { StockMovementTypeEnum } from '../../common/enums/stock-movement-type.enum';
import { ITimeSeriesStats } from '../business-statistics/interfaces/business-visits-stats.interface';

/** Physical `creation_date` column for alias `sm`. */
const SM_CREATION = '"sm"."creation_date"';

/**
 * Read-only service for querying stock movements.
 */
@Injectable()
export class StockMovementsGettersService extends BasicService<StockMovement> {
  private readonly logger = new Logger(StockMovementsGettersService.name);
  private readonly rList = stockMovementsResponses.list;
  private readonly relations = ['productSku', 'business'];

  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {
    super(stockMovementRepository);
  }

  /**
   * Inclusive local-calendar bounds (server TZ) for ISO start/end.
   * @param {string} startIso - Range start.
   * @param {string} endIso - Range end.
   * @returns {{ start: Date; end: Date }} Bounds for the driver.
   */
  private boundsToLocalCalendarInclusive(
    startIso: string,
    endIso: string,
  ): { start: Date; end: Date } {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const start = new Date(
      s.getFullYear(),
      s.getMonth(),
      s.getDate(),
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      e.getFullYear(),
      e.getMonth(),
      e.getDate(),
      23,
      59,
      59,
      999,
    );
    return { start, end };
  }

  /**
   * Appends inclusive `creation_date` range when both bounds exist.
   * @param {SelectQueryBuilder<StockMovement>} qb - Builder with alias `sm`.
   * @param {ITimePeriodFilter} [timePeriod] - Optional range.
   */
  private appendCreationDateRange(
    qb: SelectQueryBuilder<StockMovement>,
    timePeriod?: ITimePeriodFilter,
  ): void {
    if (!timePeriod?.startDate || !timePeriod?.endDate) {
      return;
    }
    const { start, end } = this.boundsToLocalCalendarInclusive(
      timePeriod.startDate,
      timePeriod.endDate,
    );
    qb.andWhere(
      `${SM_CREATION} >= :smRangeStart AND ${SM_CREATION} <= :smRangeEnd`,
      { smRangeStart: start, smRangeEnd: end },
    );
  }

  /**
   * Find a stock movement by ID.
   * @param {number} id - The stock movement ID.
   * @returns {Promise<StockMovement>} The found stock movement.
   */
  async findOne(id: number): Promise<StockMovement> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id },
        relations: this.relations,
      });
    } catch (error) {
      LogError(this.logger, error, this.findOne.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find all stock movements for a product SKU.
   * @param {number} idProductSku - The product SKU ID.
   * @param {number} limit - Max records to return.
   * @returns {Promise<StockMovement[]>} Array of stock movements.
   */
  async findAllByProductSku(
    idProductSku: number,
    limit: number = 50,
  ): Promise<StockMovement[]> {
    return await this.createQueryBuilder('sm')
      .leftJoinAndSelect('sm.productSku', 'productSku')
      .leftJoinAndSelect('sm.business', 'business')
      .where('sm.idProductSku = :idProductSku', { idProductSku })
      .orderBy('sm.creationDate', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Find all stock movements for a business.
   * @param {number} idBusiness - The business ID.
   * @param {number} limit - Max records to return.
   * @param {number} offset - Offset for pagination.
   * @returns {Promise<StockMovement[]>} Array of stock movements.
   */
  async findAllByBusiness(
    idBusiness: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<StockMovement[]> {
    return await this.createQueryBuilder('sm')
      .leftJoinAndSelect('sm.productSku', 'productSku')
      .leftJoinAndSelect('sm.business', 'business')
      .where('sm.idCreationBusiness = :idBusiness', { idBusiness })
      .orderBy('sm.creationDate', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  /**
   * Count stock movements for a business.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number>} Total count.
   */
  async countByBusiness(idBusiness: number): Promise<number> {
    return await this.createQueryBuilder('sm')
      .where('sm.idCreationBusiness = :idBusiness', { idBusiness })
      .getCount();
  }

  /**
   * Get recent stock movements for statistics.
   *
   * @param {number} idBusiness - The business ID.
   * @param {number} limit - The limit of the recent stock movements.
   * @returns {Promise<IStockMovementStatItem[]>} The recent stock movements.
   */
  async getRecentForStatistics(
    idBusiness: number,
    limit: number = 20,
  ): Promise<IStockMovementStatItem[]> {
    const list = await this.createQueryBuilder('sm')
      .leftJoinAndSelect('sm.productSku', 'productSku')
      .leftJoinAndSelect('productSku.product', 'product')
      .where('sm.id_creation_business = :idBusiness', { idBusiness })
      .orderBy('sm.creation_date', 'DESC')
      .limit(limit)
      .getMany();
    return list.map((sm) => ({
      id: sm.id,
      type: sm.type,
      quantityDelta: sm.quantityDelta,
      creationDate: sm.creationDate,
    }));
  }

  /**
   * Get SALE movement count for statistics in the date range (total only).
   *
   * @param {number} idBusiness - The business ID.
   * @param {ITimePeriodFilter} timePeriod - inclusive range (`granularity` ignored).
   * @returns {Promise<ITimeSeriesStats>} Total sales movements in range.
   */
  async getSalesCountForStatistics(
    idBusiness: number,
    timePeriod: ITimePeriodFilter,
  ): Promise<ITimeSeriesStats> {
    const qb = this.createQueryBuilder('sm')
      .where('sm.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('sm.type = :type', { type: StockMovementTypeEnum.SALE });
    this.appendCreationDateRange(qb, timePeriod);
    const total = await qb.getCount();
    return { total };
  }
}
