import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { VerificationCode } from '../../entities/verification-code.entity';
import { VerificationCodesGettersService } from './verification-codes-getters.service';
import { VerificationCodesSettersService } from './verification-codes-setters.service';
import { VerificationCodesService } from './verification-codes.service';
import { VerificationCodesMailService } from './verification-codes-mail.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { UsersModule } from '../users/users.module';
import { QueueNamesEnum } from '../../common/enums/consumers';

/**
 * Module for managing verification codes issued to authenticated users and businesses.
 * Provides getters and setters services for VerificationCode records.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCode]),
    BullModule.registerQueue({ name: QueueNamesEnum.mails }),
    UsersModule,
    BusinessesModule,
  ],
  providers: [
    VerificationCodesGettersService,
    VerificationCodesSettersService,
    VerificationCodesService,
    VerificationCodesMailService,
  ],
  exports: [
    VerificationCodesGettersService,
    VerificationCodesSettersService,
    VerificationCodesService,
    VerificationCodesMailService,
  ],
})
export class VerificationCodesModule {}
