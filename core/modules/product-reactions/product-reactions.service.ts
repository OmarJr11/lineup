import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { ProductReaction, Product } from '../../entities';
import { Repository } from 'typeorm';
import { ProductReactionsGettersService } from './product-reactions-getters.service';
import { ProductReactionsSettersService } from './product-reactions-setters.service';
import { IUserReq } from '../../common/interfaces';
import { ReactionTypeEnum } from '../../common/enums';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductsGettersService } from '../products/products-getters.service';
import { ProductsSettersService } from '../products/products-setters.service';
import { ICreateProductReaction } from './interfaces/create-product-reaction.interface';

@Injectable()
export class ProductReactionsService extends BasicService<ProductReaction> {
    private logger = new Logger(ProductReactionsService.name);
    
    constructor(
      @Inject(REQUEST)
      private readonly userRequest: Request,
      @InjectRepository(ProductReaction)
      private readonly productReactionRepository: Repository<ProductReaction>,
      private readonly productReactionsGettersService: ProductReactionsGettersService,
      private readonly productReactionsSettersService: ProductReactionsSettersService,
      private readonly productsGettersService: ProductsGettersService,
      private readonly productsSettersService: ProductsSettersService
    ) {
      super(productReactionRepository, userRequest);
    }

    /**
     * Add a like to a product.
     * @param {number} idProduct - The product ID.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<ProductReaction>} The created product reaction.
     */
    @Transactional()
    async likeProduct(idProduct: number, userReq: IUserReq): Promise<ProductReaction> {
        const product = await this.productsGettersService.findOne(idProduct);
        const existingReaction = await this.productReactionsGettersService
            .findOneByProductAndUser(idProduct, ReactionTypeEnum.LIKE, userReq.userId);
        if (existingReaction) return existingReaction;
        const data: ICreateProductReaction = {
            idProduct,
            type: ReactionTypeEnum.LIKE,
            idCreationUser: userReq.userId
        };
        const reaction = await this.productReactionsSettersService.create(data, userReq);
        this.incrementProductLikes(product, userReq);
        return await this.productReactionsGettersService.findOne(reaction.id);
    }

    /**
     * Remove a like from a product.
     * @param {number} idProduct - The product ID.
     * @param {IUserReq} userReq - The user request object.
     * @returns {Promise<boolean>} True if the like was removed successfully.
     */
    @Transactional()
    async unlikeProduct(
        idProduct: number,
        userReq: IUserReq
    ): Promise<boolean> {
        const product = await this.productsGettersService.findOne(idProduct);
        const existingReaction = await this.productReactionsGettersService
            .findOneByProductAndUser(idProduct, ReactionTypeEnum.LIKE, userReq.userId);
        if (!existingReaction) return true;
        await this.productReactionsSettersService.remove(existingReaction, userReq);
        this.decrementProductLikes(product, userReq);
        return true;
    }

    /**
     * Increment the likes count on a product.
     * @param {Product} product - The product.
     * @param {IUserReq} userReq - The user request object.
     */
    private async incrementProductLikes(product: Product, userReq: IUserReq){
        await this.productsSettersService.incrementLikes(product, userReq);
    }

    /**
     * Decrement the likes count on a product.
     * @param {Product} product - The product.
     * @param {IUserReq} userReq - The user request object.
     */
    private async decrementProductLikes(product: Product, userReq: IUserReq) {
        await this.productsSettersService.decrementLikes(product, userReq);
    }
}
