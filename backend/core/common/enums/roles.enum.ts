import { registerEnumType } from '@nestjs/graphql';

export enum RolesEnum {
    ADMIN = 'admin',
    USER = 'user',
    MODERATOR = 'moderator',
}

export enum RolesCodesEnum {
    ADMIN = '01ADMLUP',
    USER = '02USERLUP',
    MODERATOR = '03MODLUP',
    PROFESSIONAL = '04PROFLUP',
    BUSINESS = '05BUSSLUP',
}

registerEnumType(RolesCodesEnum, { name: 'RolesCodesEnum' });