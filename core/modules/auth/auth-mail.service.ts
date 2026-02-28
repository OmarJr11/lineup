import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNamesEnum } from '../../common/enums/consumers';
import { MailsConsumerEnum } from '../../common/enums/consumers';
import { ISendTemplateMailInput } from '../mail/interfaces';
import { TemplatesEnum } from '../../common/enums';
import { businessesResponses } from '../../common/responses';
import { BaseResponse } from '../../schemas';
import { ValidationMailsSettersService } from '../validation-mails/validation-mails-setters.service';
import { ValidationMailsGettersService } from '../validation-mails/validation-mails-getters.service';
import { ValidationMail, VerificationCode } from '../../entities';

/** Expiry label shown in the email template */
const CODE_EXPIRES_IN = '10 minutes' as const;

/**
 * Service responsible for dispatching email verification code emails
 * through the mails BullMQ queue.
 */
@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  
  constructor(
    @InjectQueue(QueueNamesEnum.mails)
    private readonly mailsQueue: Queue,
    private readonly validationMailsSettersService: ValidationMailsSettersService,
    private readonly validationMailsGettersService: ValidationMailsGettersService,
  ) {}

  /**
   * Enqueues a job to send a verification code email to the given address.
   * The code is hardcoded to `000000` until a code-generation service is available.
   *
   * @param {string} email - Recipient email address
   */
  async sendVerificationCodeEmail(email: string) {
    const activeRecord = await this.validationMailsGettersService.findLatestByEmail(email);
    if (activeRecord && !this.isExpired(activeRecord)) return;
    const record = await this.validationMailsSettersService.createValidationCode(email);
    const payload: ISendTemplateMailInput = {
      to: { email },
      subject: 'Verify your email address – Lineup',
      template: TemplatesEnum.VERIFY_EMAIL,
      context: {
        name: email,
        code: record.code,
        expiresIn: CODE_EXPIRES_IN,
        year: new Date().getFullYear(),
      },
    };
    await this.mailsQueue.add(MailsConsumerEnum.SendTemplateMail, payload);
  }

  /**
   * Verify a code
   * @param {string} email - The email to verify
   * @param {string} code - The code to verify
   * @returns {Promise<BaseResponse>}
   */
  async verifyCode(email: string, code: string): Promise<BaseResponse> {
    const record = await this.validationMailsGettersService.findActiveByEmailAndCode(email, code);
    await this.validationMailsSettersService.verifyCode(record);
    return businessesResponses.verifyCode.success;
  }

  /**
   * Checks whether a verification code record has passed its expiry date.
   *
   * @param {VerificationCode | ValidationMail} record - The record to evaluate
   * @returns {boolean} True if the code is expired
   */
  private isExpired(record: ValidationMail | VerificationCode): boolean {
    return new Date() > record.expiresAt;
  }
}
