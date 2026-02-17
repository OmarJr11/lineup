import { registerEnumType } from '@nestjs/graphql';

export enum VisitTypeEnum {
    BUSINESS = 'BUSINESS',
    PRODUCT = 'PRODUCT',
    CATALOG = 'CATALOG'
}

registerEnumType(VisitTypeEnum, { name: 'VisitTypeEnum' });
