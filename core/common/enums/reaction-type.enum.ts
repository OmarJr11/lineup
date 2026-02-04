import { registerEnumType } from '@nestjs/graphql';

export enum ReactionTypeEnum {
    LIKE = 'like',
}

registerEnumType(ReactionTypeEnum, { name: 'ReactionTypeEnum' });
