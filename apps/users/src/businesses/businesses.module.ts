import { Module } from '@nestjs/common';
import { BusinessesResolver } from './businesses.resolver';
import { BusinessFollowersModule } from '../../../../core/modules/business-followers/business-followers.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';
import { AuthModule } from '../../../../core/modules/auth/auth.module';

@Module({
  providers: [BusinessesResolver],
  exports: [BusinessesResolver],
  imports: [BusinessFollowersModule, RolesModule, TokensModule, AuthModule],
})
export class BusinessesModule {}
