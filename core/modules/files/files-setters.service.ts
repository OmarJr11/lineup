import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as sharp from 'sharp';
import { File } from '../../entities';
import { ThumbnailsInterface } from '../../common/interfaces/thumbnails.interface';
import { LogError } from '../../common/helpers/logger.helper';
import { filesResponses } from '../../common/responses';
import { BasicService } from '../../common/services';
import { FilesGettersService } from './files-getters.service';
import { IUserOrBusinessReq } from '../../common/interfaces';

/** Max width in pixels for thumbnail variant xs */
const THUMBNAIL_MAX_WIDTH_XS = 128;
/** Max width in pixels for thumbnail variant sm */
const THUMBNAIL_MAX_WIDTH_SM = 384;
/** Max width in pixels for thumbnail variant md */
const THUMBNAIL_MAX_WIDTH_MD = 768;

type ThumbnailBreakpointKey = 'xs' | 'sm' | 'md';

/**
 * Persists derived file data (e.g. thumbnails) for background jobs; not request-scoped.
 */
@Injectable()
export class FilesSettersService extends BasicService<File> {
  private readonly logger = new Logger(FilesSettersService.name);
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly s3Region: string;
  private readonly rUpload = filesResponses.upload;

  constructor(
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
    private readonly configService: ConfigService,
    private readonly filesGettersService: FilesGettersService,
  ) {
    super(filesRepository);
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') ?? '';
    this.s3Region = this.configService.get<string>('AWS_BUCKET_REGION') ?? '';
    if (!this.s3Region || !this.bucketName) {
      throw new Error(
        'AWS_BUCKET_REGION or AWS_BUCKET_NAME not found in environment variables',
      );
    }
    this.client = new S3Client({
      region: this.s3Region,
      credentials: {
        accessKeyId: this.configService.get('AWS_BUCKET_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_BUCKET_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Downloads the original from S3, generates xs/sm/md WebP thumbnails, uploads them, and updates the file row.
   * @param {object} params - Identity and MIME type for the stored file
   * @param {string} params.fileName - File primary key / object basename in S3
   * @param {string} params.directory - S3 path prefix (e.g. public/products)
   * @param {string} params.mimetype - Original Content-Type
   * @returns {Promise<void>}
   */
  async generateThumbnailsForImage(params: {
    fileName: string;
    directory: string;
    mimetype: string;
  }): Promise<void> {
    const { fileName, directory, mimetype } = params;
    if (!mimetype.startsWith('image/')) {
      return;
    }
    if (mimetype === 'image/svg+xml') {
      this.logger.warn(
        `[${this.generateThumbnailsForImage.name}] Skipping thumbnails for SVG: ${fileName}`,
      );
      return;
    }
    const originalKey = `${directory}/${fileName}`;
    let originalBuffer: Buffer;
    try {
      originalBuffer = await this.getObjectBuffer(originalKey);
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.generateThumbnailsForImage.name,
      );
      throw new InternalServerErrorException(this.rUpload.error);
    }
    try {
      const xs = await this.buildThumbnailVariant(
        originalBuffer,
        directory,
        fileName,
        'xs',
        THUMBNAIL_MAX_WIDTH_XS,
      );
      const sm = await this.buildThumbnailVariant(
        originalBuffer,
        directory,
        fileName,
        'sm',
        THUMBNAIL_MAX_WIDTH_SM,
      );
      const md = await this.buildThumbnailVariant(
        originalBuffer,
        directory,
        fileName,
        'md',
        THUMBNAIL_MAX_WIDTH_MD,
      );
      const thumbnails: ThumbnailsInterface = { xs, sm, md };
      const file = await this.filesGettersService.getImageByName(fileName);
      const userOrBusiness: IUserOrBusinessReq =
        file.idCreationUser != null
          ? { userId: Number(file.idCreationUser), username: '' }
          : { businessId: Number(file.idCreationBusiness) };
      await this.updateFile({ thumbnails }, file, userOrBusiness);
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.generateThumbnailsForImage.name,
      );
      throw new InternalServerErrorException(this.rUpload.error);
    }
  }

  /**
   * Resizes the buffer, uploads one WebP object, and returns URL and dimensions for the DB.
   * @param {Buffer} originalBuffer - Raw original image bytes
   * @param {string} directory - S3 directory prefix
   * @param {string} fileName - File basename
   * @param {ThumbnailBreakpointKey} breakpoint - xs, sm, or md
   * @param {number} maxWidth - Max width for resize
   * @returns {Promise<ThumbnailsInterface['xs']>} Variant metadata
   */
  private async buildThumbnailVariant(
    originalBuffer: Buffer,
    directory: string,
    fileName: string,
    breakpoint: ThumbnailBreakpointKey,
    maxWidth: number,
  ): Promise<ThumbnailsInterface['xs']> {
    const thumbKey = this.buildThumbnailObjectKey(
      directory,
      fileName,
      breakpoint,
    );
    const { buffer, width, height } = await this.resizeToWebP(
      originalBuffer,
      maxWidth,
    );
    await this.putObject(thumbKey, buffer, 'image/webp');
    const url = this.validateDirectory(directory)
      ? this.getFileUrl(thumbKey)
      : await this.getPresignedSignedUrl(thumbKey);
    return { url, width, height };
  }

  /**
   * @param {string} directory - S3 prefix
   * @param {string} fileName - Basename
   * @param {ThumbnailBreakpointKey} breakpoint - Size key
   * @returns {string} Full S3 object key
   */
  private buildThumbnailObjectKey(
    directory: string,
    fileName: string,
    breakpoint: ThumbnailBreakpointKey,
  ): string {
    return `${directory}/thumbnails/${fileName}/${breakpoint}.webp`;
  }

  /**
   * @param {Buffer} originalBuffer - Source image
   * @param {number} maxWidth - Max width
   * @returns {Promise<{ buffer: Buffer; width: number; height: number }>} WebP bytes and dimensions
   */
  private async resizeToWebP(
    originalBuffer: Buffer,
    maxWidth: number,
  ): Promise<{ buffer: Buffer; width: number; height: number }> {
    const pipeline = sharp(originalBuffer).resize({
      width: maxWidth,
      withoutEnlargement: true,
    });
    const { data, info } = await pipeline.webp({ quality: 82 }).toBuffer({
      resolveWithObject: true,
    });
    return {
      buffer: data,
      width: info.width,
      height: info.height,
    };
  }

  /**
   * @param {string} key - S3 key
   * @returns {Promise<Buffer>} Object bytes
   */
  private async getObjectBuffer(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const response = await this.client.send(command);
    if (!response.Body) {
      throw new Error(`Empty S3 body for key ${key}`);
    }
    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  /**
   * @param {string} key - S3 key
   * @param {Buffer} body - Object body
   * @param {string} contentType - Content-Type header value
   * @returns {Promise<void>}
   */
  private async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /**
   * @param {string} key - S3 key
   * @returns {string} Public HTTPS URL
   */
  private getFileUrl(key: string): string {
    return `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${key}`;
  }

  /**
   * @param {string} key - S3 key
   * @returns {Promise<string>} Presigned GET URL
   */
  private async getPresignedSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucketName, Key: key });
    return await getSignedUrl(this.client, command, {
      expiresIn: 60 * 60 * 24,
    }).catch((error: unknown) => {
      LogError(this.logger, error as Error, this.getPresignedSignedUrl.name);
      throw new InternalServerErrorException(this.rUpload.error);
    });
  }

  /**
   * @param {string} _directory - Directory prefix (reserved for ACL rules)
   * @returns {boolean} Whether to use public URL vs presigned
   */
  private validateDirectory(_directory: string): boolean {
    return true;
  }
}
