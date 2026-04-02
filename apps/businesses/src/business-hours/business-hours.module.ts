import { Module } from '@nestjs/common';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { BusinessHoursModule as BusinessHoursModuleCore } from '../../../../core/modules/business-hours/business-hours.module';
import { BusinessHoursResolver } from './business-hours.resolver';

@Module({
  imports: [BusinessHoursModuleCore, RolesModule, TokensModule],
  providers: [BusinessHoursResolver],
})
export class BusinessHoursModule {}
