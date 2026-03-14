import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm';
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
     * Find a product by its ID and business ID.
     * @param {number} id - The ID of the product to find.
     * @param {number} businessId - The ID of the business to find.
     * @returns {Promise<Product>} The found product.
     */
    async findOneByBusinessId(id: number, businessId: number): Promise<Product> {
        try {
            return await this.findOneWithOptionsOrFail({ 
                where: { 
                    id,
                    idCreationBusiness: businessId,
                    status: Not(StatusEnum.DELETED)
                },
            });
        } catch (error) {
            LogError(this.logger, error, this.findOneByBusinessId.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find products by IDs with relations. Returns only found ones; ignores missing/deleted.
     * Uses repository.find when query builder returns empty (avoids parameter/join issues).
     * @param {number[]} ids - Product IDs to fetch.
     * @returns {Promise<Product[]>} Array of found products.
     */
    async findManyWithRelations(ids: number[]): Promise<Product[]> {
        if (!ids?.length) return [];
        const uniqueIds = [...new Set(ids)];
        let products = await this.getQueryRelations(this.createQueryBuilder('p'))
            .where('p.id IN (:...ids)', { ids: uniqueIds })
            .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
            .getMany();
        if (products.length === 0) {
            products = await this.find({
                where: { id: In(uniqueIds), status: Not(StatusEnum.DELETED) },
                relations: [
                    'productFiles',
                    'productFiles.file',
                    'catalog',
                    'catalog.image',
                    'business',
                    'business.image',
                    'business.locations',
                    'currency',
                    'variations',
                    'skus',
                    'productTags',
                    'productTags.tag',
                ],
            });
        }
        return products;
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
     * Get all product IDs by business (for discount assignment).
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<number[]>} Array of product IDs.
     */
    async findProductIdsByBusiness(idBusiness: number): Promise<number[]> {
        const products = await this.createQueryBuilder('p')
            .select('p.id')
            .where('p.idCreationBusiness = :idBusiness', { idBusiness })
            .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
            .getMany();
        return products.map((p) => p.id);
    }

    /**
     * Get all Products by tag (name or slug) with pagination.
     * @param {string} tagNameOrSlug - Tag name or slug to filter by.
     * @param {InfinityScrollInput} query - Query parameters for pagination.
     * @returns {Promise<Product[]>} Array of products with the given tag.
     */
    async findAllByTag(tagNameOrSlug: string, query: InfinityScrollInput): Promise<Product[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        const subQuery = this.createQueryBuilder('sub')
            .select('sub.id')
            .innerJoin('sub.productTags', 'pt')
            .innerJoin('pt.tag', 'tag')
            .where('sub.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('(tag.name = :tagNameOrSlug OR tag.slug = :tagNameOrSlug)', { tagNameOrSlug })
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
     * Get all Products by multiple tags (name or slug) with pagination.
     * Returns products that have at least one of the specified tags.
     * @param {string[]} tagNamesOrSlugs - Tag names or slugs to filter by.
     * @param {InfinityScrollInput} query - Query parameters for pagination.
     * @returns {Promise<Product[]>} Array of products matching any of the given tags.
     */
    async findAllByTags(tagNamesOrSlugs: string[], query: InfinityScrollInput): Promise<Product[]> {
        if (!tagNamesOrSlugs?.length) return [];
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        const subQuery = this.createQueryBuilder('sub')
            .select('sub.id')
            .innerJoin('sub.productTags', 'pt')
            .innerJoin('pt.tag', 'tag')
            .where('sub.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('(tag.name IN (:...tagNamesOrSlugs) OR tag.slug IN (:...tagNamesOrSlugs))', {
                tagNamesOrSlugs
            })
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
     * Gets product IDs by tag IDs, in random order.
     * Excludes deleted products, catalogs, and businesses.
     * @param {number[]} tagIds - Tag IDs to filter by.
     * @param {number} limit - Max number of product IDs to return.
     * @returns {Promise<number[]>} Array of product IDs.
     */
    async findProductIdsByTagIds(tagIds: number[], limit: number): Promise<number[]> {
        if (tagIds.length === 0) return [];
        const rows = await this.createQueryBuilder('p')
            .innerJoin('p.productTags', 'pt')
            .innerJoin('pt.tag', 't', 't.id IN (:...tagIds)', { tagIds })
            .innerJoin('p.catalog', 'c', 'c.status <> :catalogStatus', {
                catalogStatus: StatusEnum.DELETED,
            })
            .innerJoin('p.business', 'b', 'b.status <> :businessStatus', {
                businessStatus: StatusEnum.DELETED,
            })
            .where('p.status <> :productStatus', { productStatus: StatusEnum.DELETED })
            .select('p.id', 'id')
            .orderBy('RANDOM()')
            .limit(limit)
            .getRawMany<{ id: string }>();
        return (rows ?? [])
            .map((r) => Number(r?.id))
            .filter((id): id is number => !Number.isNaN(id));
    }

    /**
     * Get all product IDs by catalog (for discount assignment).
     * @param {number} idCatalog - The catalog ID.
     * @returns {Promise<number[]>} Array of product IDs.
     */
    async findProductIdsByCatalog(idCatalog: number): Promise<number[]> {
        const products = await this.createQueryBuilder('p')
            .select('p.id')
            .where('p.idCatalog = :idCatalog', { idCatalog })
            .andWhere('p.status <> :status', { status: StatusEnum.DELETED })
            .getMany();
        return products.map((p) => p.id);
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
            .leftJoinAndSelect(
                'business.locations', 
                'locations',
                'locations.status <> :statusLocation', { statusLocation: StatusEnum.DELETED }
            )
            .leftJoinAndSelect('p.currency', 'currency')
            .leftJoinAndSelect(
                'p.variations',
                'variations',
                'variations.status <> :statusVariations', { statusVariations: StatusEnum.DELETED }
            )
            .leftJoinAndSelect(
                'p.skus',
                'skus',
                'skus.status <> :statusSkus', { statusSkus: StatusEnum.DELETED }
            )
            .leftJoinAndSelect(
                'p.reactions',
                'reactions',
                'reactions.status <> :statusReaction',
                { statusReaction: StatusEnum.DELETED },
            )
            .leftJoinAndSelect('p.discountProduct', 'discountProduct')
            .leftJoinAndSelect(
                'discountProduct.discount',
                'discount',
                'discount.status = :statusDiscount', { statusDiscount: StatusEnum.ACTIVE },
            )
            .leftJoinAndSelect('discount.currency', 'discountCurrency')
            .leftJoinAndSelect('p.productTags', 'productTags')
            .leftJoinAndSelect('productTags.tag', 'tag');
    }
}
