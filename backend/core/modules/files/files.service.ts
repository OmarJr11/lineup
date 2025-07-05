import { Inject, Injectable, InternalServerErrorException, Logger, NotAcceptableException, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadFileDto } from './dto/upload-file.dto';
import { IFileInterface, IUserReq } from '../../common/interfaces';
import { File } from '../../entities';
import { BasicService } from '../../common/services';
import { filesResponses } from '../../common/responses';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { IFileUploadInterface } from '../../common/interfaces/file.interface';
import { LogError } from 'core/common/helpers/logger.helper';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable({ scope: Scope.REQUEST })
export class FilesService extends BasicService<File> {
  private logger: Logger = new Logger(FilesService.name);
  private client: S3Client;
  private bucketName: string;
  private s3_region: string;

  private readonly rUpload = filesResponses.upload;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
    private readonly configService: ConfigService,
  ) {
    super(filesRepository, userRequest);
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');
    this.s3_region = this.configService.get<string>('AWS_BUCKET_REGION');
    if (!this.s3_region || !this.bucketName) {
      throw new Error('AWS_BUCKET_REGION or AWS_BUCKET_NAME not found in environment variables');
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
    user: IUserReq
  ): Promise<File> {
    const key = await this.generateFileName();
    const directory = `${data.directory}/${key}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: directory,
      Body: file.buffer,
      ContentType: file.mimetype,
      //ACL: this.validateDirectory(data.directory) ? 'public-read' : 'private',
      Metadata: {
        originalName: file.originalname,
      },
    });

    await this.client.send(command).catch((error) => {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw new NotAcceptableException('File upload failed');
    });

    const url = this.validateDirectory(data.directory) 
      ? this.getFileUrl(directory)
      : await this.getPresignedSignedUrl(directory);

    let fileToSave: IFileUploadInterface = {
      url,
      name: key,
      extension: file.mimetype.split('/')[1],
      directory: data.directory,
    };

    return await this.save(fileToSave, user).catch((error) => {
      LogError(this.logger, error, this.uploadFile.name, user);
      throw new InternalServerErrorException(this.rUpload.error);
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
    return await getSignedUrl(
      this.client, command, { expiresIn: 60 * 60 * 24 }
    ).catch((error) => {
      LogError(this.logger, error, this.getPresignedSignedUrl.name);
      throw new InternalServerErrorException(this.rUpload.error);
    });
  }

  /**
   * Validates the directory path
   * @param {string} directory The directory path to validate
   * @returns {boolean} True if the directory is valid, false otherwise
   */
  private validateDirectory(directory: string): boolean {
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
          const existThisName = await this.findOneWithOptions({ where: { name: fileName } });
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

