import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FilesConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { LogError, LogWarn } from '../common/helpers';
import {
  GenerateThumbnailsJobData,
  IBusinessReq,
  IFileInterface,
} from '../common/interfaces';
import { StatusEnum } from '../common/enums';
import { FilesImportsService } from '../modules/files/files-imports.service';
import { FilesSettersService } from '../modules/files/files-setters.service';
import { IImportedProductInput } from '../modules/files/dto/imported-product.input';
import { ProductsSettersService } from '../modules/products/products-setters.service';
import { CreateProductInput } from '../modules/products/dto/create-product.input';

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
  businessReq: IBusinessReq;
}

/**
 * Consumer for file-related background jobs.
 */
@Processor(QueueNamesEnum.files)
export class FilesConsumer extends WorkerHost {
  private readonly log = new Logger(FilesConsumer.name);

  constructor(
    private readonly filesImportsService: FilesImportsService,
    private readonly filesSettersService: FilesSettersService,
    private readonly productsSettersService: ProductsSettersService,
  ) {
    super();
  }

  /**
   * Process incoming jobs.
   * @param {Job} job - The job to process.
   */
  async process(job: Job): Promise<void> {
    const name: FilesConsumerEnum = job.name as FilesConsumerEnum;
    switch (name) {
      case FilesConsumerEnum.UploadDocumentFile:
        await this.processUploadDocumentFile(
          job as Job<UploadDocumentFileJobData>,
        );
        break;
      case FilesConsumerEnum.GenerateThumbnails:
        await this.processGenerateThumbnails(
          job as Job<GenerateThumbnailsJobData>,
        );
        break;
      default:
        LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
    }
  }

  /**
   * Generates xs/sm/md thumbnails for an uploaded image and updates the file row.
   * @param {Job<GenerateThumbnailsJobData>} job - Job with file name, directory, and mimetype
   * @returns {Promise<void>}
   */
  private async processGenerateThumbnails(
    job: Job<GenerateThumbnailsJobData>,
  ): Promise<void> {
    const { fileName, directory, mimetype } = job.data;
    if (!fileName || !directory || !mimetype) {
      LogWarn(
        this.log,
        `Missing thumbnail payload in job ${job.id}`,
        this.processGenerateThumbnails.name,
      );
      return;
    }
    await this.filesSettersService.generateThumbnailsForImage({
      fileName,
      directory,
      mimetype,
    });
  }

  /**
   * Processes a document import file.
   * @param {Job<UploadDocumentFileJobData>} job - BullMQ job with document payload.
   */
  private async processUploadDocumentFile(
    job: Job<UploadDocumentFileJobData>,
  ): Promise<void> {
    const {
      bufferBase64,
      fieldname,
      originalname,
      encoding,
      mimetype,
      size,
      businessReq,
    } = job.data;
    if (
      !bufferBase64 ||
      !originalname ||
      !mimetype ||
      !businessReq?.businessId
    ) {
      LogWarn(
        this.log,
        `Missing document payload or business data in job ${job.id}`,
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
    await this.createImportedProductsAsPending(importedProducts, businessReq);
    this.log.log(
      `Processed imported file "${originalname}" with ${importedProducts.length} products`,
    );
  }

  /**
   * Creates imported products with pending status.
   * @param {IImportedProductInput[]} importedProducts Imported products list
   * @param {IBusinessReq} businessReq Business context
   * @returns {Promise<void>}
   */
  private async createImportedProductsAsPending(
    importedProducts: IImportedProductInput[],
    businessReq: IBusinessReq,
  ): Promise<void> {
    for (const importedProduct of importedProducts) {
      try {
        const createPayload: CreateProductInput = {
          ...importedProduct,
          images: [],
          status: StatusEnum.PENDING,
          idCatalog: null,
        };
        await this.productsSettersService.create(createPayload, businessReq);
      } catch (error) {
        LogError(
          this.log,
          error as Error,
          this.createImportedProductsAsPending.name,
        );
        throw new InternalServerErrorException(error);
      }
    }
  }
}
