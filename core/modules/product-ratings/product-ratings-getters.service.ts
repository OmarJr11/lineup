import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productRatingsResponses } from '../../common/responses';
import { ProductRating } from '../../entities';
import { InfinityScrollInput } from '../../common/dtos';

/**
 * Read-only service for querying product ratings.
 */
@Injectable()
export class ProductRatingsGettersService extends BasicService<ProductRating> {
    private readonly logger = new Logger(ProductRatingsGettersService.name);
    private readonly rList = productRatingsResponses.list;
    private readonly relations = [
        'creationUser', 'creationUser.profileImage', 
        'product', 'product.productFiles', 'product.productFiles.file',
        'product.catalog', 'product.catalog.image',
        'product.business', 'product.business.image'
    ];

    constructor(
        @InjectRepository(ProductRating)
        private readonly productRatingRepository: Repository<ProductRating>,
    ) {
        super(productRatingRepository);
    }

    /**
     * Find a product rating by its ID.
     * @param {number} id - The product rating ID.
     * @returns {Promise<ProductRating>} The found product rating.
     */
    async findOne(id: number): Promise<ProductRating> {
        try {
            const productRating = await this.findOneWithOptionsOrFail({
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this.relations,
            });
            return this.formatProductRating(productRating);
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find an existing rating by product ID and user ID.
     * @param {number} idProduct - The product ID.
     * @param {number} idCreationUser - The user ID.
     * @returns {Promise<ProductRating | null>} The found rating or null.
     */
    async findOneByProductAndUser(
        idProduct: number,
        idCreationUser: number,
    ): Promise<ProductRating | null> {
        try {
            const productRating = await this.findOneWithOptions({
                where: { idProduct, idCreationUser, status: Not(StatusEnum.DELETED) },
                relations: this.relations,
            });
            return this.formatProductRating(productRating);
        } catch (error) {
            LogError(this.logger, error, this.findOneByProductAndUser.name);
            return null;
        }
    }

    /**
     * Get all active ratings for a given product (no pagination — used internally).
     * @param {number} idProduct - The product ID.
     * @returns {Promise<ProductRating[]>} Array of product ratings.
     */
    async findAllByProduct(idProduct: number): Promise<ProductRating[]> {
        try {
            const productRatings = await this.find({
                where: { idProduct, status: Not(StatusEnum.DELETED) },
                relations: this.relations,
            });
            return this.formatProductRatings(productRatings);
        } catch (error) {
            LogError(this.logger, error, this.findAllByProduct.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Get all ratings submitted by a specific user, paginated.
     * @param {number} idCreationUser - The user ID.
     * @param {InfinityScrollInput} pagination - Pagination parameters.
     * @returns {Promise<ProductRating[]>} Paginated array of the user's ratings.
     */
    async findAllByUserPaginated(
        idCreationUser: number,
        pagination: InfinityScrollInput,
    ): Promise<ProductRating[]> {
        try {
            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const skip = (page - 1) * limit;
            const order = pagination.order || 'DESC';
            const orderBy = pagination.orderBy || 'creation_date';
            const subQuery = this.createQueryBuilder('sub')
                .select('sub.id')
                .where('sub.idCreationUser = :idCreationUser', { idCreationUser })
                .andWhere('sub.status <> :status', { status: StatusEnum.DELETED })
                .orderBy(`sub.${orderBy}`, order)
                .limit(limit)
                .offset(skip);
            let queryBuilder: SelectQueryBuilder<ProductRating> = this
                .createQueryBuilder('pr')
                .leftJoinAndSelect('pr.creationUser', 'creationUser')
                .leftJoinAndSelect('creationUser.profileImage', 'profileImage');
            queryBuilder = this.addProductDisplayRelations(queryBuilder);
            return await queryBuilder.where(`pr.id IN (${subQuery.getQuery()})`)
                .where(`pr.id IN (${subQuery.getQuery()})`)
                .andWhere('product.status <> :statusProduct', { statusProduct: StatusEnum.DELETED })
                .setParameters(subQuery.getParameters())
                .orderBy(`pr.${orderBy}`, order)
                .getMany();
        } catch (error) {
            LogError(this.logger, error, this.findAllByUserPaginated.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Get paginated active ratings for a given product.
     * @param {number} idProduct - The product ID.
     * @param {InfinityScrollInput} pagination - Pagination parameters.
     * @returns {Promise<ProductRating[]>} Paginated array of product ratings.
     */
    async findAllByProductPaginated(
        idProduct: number,
        pagination: InfinityScrollInput,
    ): Promise<ProductRating[]> {
        try {
            const page = pagination.page || 1;
            const limit = pagination.limit || 10;
            const skip = (page - 1) * limit;
            const order = pagination.order || 'DESC';
            const orderBy = pagination.orderBy || 'creation_date';
            let queryBuilder: SelectQueryBuilder<ProductRating> = this
                .createQueryBuilder('pr')
                .leftJoinAndSelect('pr.creationUser', 'creationUser')
                .leftJoinAndSelect('creationUser.profileImage', 'profileImage');
            queryBuilder = this.addProductDisplayRelations(queryBuilder);
            return await queryBuilder.where('pr.idProduct = :idProduct', { idProduct })
                .andWhere('pr.status <> :status', { status: StatusEnum.DELETED })
                .orderBy(`pr.${orderBy}`, order)
                .limit(limit)
                .offset(skip)
                .getMany();
        } catch (error) {
            LogError(this.logger, error, this.findAllByProductPaginated.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Format the product ratings.
     * @param {ProductRating[]} productRatings - The product ratings.
     * @returns {ProductRating[]} The formatted product ratings.
     */
    private formatProductRatings(productRatings: ProductRating[]): ProductRating[] {
        return productRatings.map(productRating => this.formatProductRating(productRating));
    }

    /**
     * Format the product of a product rating.
     * @param {ProductRating} productRating - The product rating.
     * @returns {ProductRating} The formatted product rating.
     */
    private formatProductRating(productRating: ProductRating): ProductRating {
        if (productRating.product && productRating.product?.productFiles.length > 0) {
            const productFiles = productRating.product.productFiles
                .filter(productFile => productFile.status !== StatusEnum.DELETED);
            productRating.product.productFiles = productFiles;
        }
        return productRating;
    }

    /**
     * Add the product display relations to the query builder.
     * @param {SelectQueryBuilder<ProductRating>} queryBuilder - The query builder.
     * @returns {SelectQueryBuilder<ProductRating>} The query builder with the product display relations.
     */
    private addProductDisplayRelations(
        queryBuilder: SelectQueryBuilder<ProductRating>
    ): SelectQueryBuilder<ProductRating> {
        return queryBuilder
            .leftJoinAndSelect('pr.product', 'product')
            .leftJoinAndSelect(
                'product.productFiles',
                'productFiles',
                'productFiles.status <> :statusProductFiles',
                { statusProductFiles: StatusEnum.DELETED },
            )
            .leftJoinAndSelect('productFiles.file', 'file')
            .leftJoinAndSelect('product.catalog', 'catalog')
            .leftJoinAndSelect('catalog.image', 'catalogImage')
            .leftJoinAndSelect('product.business', 'business')
            .leftJoinAndSelect('business.image', 'businessImage');
    }
}
