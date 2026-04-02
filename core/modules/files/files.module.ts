import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../../entities';
import { ConfigModule } from '@nestjs/config';
import { FilesGettersService } from './files-getters.service';
import { GeminiModule } from '../gemini/gemini.module';
import { FilesImportsService } from './files-imports.service';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    GeminiModule,
    BullModule.registerQueue({
      name: QueueNamesEnum.files,
      defaultJobOptions: { removeOnComplete: true },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  providers: [FilesService, FilesGettersService, FilesImportsService],
  exports: [FilesService, FilesGettersService, FilesImportsService],
})
export class FilesModule {}
