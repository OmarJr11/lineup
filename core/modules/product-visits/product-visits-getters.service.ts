import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { ProductVisit } from '../../entities';
import { StatusEnum } from '../../common/enums';

/** Default limit for tag IDs returned from visited products. */
const DEFAULT_TAG_IDS_LIMIT = 10;

/**
 * Getters service for product visits.
 * Handles read operations related to product visit data.
 */
@Injectable()
export class ProductVisitsGettersService extends BasicService<ProductVisit> {
    constructor(
        @InjectRepository(ProductVisit)
        private readonly productVisitRepository: Repository<ProductVisit>,
    ) {
        super(productVisitRepository);
    }

    /**
     * Gets distinct tag IDs from products the user has visited.
     * Excludes deleted products.
     * @param {number} idUser - The user ID.
     * @param {number} [limit=DEFAULT_TAG_IDS_LIMIT] - Max number of tag IDs to return.
     * @returns {Promise<number[]>} Array of tag IDs.
     */
    async getTagIdsFromVisitedProducts(
        idUser: number,
        limit: number = DEFAULT_TAG_IDS_LIMIT,
    ): Promise<number[]> {
        const rows = await this.createQueryBuilder('pv')
            .innerJoin('pv.product', 'p', 'p.status <> :status', {
                status: StatusEnum.DELETED,
            })
            .innerJoin('p.productTags', 'pt')
            .innerJoin('pt.tag', 't')
            .where('pv.idCreationUser = :idUser', { idUser })
            .select('t.id', 'idTag')
            .orderBy('t.id')
            .getRawMany<{ idTag: string }>();
        const allIds = (rows ?? [])
            .map((r) => Number(r?.idTag))
            .filter((id): id is number => !Number.isNaN(id));
        const uniqueIds = [...new Set(allIds)];
        return uniqueIds.slice(0, limit);
    }
}
