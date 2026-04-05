import { NestFactory } from '@nestjs/core';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { createConnection } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { BackgroundProcessesModule } from './background-processes.module';
import { ParamOrderPipe, TrimPipe } from '../../../core/common/pipes';

dotenv.config();

/**
 * Boots the background worker process (BullMQ consumers + cron schedules).
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
  const app = await NestFactory.create(BackgroundProcessesModule);
  app.useGlobalPipes(new TrimPipe(), new ParamOrderPipe());
  await app.listen(process.env.PORT_BACKGROUND_PROCESSES ?? 3003);
}

void bootstrap();
