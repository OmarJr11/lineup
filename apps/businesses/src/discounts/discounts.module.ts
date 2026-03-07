import { Module } from '@nestjs/common';
import { DiscountsModule as DiscountsModuleCore } from '../../../../core/modules/discounts/discounts.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { DiscountsResolver } from './discounts.resolver';

/**
 * App module for discount management.
 */
@Module({
    imports: [
        DiscountsModuleCore,
        RolesModule,
        TokensModule,
    ],
    providers: [DiscountsResolver],
})
export class DiscountsModule {}
