import { Module } from '@nestjs/common';
import { VerificationCodesResolver } from './verification-codes.resolver';
import { VerificationCodesModule as VerificationCodesModuleCore } from '../../../../core/modules/verification-codes/verification-codes.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

/**
 * Module exposing verification code mutations for authenticated businesses.
 */
@Module({
  imports: [
    VerificationCodesModuleCore,
    RolesModule,
    TokensModule,
  ],
  providers: [VerificationCodesResolver],
})
export class VerificationCodesModule {}
