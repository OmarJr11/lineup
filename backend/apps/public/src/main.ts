import { NestFactory } from '@nestjs/core';
import { PublicModule } from './public.module';
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';

async function bootstrap() {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const app = await NestFactory.create(PublicModule);
  await app.listen(process.env.PORT ?? 3000);
  module.exports = app;
}
bootstrap();
