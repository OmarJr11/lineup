import { NestFactory } from '@nestjs/core';
import { PublicModule } from './public.module';

async function bootstrap() {
  const app = await NestFactory.create(PublicModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
