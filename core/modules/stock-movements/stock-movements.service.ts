import { Injectable } from '@nestjs/common';
import { StockMovement } from '../../entities';
import { StockMovementsGettersService } from './stock-movements-getters.service';
import { StockMovementsSettersService } from './stock-movements-setters.service';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';
import { IBusinessReq } from '../../common/interfaces';

/**
 * Orchestrating service for stock movement operations.
 */
@Injectable()
export class StockMovementsService {
  constructor(
    private readonly stockMovementsGettersService: StockMovementsGettersService,
    private readonly stockMovementsSettersService: StockMovementsSettersService,
  ) {}

  /**
   * Create a stock movement record.
   * @param {CreateStockMovementInput} data - The movement data.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<StockMovement>} The created stock movement.
   */
  async create(
    data: CreateStockMovementInput,
    businessReq: IBusinessReq,
  ): Promise<StockMovement> {
    return await this.stockMovementsSettersService.create(data, businessReq);
  }

  /**
   * Find stock movements by product SKU.
   * @param {number} idProductSku - The product SKU ID.
   * @param {number} limit - Max records.
   * @returns {Promise<StockMovement[]>} Array of stock movements.
   */
  async findAllByProductSku(
    idProductSku: number,
    limit = 50,
  ): Promise<StockMovement[]> {
    return await this.stockMovementsGettersService.findAllByProductSku(
      idProductSku,
      limit,
    );
  }

  /**
   * Find stock movements by business.
   * @param {number} idBusiness - The business ID.
   * @param {number} limit - Max records.
   * @param {number} offset - Offset for pagination.
   * @returns {Promise<StockMovement[]>} Array of stock movements.
   */
  async findAllByBusiness(
    idBusiness: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<StockMovement[]> {
    return await this.stockMovementsGettersService.findAllByBusiness(
      idBusiness,
      limit,
      offset,
    );
  }

  /**
   * Count stock movements for a business.
   * @param {number} idBusiness - The business ID.
   * @returns {Promise<number>} Total count.
   */
  async countByBusiness(idBusiness: number): Promise<number> {
    return await this.stockMovementsGettersService.countByBusiness(idBusiness);
  }
}
