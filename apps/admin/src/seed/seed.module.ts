import { Module } from '@nestjs/common';
import { SeedResolver } from './seed.resolver';
import { SeedModule as SeedModuleCore } from '../../../../core/modules/seed/seed.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

@Module({
    imports: [
        SeedModuleCore,
        RolesModule,    
        TokensModule
    ],
    providers: [SeedResolver],
})
export class SeedModule {}
