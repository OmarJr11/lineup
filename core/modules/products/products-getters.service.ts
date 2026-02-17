import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { BasicService } from '../../common/services';
import { InfinityScrollInput } from '../../common/dtos';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productsResponses } from '../../common/responses';
import { Product } from '../../entities';

@Injectable()
export class ProductsGettersService extends BasicService<Product> {
    private logger = new Logger(ProductsGettersService.name);
    private readonly rList = productsResponses.list;
    private readonly relations = [
        'catalog', 'catalog.image',
        'business', 'business.image',
        'currency',
        'productFiles', 'productFiles.file',
        'variations',
        'reactions'
    ];

    constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ) {
      super(productRepository);
    }

    /**
     * Get all Products with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<Product[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        const subQuery = this.createQueryBuilder('sub')
            .select('sub.id')
            .where('sub.status <> :status', { status: StatusEnum.DELETED })
            .orderBy(`sub.${orderBy}`, order)
            .limit(limit)
            .offset(skip);
        return await this.getQueryRelations(this.createQueryBuilder('p'))
            .where(`p.id IN (${subQuery.getQuery()})`)
            .setParameters(subQuery.getParameters())
            .orderBy(`p.${orderBy}`, order)
            .getMany();
    }

    /**
     * Find a product by its ID.
     * @param {number} id - The ID of the product to find.
     * @returns {Promise<Product>} The found product.
     */
    async findOne(id: number): Promise<Product> {
        try {
            return await this.findOneWithOptionsOrFail({ 
                where: { id, status: Not(StatusEnum.DELETED) },
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a product by its ID with relations.
     * @param {number} id - The ID of the product to find.
     * @returns {Promise<Product>} The found product.
     */
    async findOneWithRelations(id: number): Promise<Product> {
        try {
            return await this.getQueryRelations(this.createQueryBuilder('p'))
                .where('p.id = :id', { id })
                .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
                .getOneOrFail();
        } catch (error) {
            LogError(this.logger, error, this.findOneWithRelations.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Get all Products by Catalog with pagination
     * @param {number} idCatalog - The ID of the catalog
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAllByCatalog(idCatalog: number, query: InfinityScrollInput): Promise<Product[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        const subQuery = this.createQueryBuilder('sub')
            .select('sub.id')
            .where('sub.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('sub.idCatalog = :idCatalog', { idCatalog })
            .orderBy(`sub.${orderBy}`, order)
            .limit(limit)
            .offset(skip);
        return await this.getQueryRelations(this.createQueryBuilder('p'))
            .where(`p.id IN (${subQuery.getQuery()})`)
            .setParameters(subQuery.getParameters())
            .orderBy(`p.${orderBy}`, order)
            .getMany();
    }

    /**
     * Get all Products by Business with pagination
     * @param {number} idBusiness - The ID of the business
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAllByBusiness(idBusiness: number, query: InfinityScrollInput): Promise<Product[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        const subQuery = this.createQueryBuilder('sub')
            .select('sub.id')
            .where('sub.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('sub.idCreationBusiness = :idBusiness', { idBusiness })
            .orderBy(`sub.${orderBy}`, order)
            .limit(limit)
            .offset(skip);
        return await this.getQueryRelations(this.createQueryBuilder('p'))
            .where(`p.id IN (${subQuery.getQuery()})`)
            .setParameters(subQuery.getParameters())
            .orderBy(`p.${orderBy}`, order)
            .getMany();
    }

    /**
     * Apply common relations to a product query builder
     * @param {SelectQueryBuilder<Product>} queryBuilder - The query builder to apply relations to
     * @returns {SelectQueryBuilder<Product>} The query builder with relations applied
     */
    private getQueryRelations(
        queryBuilder: SelectQueryBuilder<Product>
    ): SelectQueryBuilder<Product> {
        return queryBuilder
            .leftJoinAndSelect(
                'p.productFiles',
                'productFiles',
                'productFiles.status <> :statusProductFile', { statusProductFile: StatusEnum.DELETED }
            )
            .leftJoinAndSelect('productFiles.file', 'file')
            .leftJoinAndSelect('p.catalog', 'catalog')
            .leftJoinAndSelect('catalog.image', 'imageCatalog')
            .leftJoinAndSelect('p.business', 'business')
            .leftJoinAndSelect('business.image', 'imageBusiness')
            .leftJoinAndSelect('p.currency', 'currency')
            .leftJoinAndSelect(
                'p.variations',
                'variations',
                'variations.status <> :statusVariations', { statusVariations: StatusEnum.DELETED }
            )
            .leftJoinAndSelect(
                'p.reactions',
                'reactions',
                'reactions.status <> :statusReaction', { statusReaction: StatusEnum.DELETED }
            );
    }
}
