import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { stockMovementsResponses } from '../../common/responses';
import { StockMovement } from '../../entities';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';

/**
 * Write service responsible for persisting stock movement records.
 */
@Injectable()
export class StockMovementsSettersService extends BasicService<StockMovement> {
  private readonly logger = new Logger(StockMovementsSettersService.name);
  private readonly rCreate = stockMovementsResponses.create;

  constructor(
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
  ) {
    super(stockMovementRepository);
  }

  /**
   * Create a new stock movement record.
   * @param {CreateStockMovementInput} data - The movement data.
   * @param {IBusinessReq} businessReq - The business request object.
   * @returns {Promise<StockMovement>} The created stock movement.
   */
  @Transactional()
  async create(
    data: CreateStockMovementInput,
    businessReq: IBusinessReq,
  ): Promise<StockMovement> {
    try {
      const payload = {
        ...data,
        idCreationBusiness: businessReq.businessId,
      };
      return await this.save(payload, businessReq);
    } catch (error) {
      LogError(this.logger, error as Error, this.create.name, businessReq);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }
}
