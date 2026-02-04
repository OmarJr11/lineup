import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ProductReaction } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productReactionsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ICreateProductReaction, IUpdateProductReaction } from './interfaces/create-product-reaction.interface';

@Injectable()
export class ProductReactionsSettersService extends BasicService<ProductReaction> {
    private logger = new Logger(ProductReactionsSettersService.name);
    private readonly rLike = productReactionsResponses.like;
    private readonly rUnlike = productReactionsResponses.unlike;

    constructor(
      @InjectRepository(ProductReaction)
      private readonly productReactionRepository: Repository<ProductReaction>,
    ) {
      super(productReactionRepository);
    }

    /**
     * Create a new product reaction (like).
     * @param {ICreateProductReaction} data - The data for the new product reaction.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<ProductReaction>} The created product reaction.
     */
    @Transactional()
    async create(
        data: ICreateProductReaction,
        userReq: IUserReq
    ): Promise<ProductReaction> {
      try {
        return await this.save(data, userReq);
      } catch (error) {
        LogError(this.logger, error, this.create.name, userReq);
        throw new InternalServerErrorException(this.rLike.error);
      }
    }

    /**
     * Update a product reaction.
     * @param {ProductReaction} productReaction - The product reaction to update.
     * @param {IUpdateProductReaction} data - The data for updating the product reaction.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<ProductReaction>} The updated product reaction.
     */
    @Transactional()
    async update(
        productReaction: ProductReaction,
        data: IUpdateProductReaction,
        userReq: IUserReq
    ): Promise<ProductReaction> {
      try {
        return await this.updateEntity(data, productReaction, userReq);
      } catch (error) {
        LogError(this.logger, error, this.update.name, userReq);
        throw new InternalServerErrorException(this.rLike.error);
      }
    }

    /**
     * Remove a product reaction (unlike).
     * @param {ProductReaction} productReaction - The product reaction to remove.
     * @param {IUserReq} userReq - The user request object.
     */
    @Transactional()
    async remove(productReaction: ProductReaction, userReq: IUserReq) {
      try {
        return await this.deleteEntity(productReaction, { data: userReq});
      } catch (error) {
        LogError(this.logger, error, this.remove.name, userReq);
        throw new InternalServerErrorException(this.rUnlike.error);
      }
    }
}
