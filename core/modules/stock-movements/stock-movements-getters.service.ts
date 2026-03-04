import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { stockMovementsResponses } from '../../common/responses';
import { StockMovement } from '../../entities';

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
        limit = 50,
    ): Promise<StockMovement[]> {
        return await this.stockMovementRepository.find({
            where: { idProductSku },
            relations: this.relations,
            order: { creationDate: 'DESC' },
            take: limit,
        });
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
        limit = 50,
        offset = 0,
    ): Promise<StockMovement[]> {
        return await this.stockMovementRepository.find({
            where: { idCreationBusiness: idBusiness },
            relations: this.relations,
            order: { creationDate: 'DESC' },
            take: limit,
            skip: offset,
        });
    }

    /**
     * Count stock movements for a business.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<number>} Total count.
     */
    async countByBusiness(idBusiness: number): Promise<number> {
        return await this.stockMovementRepository.count({
            where: { idCreationBusiness: idBusiness },
        });
    }
}
