import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  initializeTransactionalContext,
  patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';
import { createConnection } from 'typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { EnvironmentsEnum } from '../../../core/common/enums';
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
  const app = await NestFactory.create(AdminModule);
  app.useGlobalPipes(new TrimPipe(), new ParamOrderPipe());
  app.enableCors();

  if (process.env.NODE_ENV === EnvironmentsEnum.Development) {
    const config = new DocumentBuilder()
      .setTitle('Line Up API')
      .setDescription('Line Up API Documentation')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT_ADMIN ?? 3003);
}
bootstrap();


