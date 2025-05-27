import { NestFactory } from '@nestjs/core';
import { SystemModule } from './system.module';
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { createConnection } from 'typeorm';
import { join } from 'path';

async function bootstrap() {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const entities = join(__dirname, '../../../', process.env.DB_ENTITIES);

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

  const app = await NestFactory.create(SystemModule);
  await app.listen(process.env.PORT_SYSTEM ?? 3001);
}
bootstrap();
