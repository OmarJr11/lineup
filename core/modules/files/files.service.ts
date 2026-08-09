import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadFileDto } from './dto/upload-file.dto';
import {
  GenerateThumbnailsJobData,
  IBusinessReq,
  IFileInterface,
  IFileUploadInterface,
  IUserReq,
} from '../../common/interfaces';
import { File } from '../../entities';
import { BasicService } from '../../common/services';
import { filesResponses } from '../../common/responses';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { InjectQueue } from '@nestjs/bullmq';
import { LogError } from '../../common/helpers/logger.helper';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DirectoriesEnum } from '../../common/enums';
import { Queue } from 'bullmq';
import {
  FilesConsumerEnum,
  QueueNamesEnum,
} from '../../common/enums/consumers';

/** Minimum confidence score (0-1) for Vision API labels to be included */
const VISION_LABEL_MIN_CONFIDENCE = 0.7;

/** Maximum number of labels to store per image */
const VISION_LABEL_MAX_COUNT = 10;

/** Vision API REST endpoint for label detection */
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

@Injectable({ scope: Scope.REQUEST })
export class FilesService extends BasicService<File> {
  private logger: Logger = new Logger(FilesService.name);
  private client: S3Client;
  private bucketName: string;
  private s3_region: string;
  private visionApiKey: string | undefined;

  private readonly rUpload = filesResponses.upload;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
    private readonly configService: ConfigService,
    @InjectQueue(QueueNamesEnum.files)
    private readonly filesQueue: Queue<unknown, void, FilesConsumerEnum>,
  ) {
    super(filesRepository, userRequest);
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    this.s3_region = this.configService.get<string>('AWS_BUCKET_REGION');
    this.visionApiKey = this.configService.get<string>('GOOGLE_VISION_API_KEY');
    if (!this.s3_region || !this.bucketName) {
      throw new Error(
        'AWS_BUCKET_REGION or AWS_BUCKET_NAME not found in environment variables',
      );
    }
    this.client = new S3Client({
      region: this.s3_region,
      credentials: {
        accessKeyId: this.configService.get('AWS_BUCKET_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_BUCKET_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Uploads a file to S3
   * @param {IFileInterface} file The file to upload
   * @param {UploadFileDto} data The metadata for the file
   * @param {IUserReq} user The user making the request
   * @returns {Promise<File>} The result of the upload
   */
  async uploadFile(
    file: IFileInterface,
    data: UploadFileDto,
    user: IUserReq,
  ): Promise<File> {
    const key = await this.generateFileName();
    const directory = `${data.directory}/${key}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: directory,
      Body: file.buffer,
      ContentType: file.mimetype,
      //ACL: 'public-read',
      Metadata: {
        originalName: file.originalname,
      },
    });

    try {
      await this.client.send(command);
    } catch (error) {
      LogError(this.logger, error as Error, this.uploadFile.name, user);
      throw new InternalServerErrorException(this.rUpload.error);
    }

    const url = this.validateDirectory(data.directory)
      ? this.getFileUrl(directory)
      : await this.getPresignedSignedUrl(directory);

    const labels =
      data.directory === DirectoriesEnum.PRODUCTS
        ? await this.extractLabelsFromImage(file)
        : [];
    const fileToSave: IFileUploadInterface = {
      url,
      name: key,
      extension: file.mimetype.split('/')[1],
      directory: data.directory,
      ...(labels.length > 0 && { tags: labels }),
    };

    try {
      const saved = await this.save(fileToSave, user);
      if (file.mimetype?.startsWith('image/')) {
        const thumbnailJob: GenerateThumbnailsJobData = {
          fileName: saved.name,
          directory: saved.directory,
          mimetype: file.mimetype,
        };
        await this.filesQueue.add(
          FilesConsumerEnum.GenerateThumbnails,
          thumbnailJob,
        );
      }
      return saved;
    } catch (error) {
      LogError(this.logger, error as Error, this.uploadFile.name, user);
      throw new InternalServerErrorException(this.rUpload.error);
    }
  }

  /**
   * Extracts products from a document using Gemini.
   * @param {IFileInterface} file The uploaded document file
   * @param {IBusinessReq} businessReq The business request object
   */
  async uploadDocumentFile(
    file: IFileInterface,
    businessReq: IBusinessReq,
  ): Promise<void> {
    const queueJobName: FilesConsumerEnum =
      FilesConsumerEnum.UploadDocumentFile;
    await this.filesQueue.add(queueJobName, {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      bufferBase64: file.buffer.toString('base64'),
      businessReq,
    });
  }

  /**
   * Gets the public URL of a file in S3
   * @param {string} key The key of the file in S3
   * @returns {string} The public URL of the file
   */
  getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.s3_region}.amazonaws.com/${key}`;
  }

  /**
   * Gets a presigned URL for a file in S3
   * @param {string} key The key of the file in S3
   * @returns {Promise<string>} A promise that resolves to the presigned URL
   */
  async getPresignedSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    return await getSignedUrl(this.client, command, {
      expiresIn: 60 * 60 * 24,
    }).catch((error: unknown) => {
      LogError(this.logger, error as Error, this.getPresignedSignedUrl.name);
      throw new InternalServerErrorException(this.rUpload.error);
    });
  }

  /**
   * Extracts labels from an image using Google Cloud Vision API (REST with API Key)
   * @param {IFileInterface} file The file to analyze (must be an image)
   * @returns {Promise<string[]>} Array of label descriptions, empty if not an image or on error
   */
  private async extractLabelsFromImage(
    file: IFileInterface,
  ): Promise<string[]> {
    const isImage = file.mimetype?.startsWith('image/');
    if (!isImage || !this.visionApiKey) {
      return [];
    }
    try {
      const response = await fetch(
        `${VISION_API_URL}?key=${this.visionApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: file.buffer.toString('base64') },
                features: [
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: VISION_LABEL_MAX_COUNT,
                  },
                ],
              },
            ],
          }),
        },
      );
      if (!response.ok) {
        throw new Error(`Vision API responded with ${response.status}`);
      }
      const data = (await response.json()) as {
        responses?: Array<{
          labelAnnotations?: Array<{ description?: string; score?: number }>;
        }>;
      };
      const labelAnnotations = data.responses?.[0]?.labelAnnotations ?? [];
      return labelAnnotations
        .filter((label) => (label.score ?? 0) >= VISION_LABEL_MIN_CONFIDENCE)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, VISION_LABEL_MAX_COUNT)
        .map((label) => label.description ?? '')
        .filter((description) => description.length > 0);
    } catch (error) {
      this.logger.warn(
        `Failed to extract labels from image via Vision API: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return [];
    }
  }

  /**
   * Validates the directory path
   * @param {string} directory The directory path to validate
   * @returns {boolean} True if the directory is valid, false otherwise
   */
  private validateDirectory(_directory: string): boolean {
    return true;
  }

  /**
   * Generate file name
   *
   * @returns {Promise<string>}
   */
  private async generateFileName(): Promise<string> {
    // creates a filename in respective directory with random string name of 30 characters
    let fileName = await this.generateRandomKey(50);
    // constant to the loop
    let i = 0;

    do {
      // Verifying the newly generated code is not in the database
      const existThisName = await this.findOneWithOptions({
        where: { name: fileName },
      });
      // if exist stop the loop
      i = existThisName ? 1 : 0;
      // get other filename
      if (i > 0) fileName = await this.generateRandomKey(50);
    } while (i === 1);

    return fileName;
  }

  /**
   * Generates a random key of specified length
   * @param {number} length The length of the key to generate
   * @returns {Promise<string>} A promise that resolves to the generated key
   */
  async generateRandomKey(length: number): Promise<string> {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
