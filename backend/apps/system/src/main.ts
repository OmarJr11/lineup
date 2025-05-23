import { NestFactory } from '@nestjs/core';
import { SystemModule } from './system.module';
import {
    initializeTransactionalContext,
    patchTypeORMRepositoryWithBaseRepository,
} from 'typeorm-transactional-cls-hooked';

async function bootstrap() {
  initializeTransactionalContext();
  patchTypeORMRepositoryWithBaseRepository();
  const app = await NestFactory.create(SystemModule);
  
  await app.listen(process.env.PORT_SYSTEM ?? 3001);
  module.exports = app;
}
bootstrap();
