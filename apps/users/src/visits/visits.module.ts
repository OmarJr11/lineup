import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { VisitsResolver } from './visits.resolver';
import { VisitsModule as VisitsModuleCore } from '../../../../core/modules/visits/visits.module';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';

@Module({
    imports: [
        VisitsModuleCore,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET')
            })
        })
    ],
    providers: [VisitsResolver, OptionalJwtAuthGuard]
})
export class VisitsModule {}
