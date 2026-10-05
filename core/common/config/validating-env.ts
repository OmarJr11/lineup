import * as Joi from 'joi';
import { EnvironmentsEnum } from '../enums';

export const ValidatingEnv = Joi.object({
  PORT_BUSINESS: Joi.number().required(),
  PORT_USER: Joi.number().required(),
  PORT_ADMIN: Joi.number().required(),
  PORT_BACKGROUND_PROCESSES: Joi.number().required(),
  NODE_ENV: Joi.string()
    .valid(...Object.values(EnvironmentsEnum))
    .required(),

  JWT_SECRET: Joi.string().required(),
  REQUEST_REFERER: Joi.string().required(),
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

  API_CHATGPT_KEY: Joi.string().required(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),

  THROTTLE_TTL_SHORT: Joi.number().default(1000),
  THROTTLE_LIMIT_SHORT: Joi.number().default(15),
  THROTTLE_TTL_MEDIUM: Joi.number().default(10000),
  THROTTLE_LIMIT_MEDIUM: Joi.number().default(60),
  THROTTLE_TTL_LONG: Joi.number().default(60000),
  THROTTLE_LIMIT_LONG: Joi.number().default(300),
  GQL_DEPTH_LIMIT: Joi.number().default(6),
});
