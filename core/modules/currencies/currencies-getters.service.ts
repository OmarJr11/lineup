import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { Currency } from '../../entities';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { currenciesResponses } from '../../common/responses';

@Injectable()
export class CurrenciesGettersService extends BasicService<Currency> {
    private logger = new Logger(CurrenciesGettersService.name);
    private readonly rList = currenciesResponses.list;

    constructor(
        @InjectRepository(Currency)
        private readonly currencyRepository: Repository<Currency>,
    ) {
        super(currencyRepository);
    }

    /**
     * Find Currency by id
     * @param {number} id - Currency ID
     * @returns {Promise<Currency>}
     */
    async findById(id: number): Promise<Currency> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { id, status: Not(StatusEnum.DELETED) },
            });
        } catch (error) {
            LogError(this.logger, error, this.findById.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find Currency by code
     * @param {string} code - Currency code
     * @returns {Promise<Currency>}
     */
    async findByCode(code: string): Promise<Currency> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { code, status: Not(StatusEnum.DELETED) },
            });
        } catch (error) {
            LogError(this.logger, error, this.findByCode.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find all Currencies
     * @returns {Promise<Currency[]>}
     */
    async findAll(): Promise<Currency[]> {
        try {
            return await this.find({
                where: { status: Not(StatusEnum.DELETED) },
            });
        } catch (error) {
            LogError(this.logger, error, this.findAll.name);
            throw new NotFoundException(this.rList.error);
        }
    }
}
