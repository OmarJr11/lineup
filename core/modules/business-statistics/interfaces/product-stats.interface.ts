import { IStatItemWithLikes } from './stat-item-with-likes.interface';
import { IStatItemWithRating } from './stat-item-with-rating.interface';
import { IStatItemWithVisits } from './stat-item-with-visits.interface';

/**
 * Visit-to-like ratio for products.
 */
export interface IVisitToLikeRatio {
    totalVisits: number;
    totalLikes: number;
    ratio: number;
}

/**
 * Combined product statistics.
 */
export interface IProductStats {
    topByVisits: IStatItemWithVisits[];
    topByRating: IStatItemWithRating[];
    topByLikes: IStatItemWithLikes[];
    withoutVisitsCount: number;
    withoutRatingsCount: number;
    visitToLikeRatio: IVisitToLikeRatio;
}
