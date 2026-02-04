import { ReactionTypeEnum, StatusEnum } from '../../../common/enums';

/**
 * Interface for creating a product reaction.
 */
export interface ICreateProductReaction {
    idProduct: number;
    type: ReactionTypeEnum;
    idCreationUser: number;
    status?: StatusEnum;
}

/**
 * Interface for updating a product reaction.
 */
export interface IUpdateProductReaction {
    status?: StatusEnum;
}
