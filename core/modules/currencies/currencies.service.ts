import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { Currency } from '../../entities';
import { Repository } from 'typeorm';
import { CurrenciesGettersService } from './currencies-getters.service';
import { CurrenciesSettersService } from './currencies-setters.service';
import { CreateCurrencyInput } from './dto/create-currency.input';
import { UpdateCurrencyInput } from './dto/update-currency.input';
import { IUserReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class CurrenciesService extends BasicService<Currency> {
    private logger = new Logger(CurrenciesService.name);

    constructor(
        @Inject(REQUEST) private readonly req: Request,
        @InjectRepository(Currency) private readonly currencyRepository: Repository<Currency>,
        private readonly currenciesGettersService: CurrenciesGettersService,
        private readonly currenciesSettersService: CurrenciesSettersService,
    ) {
        super(currencyRepository, req);
    }

    /**
     * Create Currency
     * @param {CreateCurrencyInput} data - Data to create a currency
     * @param {IUserReq} userReq - The user request object
     * @returns {Promise<Currency>}
     */
    @Transactional()
    async create(data: CreateCurrencyInput, userReq: IUserReq): Promise<Currency> {
        const currency = await this.currenciesSettersService.create(data, userReq);
        return await this.currenciesGettersService.findById(currency.id);
    }

    /**
     * Find Currency by id
     * @param {number} id - Currency ID
     * @returns {Promise<Currency>}
     */
    async findById(id: number): Promise<Currency> {
        return await this.currenciesGettersService.findById(id);
    }

    /**
     * Find Currency by code
     * @param {string} code - Currency code
     * @returns {Promise<Currency>}
     */
    async findByCode(code: string): Promise<Currency> {
        return await this.currenciesGettersService.findByCode(code);
    }

    /**
     * Find all Currencies
     * @returns {Promise<Currency[]>}
     */
    async findAll(): Promise<Currency[]> {
        return await this.currenciesGettersService.findAll();
    }

    /**
     * Update Currency
     * @param {UpdateCurrencyInput} data - Data to update the currency
     * @param {IUserReq} userReq - The user request object
     * @returns {Promise<Currency>}
     */
    @Transactional()
    async update(data: UpdateCurrencyInput, userReq: IUserReq): Promise<Currency> {
        const currency = await this.currenciesGettersService.findById(data.id);
        await this.currenciesSettersService.update(data, currency, userReq);
        return await this.currenciesGettersService.findById(currency.id);
    }

    /**
     * Remove Currency (soft delete)
     * @param {number} id - Currency ID
     * @param {IUserReq} userReq - The user request object
     * @returns {Promise<boolean>}
     */
    @Transactional()
    async remove(id: number, userReq: IUserReq): Promise<boolean> {
        const currency = await this.currenciesGettersService.findById(id);
        await this.currenciesSettersService.remove(currency, userReq);
        return true;
    }
}
