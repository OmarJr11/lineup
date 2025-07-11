import { registerEnumType } from "@nestjs/graphql";

export enum ProvidersEnum {
    GOOGLE = 'google',
    META = 'meta',
    APPLE = 'apple',
    LineUp = 'lineup',
    LineUp_ADMIN = 'lineup_admin',
    LineUp_APP = 'lineup_app',
}

registerEnumType(ProvidersEnum, { name: 'ProvidersEnum' });