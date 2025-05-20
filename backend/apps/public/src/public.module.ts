import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

@Module({
  imports: [],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
