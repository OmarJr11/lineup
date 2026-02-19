import { registerEnumType } from "@nestjs/graphql";

export enum LanguagesEnum {
  ENGLISH = 'en',
  SPANISH = 'es',
}

registerEnumType(LanguagesEnum, { name: 'LanguagesEnum' });