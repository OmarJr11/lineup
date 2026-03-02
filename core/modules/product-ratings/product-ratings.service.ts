import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IUserReq } from '../../common/interfaces';
import { ProductRating } from '../../entities';
import { ProductRatingsGettersService } from './product-ratings-getters.service';
import { ProductRatingsSettersService } from './product-ratings-setters.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { RateProductInput } from './dto/rate-product.input';
import { ICreateProductRating } from '../../common/interfaces';
import { QueueNamesEnum, ReviewsConsumerEnum } from '../../common/enums';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * Orchestrating service for product rating operations.
 * Handles creation and update of ratings, and keeps the product's
 * ratingAverage column in sync after every change.
 */
@Injectable()
export class ProductRatingsService extends BasicService<ProductRating> {
    private readonly logger = new Logger(ProductRatingsService.name);

    constructor(
        @Inject(REQUEST)
        private readonly userRequest: Request,
        @InjectRepository(ProductRating)
        private readonly productRatingRepository: Repository<ProductRating>,
        private readonly productRatingsGettersService: ProductRatingsGettersService,
        private readonly productRatingsSettersService: ProductRatingsSettersService,
        private readonly productsGettersService: ProductsGettersService,
        @InjectQueue(QueueNamesEnum.reviews)
        private readonly Queue: Queue,
    ) {
        super(productRatingRepository, userRequest);
    }

    /**
     * Rate a product. Creates a new rating if the user has not rated the product
     * before, or updates the existing one. Recalculates and persists the product's
     * average rating after every change.
     * @param {RateProductInput} input - The rating data from the client.
     * @param {IUserReq} userReq - The authenticated user.
     * @returns {Promise<ProductRating>} The created or updated rating with relations.
     */
    @Transactional()
    async rateProduct(input: RateProductInput, userReq: IUserReq): Promise<ProductRating> {
        await this.productsGettersService.findOne(input.idProduct);
        const existingRating = await this.productRatingsGettersService
            .findOneByProductAndUser(input.idProduct, userReq.userId);
        const rating = existingRating
            ? await this.updateExistingRating(existingRating, input, userReq)
            : await this.createNewRating(input, userReq);
        await this.syncProductRatingAverage(input.idProduct, userReq);
        return await this.productRatingsGettersService.findOne(rating.id);
    }

    /**
     * Create a new rating record.
     * @param {RateProductInput} input - Rating input data.
     * @param {IUserReq} userReq - The authenticated user.
     * @returns {Promise<ProductRating>} The newly created rating.
     */
    private async createNewRating(
        input: RateProductInput,
        userReq: IUserReq,
    ): Promise<ProductRating> {
        const data: ICreateProductRating = {
            idProduct: input.idProduct,
            idCreationUser: userReq.userId,
            stars: input.stars,
            comment: input.comment,
        };
        return await this.productRatingsSettersService.create(data, userReq);
    }

    /**
     * Update an existing rating record with new stars and/or comment.
     * @param {ProductRating} rating - The existing rating entity.
     * @param {RateProductInput} input - New rating data.
     * @param {IUserReq} userReq - The authenticated user.
     * @returns {Promise<ProductRating>} The updated rating.
     */
    private async updateExistingRating(
        rating: ProductRating,
        input: RateProductInput,
        userReq: IUserReq,
    ): Promise<ProductRating> {
        return await this.productRatingsSettersService.update(
            rating,
            { stars: input.stars, comment: input.comment },
            userReq,
        );
    }

    /**
     * Recompute the average rating for a product and persist it.
     * @param {number} idProduct - The product ID.
     * @param {IUserReq} user - The authenticated user.
     */
    private async syncProductRatingAverage(idProduct: number, user: IUserReq): Promise<void> {
        await this.Queue.add(
            ReviewsConsumerEnum.CalculateAverage,
            { idProduct, user }
        )
    }
}
