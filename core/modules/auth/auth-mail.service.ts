import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNamesEnum } from '../../common/enums/consumers';
import { MailsConsumerEnum } from '../../common/enums/consumers';
import { ISendTemplateMailInput } from '../mail/interfaces';
import { ValidationMailsService } from '../validation-mails/validation-mails.service';
import { TemplatesEnum } from '../../common/enums';
import { businessesResponses } from '../../common/responses';
import { BaseResponse } from '../../schemas';

/** Expiry label shown in the email template */
const CODE_EXPIRES_IN = '10 minutes' as const;

/**
 * Service responsible for dispatching email verification code emails
 * through the mails BullMQ queue.
 */
@Injectable()
export class AuthMailService {
  constructor(
    @InjectQueue(QueueNamesEnum.mails)
    private readonly mailsQueue: Queue,
    private readonly validationMailsService: ValidationMailsService,
  ) {}

  /**
   * Enqueues a job to send a verification code email to the given address.
   * The code is hardcoded to `000000` until a code-generation service is available.
   *
   * @param {string} email - Recipient email address
   * @returns {Promise<void>}
   */
  async sendVerificationCodeEmail(email: string): Promise<void> {
    const record = await this.validationMailsService.createValidationCode(email);
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
   * @returns {Promise<void>}
   */
  async verifyCode(email: string, code: string): Promise<BaseResponse> {
    await this.validationMailsService.verifyCode(email, code);
    return businessesResponses.verifyCode.success;
  }
}
