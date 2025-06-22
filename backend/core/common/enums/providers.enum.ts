import { registerEnumType } from "@nestjs/graphql";

export enum ProvidersEnum {
    GOOGLE = 'google',
    META = 'meta',
    APPLE = 'apple',
    LineUp = 'lineUp',
    LineUp_ADMIN = 'lineUp_admin',
    LineUp_APP = 'lineUp_app',
}

registerEnumType(ProvidersEnum, { name: 'ProvidersEnum' });