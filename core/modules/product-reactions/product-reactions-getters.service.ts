import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum, ReactionTypeEnum } from '../../common/enums';
import { InfinityScrollInput } from '../../common/dtos';
import { LogError } from '../../common/helpers/logger.helper';
import { productReactionsResponses } from '../../common/responses';
import { Product, ProductReaction } from '../../entities';

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
     * Get all products liked by a user with pagination (infinite scroll).
     * @param {number} idCreationUser - The user ID.
     * @param {InfinityScrollInput} pagination - Pagination parameters.
     * @returns {Promise<Product[]>} Array of products the user has liked.
     */
    async findAllLikedByUserPaginated(
        idCreationUser: number,
        pagination: InfinityScrollInput
    ): Promise<Product[]> {
        try {
            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const skip = (page - 1) * limit;
            const order = pagination.order || 'DESC';
            const orderBy = pagination.orderBy || 'creation_date';
            const reactions = await this.createQueryBuilder('pr')
                .leftJoinAndSelect('pr.product', 'product')
                .leftJoinAndSelect(
                    'product.productFiles',
                    'productFiles',
                    'productFiles.status <> :statusProductFile',
                    { statusProductFile: StatusEnum.DELETED }
                )
                .leftJoinAndSelect('productFiles.file', 'file')
                .leftJoinAndSelect('product.skus', 'skus', 'skus.status <> :statusSkus', { statusSkus: StatusEnum.DELETED })
                .leftJoinAndSelect('skus.currency', 'currency')
                .leftJoinAndSelect(
                    'product.reactions',
                    'reactions',
                    'reactions.status <> :statusReaction',
                    { statusReaction: StatusEnum.DELETED }
                )
                .leftJoinAndSelect('product.catalog', 'catalog')
                .leftJoinAndSelect('catalog.image', 'catalogImage')
                .leftJoinAndSelect('product.business', 'business')
                .leftJoinAndSelect('business.image', 'businessImage')
                .leftJoinAndSelect('product.discountProduct', 'discountProduct')
                .leftJoinAndSelect(
                    'discountProduct.discount',
                    'discount',
                    'discount.status = :statusDiscount', { statusDiscount: StatusEnum.ACTIVE }
                )
                .leftJoinAndSelect('discount.currency', 'discountCurrency')
                .where('pr.idCreationUser = :idCreationUser', { idCreationUser })
                .andWhere('pr.type = :type', { type: ReactionTypeEnum.LIKE })
                .andWhere('pr.status <> :status', { status: StatusEnum.DELETED })
                .andWhere('product.status <> :statusProduct', { statusProduct: StatusEnum.DELETED })
                .orderBy(`pr.${orderBy}`, order)
                .limit(limit)
                .offset(skip)
                .getMany();
            return reactions.flatMap((r) => (r.product ? [r.product] : []));
        } catch (error) {
            LogError(this.logger, error, this.findAllLikedByUserPaginated.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Gets distinct tag IDs from products the user has liked.
     * Excludes deleted products and deleted reactions.
     * @param {number} idUser - The user ID.
     * @param {number} [limit=10] - Max number of tag IDs to return.
     * @returns {Promise<number[]>} Array of tag IDs.
     */
    async getTagIdsFromLikedProducts(
        idUser: number,
        limit: number = 10,
    ): Promise<number[]> {
        const rows = await this.createQueryBuilder('pr')
            .innerJoin('pr.product', 'p', 'p.status <> :productStatus', {
                productStatus: StatusEnum.DELETED,
            })
            .innerJoin('p.productTags', 'pt')
            .innerJoin('pt.tag', 't')
            .where('pr.idCreationUser = :idUser', { idUser })
            .andWhere('pr.type = :type', { type: ReactionTypeEnum.LIKE })
            .andWhere('pr.status <> :reactionStatus', {
                reactionStatus: StatusEnum.DELETED,
            })
            .select('t.id', 'idTag')
            .orderBy('t.id')
            .getRawMany<{ idTag: string }>();
        const allIds = (rows ?? [])
            .map((r) => Number(r?.idTag))
            .filter((id): id is number => !Number.isNaN(id));
        const uniqueIds = [...new Set(allIds)];
        return uniqueIds.slice(0, limit);
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
