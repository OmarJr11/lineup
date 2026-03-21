import { Module } from '@nestjs/common';
import { AdminStatisticsModule as AdminStatisticsCoreModule } from '../../../../core/modules/admin-statistics/admin-statistics.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { AdminStatisticsResolver } from './admin-statistics.resolver';

/**
 * Admin GraphQL statistics (single resolver, multiple queries).
 */
@Module({
    imports: [AdminStatisticsCoreModule, RolesModule, TokensModule],
    providers: [AdminStatisticsResolver],
})
export class AdminStatisticsModule {}
