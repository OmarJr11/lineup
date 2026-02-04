import { StatusEnum } from '../../../common/enums';

/**
 * Interface for creating a business follower.
 */
export interface ICreateBusinessFollower {
    idBusiness: number;
    idCreationUser: number;
    status?: StatusEnum;
}

/**
 * Interface for updating a business follower.
 */
export interface IUpdateBusinessFollower {
    status?: StatusEnum;
}
