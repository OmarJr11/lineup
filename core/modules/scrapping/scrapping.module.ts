import { Module } from '@nestjs/common';
import { PyCacheModule } from '../py-cache/py-cache.module';
import { ScrappingCacheService } from './scrapping.service';

@Module({
  imports: [PyCacheModule],
  providers: [ScrappingCacheService],
  exports: [ScrappingCacheService],
})
export class ScrappingModule {}
