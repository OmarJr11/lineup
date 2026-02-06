import { Module } from '@nestjs/common';
import { CurrenciesModule as CurrenciesModuleCore } from '../../../../core/modules/currencies/currencies.module';
import { CurrenciesResolver } from './currencies.resolver';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
    
@Module({
  providers: [CurrenciesResolver],
  imports: [CurrenciesModuleCore, RolesModule, TokensModule],
})
export class CurrenciesModule {}
