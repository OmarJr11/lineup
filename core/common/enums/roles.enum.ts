import { registerEnumType } from '@nestjs/graphql';

export enum RolesEnum {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  BUSINESS = 'business',
  BUSINESS_ADMIN = 'business_admin',
  BUSINESS_PREMIUM = 'business_premium',
}

export enum RolesCodesEnum {
  ADMIN = '01ADMLUP',
  USER = '02USERLUP',
  MODERATOR = '03MODLUP',
  BUSINESS = '05BUSSLUP',
  BUSINESS_ADMIN = '06BUSADMLUP',
  BUSINESS_PREMIUM = '07BUSPREMLUP',
}

registerEnumType(RolesCodesEnum, { name: 'RolesCodesEnum' });
