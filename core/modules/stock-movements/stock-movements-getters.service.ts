import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { stockMovementsResponses } from '../../common/responses';
import { ITimePeriodFilter } from '../../common/interfaces';
import { IStockMovementStatItem } from './interfaces/stock-movement-stat-item.interface';
import { StatisticsQueryHelper } from '../../common/helpers/statistics-query.helper';
import { StockMovement } from '../../entities';
import { StockMovementTypeEnum } from '../../common/enums/stock-movement-type.enum';

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
   * Get sales count for statistics (total or time-series).
   *
   * @param {number} idBusiness - The business ID.
   * @param {TimePeriodInput} [timePeriod] - The time period filter.
   * @returns {Promise<ITimeSeriesStats>} The sales count.
   */
  async getSalesCountForStatistics(
    idBusiness: number,
    timePeriod?: ITimePeriodFilter,
  ): Promise<{ total: number; data?: { period: string; value: number }[] }> {
    const qb = this.createQueryBuilder('sm')
      .where('sm.id_creation_business = :idBusiness', { idBusiness })
      .andWhere('sm.type = :type', { type: StockMovementTypeEnum.SALE });
    StatisticsQueryHelper.applyTimeFilter(qb, 'sm', timePeriod);
    if (StatisticsQueryHelper.shouldGroupByTime(timePeriod)) {
      const data = await StatisticsQueryHelper.getTimeSeriesFromQuery(
        qb as any,
        'sm',
        timePeriod,
      );
      const total = data.reduce((sum, d) => sum + d.value, 0);
      return { total, data };
    }
    const total = await qb.getCount();
    return { total };
  }
}
