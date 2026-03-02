import { StatusEnum } from '../enums';

/**
 * Interface for creating a new product rating record.
 */
export interface ICreateProductRating {
    readonly idProduct: number;
    readonly idCreationUser: number;
    readonly stars: number;
    readonly comment?: string;
    readonly status?: StatusEnum;
}

/**
 * Interface for updating an existing product rating record.
 */
export interface IUpdateProductRating {
    readonly stars?: number;
    readonly comment?: string;
    readonly status?: StatusEnum;
}
