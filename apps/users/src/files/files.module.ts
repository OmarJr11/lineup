import { Module } from '@nestjs/common';
import { FilesModule as FilesModuleCore } from '../../../../core/modules/files/files.module';
import { FilesController } from './files.controller';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
  controllers: [FilesController],
  imports: [
    FilesModuleCore,
    RolesModule,
    TokensModule
  ],
})
export class FilesModule {}
