import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productRatingsResponses } from '../../common/responses';
import { ProductRating } from '../../entities';
import { ICreateProductRating, IUpdateProductRating } from '../../common/interfaces';

/**
 * Write service responsible for persisting product rating records.
 */
@Injectable()
export class ProductRatingsSettersService extends BasicService<ProductRating> {
    private readonly logger = new Logger(ProductRatingsSettersService.name);
    private readonly rRate = productRatingsResponses.rate;

    constructor(
        @InjectRepository(ProductRating)
        private readonly productRatingRepository: Repository<ProductRating>,
    ) {
        super(productRatingRepository);
    }

    /**
     * Persist a new product rating.
     * @param {ICreateProductRating} data - The rating data.
     * @param {IUserReq} userReq - The authenticated user.
     * @returns {Promise<ProductRating>} The created rating.
     */
    @Transactional()
    async create(data: ICreateProductRating, userReq: IUserReq): Promise<ProductRating> {
        try {
            return await this.save(data, userReq);
        } catch (error) {
            LogError(this.logger, error, this.create.name, userReq);
            throw new InternalServerErrorException(this.rRate.error);
        }
    }

    /**
     * Update an existing product rating.
     * @param {ProductRating} rating - The rating entity to update.
     * @param {IUpdateProductRating} data - Fields to update.
     * @param {IUserReq} userReq - The authenticated user.
     * @returns {Promise<ProductRating>} The updated rating.
     */
    @Transactional()
    async update(
        rating: ProductRating,
        data: IUpdateProductRating,
        userReq: IUserReq,
    ): Promise<ProductRating> {
        try {
            return await this.updateEntity(data, rating, userReq);
        } catch (error) {
            LogError(this.logger, error, this.update.name, userReq);
            throw new InternalServerErrorException(this.rRate.error);
        }
    }
}
