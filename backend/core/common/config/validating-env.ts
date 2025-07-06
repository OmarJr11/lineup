import * as Joi from 'joi';
import { EnvironmentsEnum } from '../enums';

export const ValidatingEnv = Joi.object({
    PORT_BUSINESS: Joi.number().required(),
    PORT_USER: Joi.number().required(),
    PORT_ADMIN: Joi.number().required(),

    NODE_ENV: Joi.string()
        .valid(...Object.values(EnvironmentsEnum))
        .required(),

    JWT_SECRET: Joi.string().required(),
    REQUEST_REFERER: Joi.number().required(),
    COOKIE_DOMAIN: Joi.string().required(),
    MAIN_DOMAIN: Joi.string().required(),
    SECRET: Joi.string().required(),
    EXPIRED_TOKEN_MIN: Joi.string().required(),
    EXPIRED_TOKEN_MAX: Joi.string().required(),

    DB_TYPE: Joi.string().required(),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.string().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    DB_ENTITIES: Joi.string().required(),
    DB_ENTITIES_TYPEORM: Joi.string().required(),
    DB_MIGRATIONS: Joi.string().required(),

    AWS_BUCKET_NAME: Joi.string().required(),
    AWS_BUCKET_REGION: Joi.string().required(),
    AWS_BUCKET_ACCESS_KEY_ID: Joi.string().required(),
    AWS_BUCKET_SECRET_ACCESS_KEY: Joi.string().required(),

    API_CHATGPT_KEY: Joi.string().required()
});
