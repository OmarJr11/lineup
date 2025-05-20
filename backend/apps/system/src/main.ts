import { NestFactory } from '@nestjs/core';
import { SystemModule } from './system.module';

async function bootstrap() {
  const app = await NestFactory.create(SystemModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
