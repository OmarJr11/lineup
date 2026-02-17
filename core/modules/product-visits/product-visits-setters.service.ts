import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { ProductVisit } from '../../entities';
import { ICreateProductVisit } from './interfaces/create-product-visit.interface';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { visitsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductsSettersService } from '../products/products-setters.service';

/**
 * Service that handles creating product visit records.
 */
@Injectable()
export class ProductVisitsSettersService extends BasicService<ProductVisit> {
    private readonly logger = new Logger(ProductVisitsSettersService.name);
    private readonly rCreate = visitsResponses.create;

    constructor(
        @InjectRepository(ProductVisit)
        private readonly productVisitRepository: Repository<ProductVisit>,
        private readonly productsGettersService: ProductsGettersService,
        private readonly productsSettersService: ProductsSettersService
    ) {
        super(productVisitRepository);
    }

    /**
     * Records a visit to a product.
     * @param {ICreateProductVisit} data - The visit data.
     * @param {IUserReq | null} user - The logged-in user, or null for anonymous.
     */
    @Transactional()
    async create(
        data: ICreateProductVisit,
        user: IUserReq | null
    ) {
        const product = await this.productsGettersService.findOne(data.idProduct);
        try {
            const visitData = {
                idProduct: data.idProduct,
                idCreationUser: user?.userId ?? undefined
            }
            await this.save(visitData, user);
            await this.productsSettersService.incrementVisits(product);
        } catch (error) {
            LogError(this.logger, error, this.create.name, user);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }
}
