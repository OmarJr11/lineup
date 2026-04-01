import { registerEnumType } from '@nestjs/graphql';

export enum DirectoriesEnum {
  PRODUCTS = 'public/products',
  BUSINESS = 'public/businesses',
  CATALOG = 'public/catalogs',
  USER = 'public/users',
}
registerEnumType(DirectoriesEnum, { name: 'DirectoriesEnum' });
