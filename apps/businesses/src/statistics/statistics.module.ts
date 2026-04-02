import { Module } from '@nestjs/common';
import { BusinessStatisticsModule } from '../../../../core/modules/business-statistics/business-statistics.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { StatisticsResolver } from './statistics.resolver';

/**
 * App module for business dashboard statistics.
 */
@Module({
  imports: [BusinessStatisticsModule, RolesModule, TokensModule],
  providers: [StatisticsResolver],
})
export class StatisticsModule {}
