import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../../entities';
import { ConfigModule } from '@nestjs/config';
import { FilesGettersService } from './files-getters.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    })
  ],
  providers: [
    FilesService,
    FilesGettersService
  ],
  exports: [
    FilesService,
    FilesGettersService
  ],
})
export class FilesModule {}
