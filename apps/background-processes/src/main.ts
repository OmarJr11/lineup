import { NestFactory } from '@nestjs/core';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { createConnection } from 'typeorm';
import { join } from 'path';
import { json, urlencoded } from 'express';
import * as dotenv from 'dotenv';
import { BackgroundProcessesModule } from './background-processes.module';
import { ParamOrderPipe, TrimPipe } from '../../../core/common/pipes';
import { SocketIoCorsAdapter } from '../../../core/common/adapters/socket-io.adapter';

dotenv.config();

/** Max JSON/urlencoded body size (aligns with API apps; avoids 100kb default). */
const HTTP_BODY_SIZE_LIMIT = '2mb';

/**
 * Boots the background worker process (BullMQ consumers + cron schedules + notification sockets).
 */
async function bootstrap(): Promise<void> {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const entitiesPath = join(
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
    entities: [entitiesPath],
    synchronize: false,
  });
  const app = await NestFactory.create(BackgroundProcessesModule, {
    bodyParser: false,
  });
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
  app.useWebSocketAdapter(new SocketIoCorsAdapter(app, corsOrigins));
  await app.listen(process.env.PORT_BACKGROUND_PROCESSES ?? 3003);
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
