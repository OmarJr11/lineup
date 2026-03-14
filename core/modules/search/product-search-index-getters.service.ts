import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSearchIndex } from '../../entities';
import { StatusEnum } from '../../common/enums';
import { BasicService } from '../../common/services';

/**
 * Getters service for product_search_index.
 * Uses createQueryBuilder with repository for type-safe queries.
 */
@Injectable()
export class ProductSearchIndexGettersService extends BasicService<ProductSearchIndex> {
    private logger = new Logger(ProductSearchIndexGettersService.name);

    constructor(
        @InjectRepository(ProductSearchIndex)
        private readonly productSearchIndexRepository: Repository<ProductSearchIndex>,
    ) {
        super(productSearchIndexRepository);
    }

    /**
     * Gets top-rated product IDs from product_search_index.
     * Orders by rating descending (highest first).
     * @param {number} limit - Max number of product IDs to return.
     * @returns {Promise<number[]>} Array of product IDs.
     */
    async getTopRatedProductIds(limit: number): Promise<number[]> {
        const rows = await this.createBaseQueryBuilder()
            .select('psi.idProduct', 'id')
            .orderBy('psi.ratingAverage', 'DESC')
            .addOrderBy('RANDOM()')
            .limit(limit)
            .getRawMany<{ id: string }>();
        return (rows || []).map((r) => parseInt(r?.id, 10)).filter((id) => !Number.isNaN(id));
    }

    /**
     * Gets most-visited product IDs from product_search_index.
     * @param {number} limit - Max number of product IDs to return.
     * @returns {Promise<number[]>} Array of product IDs.
     */
    async getMostVisitedProductIds(limit: number): Promise<number[]> {
        const rows = await this.createBaseQueryBuilder()
            .select('psi.idProduct', 'id')
            .orderBy('psi.visits', 'DESC')
            .addOrderBy('RANDOM()')
            .limit(limit)
            .getRawMany<{ id: string }>();
        return (rows || []).map((r) => parseInt(r?.id, 10)).filter((id) => !Number.isNaN(id));
    }

    /**
     * Gets product IDs by location (state name in locations_text).
     * @param {string} stateName - State name to filter by (partial match).
     * @param {number} limit - Max number of product IDs to return.
     * @returns {Promise<number[]>} Array of product IDs.
     */
    async getProductIdsByLocation(stateName: string, limit: number): Promise<number[]> {
        const rows = await this.createBaseQueryBuilder()
            .select('psi.idProduct', 'id')
            .where('psi.locationsText IS NOT NULL')
            .andWhere('psi.locationsText ILIKE :stateName', {
                stateName: `%${stateName}%`,
            })
            .orderBy('RANDOM()')
            .limit(limit)
            .getRawMany<{ id: string }>();
        return (rows || []).map((r) => parseInt(r?.id, 10)).filter((id) => !Number.isNaN(id));
    }

    /**
     * Base query builder with product, catalog, and business joins.
     * Filters out deleted products, catalogs, and businesses.
     */
    private createBaseQueryBuilder(): ReturnType<Repository<ProductSearchIndex>['createQueryBuilder']> {
        return this.createQueryBuilder('psi')
            .innerJoin('psi.product', 'product', 'product.status <> :status', {
                status: StatusEnum.DELETED,
            })
            .innerJoin('psi.catalog', 'catalog', 'catalog.status <> :catalogStatus', {
                catalogStatus: StatusEnum.DELETED,
            })
            .innerJoin('psi.business', 'business', 'business.status <> :businessStatus', {
                businessStatus: StatusEnum.DELETED,
            });
    }
}
