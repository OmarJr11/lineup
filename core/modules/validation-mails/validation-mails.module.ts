import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationMail } from '../../entities/validation-mail.entity';
import { ValidationMailsGettersService } from './validation-mails-getters.service';
import { ValidationMailsSettersService } from './validation-mails-setters.service';
import { ValidationMailsService } from './validation-mails.service';

/**
 * Module for managing email verification codes.
 * Provides getters and setters services for ValidationMail records.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ValidationMail]),
  ],
  providers: [
    ValidationMailsGettersService,
    ValidationMailsSettersService,
    ValidationMailsService,
  ],
  exports: [
    ValidationMailsGettersService,
    ValidationMailsSettersService,
    ValidationMailsService,
  ],
})
export class ValidationMailsModule {}
