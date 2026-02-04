import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum, ReactionTypeEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productReactionsResponses } from '../../common/responses';
import { ProductReaction } from '../../entities';

@Injectable()
export class ProductReactionsGettersService extends BasicService<ProductReaction> {
    private logger = new Logger(ProductReactionsGettersService.name);
    private readonly rList = productReactionsResponses.list;

    constructor(
      @InjectRepository(ProductReaction)
      private readonly productReactionRepository: Repository<ProductReaction>,
    ) {
      super(productReactionRepository);
    }

    /**
     * Find a product reaction by ID.
     * @param {number} id - The product reaction ID.
     * @returns {Promise<ProductReaction>} The found product reaction or null.
     */
    async findOne(id: number): Promise<ProductReaction> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: ['product', 'creationUser']
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a product reaction by product ID, type, and user ID.
     * @param {number} idProduct - The product ID.
     * @param {ReactionTypeEnum} type - The reaction type.
     * @param {number} idCreationUser - The user ID.
     * @returns {Promise<ProductReaction | null>} The found product reaction or null.
     */
    async findOneByProductAndUser(
        idProduct: number,
        type: ReactionTypeEnum,
        idCreationUser: number
    ): Promise<ProductReaction | null> {
        try {
            return await this.findOneWithOptions({
                where: {
                    idProduct,
                    type,
                    idCreationUser,
                    status: Not(StatusEnum.DELETED)
                },
                relations: ['product', 'creationUser']
            });
        } catch (error) {
            LogError(this.logger, error, this.findOneByProductAndUser.name);
            return null;
        }
    }

    /**
     * Get all product reactions by product ID.
     * @param {number} idProduct - The product ID.
     * @returns {Promise<ProductReaction[]>} Array of product reactions.
     */
    async findAllByProduct(idProduct: number): Promise<ProductReaction[]> {
        try {
            return await this.find({
                where: { idProduct, status: Not(StatusEnum.DELETED) },
                relations: ['creationUser']
            });
        } catch (error) {
            LogError(this.logger, error, this.findAllByProduct.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Count reactions by product ID and type.
     * @param {number} idProduct - The product ID.
     * @param {ReactionTypeEnum} type - The reaction type.
     * @returns {Promise<number>} The count of reactions.
     */
    async countByProductAndType(
        idProduct: number,
        type: ReactionTypeEnum
    ): Promise<number> {
        try {
            return await this.createQueryBuilder('pr')
                .where('pr.idProduct = :idProduct', { idProduct })
                .andWhere('pr.type = :type', { type })
                .andWhere('pr.status <> :status', { status: StatusEnum.DELETED })
                .getCount();
        } catch (error) {
            LogError(this.logger, error, this.countByProductAndType.name);
            return 0;
        }
    }
}
