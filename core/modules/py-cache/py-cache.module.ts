import { Module } from '@nestjs/common';
import { PyCacheService } from './py-cache.service';

/**
 * Provides {@link PyCacheService} for direct Redis JSON cache access.
 */
@Module({
  providers: [PyCacheService],
  exports: [PyCacheService],
})
export class PyCacheModule {}
