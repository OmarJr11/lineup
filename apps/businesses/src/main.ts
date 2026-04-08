import { NestFactory } from '@nestjs/core';
import { BusinessesModule } from './businesses.module';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { join } from 'path';
import { createConnection } from 'typeorm';
import { json, urlencoded } from 'express';
import * as dotenv from 'dotenv';
import { ParamOrderPipe, TrimPipe } from '../../../core/common/pipes';
import * as cookieParser from 'cookie-parser';
dotenv.config();

/** Max JSON/urlencoded body size (GraphQL queries with large variables exceed the 100kb default). */
const HTTP_BODY_SIZE_LIMIT = '2mb';

async function bootstrap() {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const entities = join(
    __dirname,
    '../../../',
    process.env.DB_ENTITIES_TYPEORM,
  );

  await createConnection({
    type: process.env.DB_TYPE as 'postgres' | 'mysql' | 'sqlite',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [entities],
    synchronize: false,
  });

  const app = await NestFactory.create(BusinessesModule, { bodyParser: false });
  app.use(json({ limit: HTTP_BODY_SIZE_LIMIT }));
  app.use(urlencoded({ extended: true, limit: HTTP_BODY_SIZE_LIMIT }));
  app.useGlobalPipes(new TrimPipe(), new ParamOrderPipe());

  const corsOrigins = getCors();
  const cors = {
    origin: corsOrigins,
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'language',
      'token',
      'refreshToken',
    ],
    exposedHeaders: ['token_expired'],
  };
  app.enableCors(cors);
  app.use(cookieParser());

  await app.listen(process.env.PORT_BUSINESS ?? 3002);
}

const getCors = (): string[] => {
  const corsArray: string[] = [];
  const corsEnv = process.env.CORS.split(',');
  corsEnv.forEach((e) => {
    const url = e.trim();
    if (url !== '') {
      corsArray.push(`http://${url}`);
      corsArray.push(`https://${url}`);
    }
  });

  return corsArray;
};

void bootstrap();
