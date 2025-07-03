import { NestFactory } from '@nestjs/core';
import { BusinessesModule } from './businesses.module';
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional-cls-hooked';
import { join } from 'path';
import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import { ParamOrderPipe, TrimPipe } from '../../../core/common/pipes';
dotenv.config();

async function bootstrap() {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const entities = join(__dirname, '../../../', process.env.DB_ENTITIES_TYPEORM);

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

  const app = await NestFactory.create(BusinessesModule);
  app.useGlobalPipes(new TrimPipe(), new ParamOrderPipe());
  app.enableCors();


  await app.listen(process.env.PORT_BUSINESS ?? 3001);
}
bootstrap();
