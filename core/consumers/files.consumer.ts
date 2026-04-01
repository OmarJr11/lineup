import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FilesConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { LogWarn } from '../common/helpers';
import { IFileInterface } from '../common/interfaces';
import { FilesImportsService } from '../modules/files/files-imports.service';
import { IImportedProductInput } from '../modules/files/dto/imported-product.input';

/**
 * Payload for UploadDocumentFile queue job.
 */
export interface UploadDocumentFileJobData {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  bufferBase64: string;
}

/**
 * Consumer for file-related background jobs.
 */
@Processor(QueueNamesEnum.files)
export class FilesConsumer extends WorkerHost {
  private readonly log = new Logger(FilesConsumer.name);

  constructor(private readonly filesImportsService: FilesImportsService) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(job: Job<UploadDocumentFileJobData>): Promise<void> {
    const name: FilesConsumerEnum = job.name as FilesConsumerEnum;
    switch (name) {
      case FilesConsumerEnum.UploadDocumentFile:
        await this.processUploadDocumentFile(job);
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Processes a document import file.
   * @param {Job<UploadDocumentFileJobData>} job - BullMQ job with document payload.
   */
  private async processUploadDocumentFile(
    job: Job<UploadDocumentFileJobData>,
  ): Promise<void> {
    const { bufferBase64, fieldname, originalname, encoding, mimetype, size } =
      job.data;
    if (!bufferBase64 || !originalname || !mimetype) {
      LogWarn(
        this.log,
        `Missing document payload in job ${job.id}`,
        this.processUploadDocumentFile.name,
      );
      return;
    }
    const file: IFileInterface = {
      fieldname,
      originalname,
      encoding,
      mimetype,
      size,
      buffer: Buffer.from(bufferBase64, 'base64'),
    };
    const importedProducts: IImportedProductInput[] =
      await this.filesImportsService.uploadDocumentFile(file);
    this.log.log(
      `Processed imported file "${originalname}" with ${importedProducts.length} products`,
    );
  }
}
