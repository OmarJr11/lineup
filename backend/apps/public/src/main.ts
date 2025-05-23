import { NestFactory } from '@nestjs/core';
import { PublicModule } from './public.module';

async function bootstrap() {
  const app = await NestFactory.create(PublicModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
