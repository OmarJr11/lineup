import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BasicService } from '../../common/services';
import { Currency } from '../../entities';
import { Repository } from 'typeorm';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { currenciesResponses } from '../../common/responses';
import { CreateCurrencyInput } from './dto/create-currency.input';
import { UpdateCurrencyInput } from './dto/update-currency.input';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class CurrenciesSettersService extends BasicService<Currency> {
    private logger = new Logger(CurrenciesSettersService.name);
    private readonly rCreate = currenciesResponses.create;
    private readonly rUpdate = currenciesResponses.update;
    private readonly rDelete = currenciesResponses.delete;

    constructor(
        @InjectRepository(Currency)
        private readonly currencyRepository: Repository<Currency>,
    ) {
        super(currencyRepository);
    }

    /**
     * Create Currency
     * @param {CreateCurrencyInput} data - Data to create a currency
     * @param {IUserReq} userReq - The user request object
     * @returns {Promise<Currency>}
     */
    @Transactional()
    async create(data: CreateCurrencyInput, userReq: IUserReq): Promise<Currency> {
        try {
            return await this.save(data, userReq);
        } catch (error) {
            LogError(this.logger, error, this.create.name, userReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }

    /**
     * Update Currency
     * @param {UpdateCurrencyInput} data - Data to update the currency
     * @param {Currency} currency - The currency entity to update
     * @param {IUserReq} userReq - The user request object
     * @returns {Promise<Currency>}
     */
    @Transactional()
    async update(
        data: UpdateCurrencyInput,
        currency: Currency,
        userReq: IUserReq,
    ): Promise<Currency> {
        try {
            return await this.updateEntity(data, currency, userReq);
        } catch (error) {
            LogError(this.logger, error, this.update.name, userReq);
            throw new InternalServerErrorException(this.rUpdate.error);
        }
    }

    /**
     * Remove Currency (soft delete)
     * @param {Currency} currency - The currency entity to remove
     * @param {IUserReq} userReq - The user request object
     */
    @Transactional()
    async remove(currency: Currency, userReq: IUserReq): Promise<void> {
        try {
            await this.deleteEntityByStatus(currency, userReq);
        } catch (error) {
            LogError(this.logger, error, this.remove.name, userReq);
            throw new InternalServerErrorException(this.rDelete.error);
        }
    }
}
