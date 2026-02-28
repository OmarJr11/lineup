import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueNamesEnum, MailsConsumerEnum, TemplatesEnum } from '../../common/enums';
import { ISendTemplateMailInput } from '../mail/interfaces';
import { VerificationCode } from '../../entities/verification-code.entity';

/** Expiry label shown in the email template */
const CODE_EXPIRES_IN = '10 minutes' as const;

/**
 * Service responsible for dispatching verification code emails
 * through the mails BullMQ queue.
 */
@Injectable()
export class VerificationCodesMailService {
  private readonly logger = new Logger(VerificationCodesMailService.name);

  constructor(
    @InjectQueue(QueueNamesEnum.mails)
    private readonly mailsQueue: Queue,
  ) {}

  /**
   * Enqueues a job to send a verification code email to the given destination.
   *
   * @param {VerificationCode} record - The persisted verification code record
   * @returns {Promise<void>}
   */
  async sendVerificationCodeEmail(record: VerificationCode): Promise<void> {
    const payload: ISendTemplateMailInput = {
      to: { email: record.destination },
      subject: 'Your verification code – Lineup',
      template: TemplatesEnum.VERIFICATION_CODE,
      context: {
        name: record.destination,
        code: record.code,
        expiresIn: CODE_EXPIRES_IN,
        year: new Date().getFullYear(),
      },
    };
    await this.mailsQueue.add(MailsConsumerEnum.SendTemplateMail, payload);
    this.logger.log(`Verification code email enqueued for ${record.destination}`);
  }
}
