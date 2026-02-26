import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailsConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { LogWarn } from '../common/helpers';
import { MailSettersService } from '../modules/mail/mail-setters.service';
import { ISendMailInput, ISendTemplateMailInput } from '../modules/mail/interfaces';

/**
 * Consumer for mail-related background jobs.
 * Processes jobs dispatched to the `mails-queue` via BullMQ.
 */
@Processor(QueueNamesEnum.mails)
export class MailsConsumer extends WorkerHost {
  private readonly logger = new Logger(MailsConsumer.name);

  constructor(private readonly mailSettersService: MailSettersService) {
    super();
  }

  /**
   * Routes incoming jobs to their corresponding handler.
   *
   * @param {Job} job - The BullMQ job to process
   */
  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MailsConsumerEnum.SendMail:
        await this.processSendMail(job);
        break;
      case MailsConsumerEnum.SendTemplateMail:
        await this.processSendTemplateMail(job);
        break;
      default:
        LogWarn(this.logger, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Processes a raw HTML email send job.
   *
   * @param {Job<ISendMailInput>} job - BullMQ job with ISendMailInput as data
   */
  private async processSendMail(job: Job<ISendMailInput>): Promise<void> {
    await this.mailSettersService.sendMail(job.data);
  }

  /**
   * Processes a Handlebars template email send job.
   *
   * @param {Job<ISendTemplateMailInput>} job - BullMQ job with ISendTemplateMailInput as data
   */
  private async processSendTemplateMail(job: Job<ISendTemplateMailInput>): Promise<void> {
    await this.mailSettersService.sendTemplateMail(job.data);
  }
}
