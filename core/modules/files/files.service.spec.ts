import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { FilesImportsService } from './files-imports.service';
import { File } from '../../entities';
import {
  FilesConsumerEnum,
  QueueNamesEnum,
} from '../../common/enums/consumers';
import { DirectoriesEnum } from '../../common/enums';
import { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link FilesService}.
 */
describe('FilesService', () => {
  const configServiceMock = {
    get: jest.fn((key: string): string | undefined => {
      const env: Record<string, string> = {
        AWS_BUCKET_NAME: 'bucket',
        AWS_BUCKET_REGION: 'us-east-1',
        AWS_BUCKET_ACCESS_KEY_ID: 'k',
        AWS_BUCKET_SECRET_ACCESS_KEY: 's',
      };
      return env[key];
    }),
  };
  const filesQueueMock = {
    add: jest.fn(),
  };
  const repositoryMock = {
    findOne: jest.fn(),
  };
  const filesImportsServiceMock = {
    validateDocumentFile: jest.fn(),
  };
  let service: FilesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: REQUEST, useValue: { headers: {}, user: { userId: 1 } } },
        {
          provide: getRepositoryToken(File),
          useValue: repositoryMock,
        },
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: getQueueToken(QueueNamesEnum.files),
          useValue: filesQueueMock,
        },
        {
          provide: FilesImportsService,
          useValue: filesImportsServiceMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(FilesService);
  });

  describe('generateRandomKey', () => {
    it('returns a string of the requested length', async () => {
      const key = await service.generateRandomKey(12);
      expect(key).toHaveLength(12);
      expect(key).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('getFileUrl', () => {
    it('builds the public S3 URL', () => {
      expect(service.getFileUrl('dir/file.jpg')).toBe(
        'https://bucket.s3.us-east-1.amazonaws.com/dir/file.jpg',
      );
    });
  });

  describe('uploadDocumentFile', () => {
    it('validates and enqueues document payload with base64 buffer', async () => {
      const buffer = Buffer.from('hello');
      const file = {
        fieldname: 'f',
        originalname: 'doc.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: buffer.length,
        buffer,
      };
      const businessReq: IBusinessReq = { path: '/b', businessId: 3 };
      filesQueueMock.add.mockResolvedValue(undefined);
      await service.uploadDocumentFile(file, businessReq);
      expect(filesImportsServiceMock.validateDocumentFile).toHaveBeenCalledWith(
        file,
      );
      expect(filesQueueMock.add).toHaveBeenCalledWith(
        FilesConsumerEnum.UploadDocumentFile,
        expect.objectContaining({
          originalname: 'doc.pdf',
          bufferBase64: buffer.toString('base64'),
          businessReq,
        }),
      );
    });

    it('does not enqueue when document format is invalid', async () => {
      const buffer = Buffer.from('hello');
      const file = {
        fieldname: 'f',
        originalname: 'photo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: buffer.length,
        buffer,
      };
      const businessReq: IBusinessReq = { path: '/b', businessId: 3 };
      filesImportsServiceMock.validateDocumentFile.mockImplementation(() => {
        throw new NotAcceptableException();
      });
      await expect(
        service.uploadDocumentFile(file, businessReq),
      ).rejects.toThrow(NotAcceptableException);
      expect(filesQueueMock.add).not.toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    const file = {
      fieldname: 'file',
      originalname: 'avatar.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 3,
      buffer: Buffer.from('png'),
    };
    const data = { directory: DirectoriesEnum.USER };
    const user = { userId: 8, username: 'tester' };

    it('uploads to S3, saves metadata, and schedules thumbnails', async () => {
      const s3SendMock = jest.fn().mockResolvedValue({});
      const saved = {
        name: 'generated-name',
        directory: 'public/users',
        url: 'https://bucket.s3.us-east-1.amazonaws.com/public/users/generated-name',
      };
      const internals = service as unknown as {
        client: { send: jest.Mock };
        generateFileName: jest.Mock;
        save: jest.Mock;
      };
      internals.client.send = s3SendMock;
      internals.generateFileName = jest
        .fn()
        .mockResolvedValue('generated-name');
      internals.save = jest.fn().mockResolvedValue(saved);

      await expect(service.uploadFile(file, data, user)).resolves.toBe(saved);

      expect(s3SendMock).toHaveBeenCalledTimes(1);
      expect(s3SendMock.mock.calls[0][0].input).toMatchObject({
        Bucket: 'bucket',
        Key: 'public/users/generated-name',
        Body: file.buffer,
        ContentType: 'image/png',
        Metadata: { originalName: 'avatar.png' },
      });
      expect(internals.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'generated-name',
          directory: 'public/users',
          extension: 'png',
        }),
        user,
      );
      expect(filesQueueMock.add).toHaveBeenCalledWith(
        FilesConsumerEnum.GenerateThumbnails,
        {
          fileName: 'generated-name',
          directory: 'public/users',
          mimetype: 'image/png',
        },
      );
    });

    it('wraps an S3 upload failure and does not save metadata', async () => {
      const internals = service as unknown as {
        client: { send: jest.Mock };
        generateFileName: jest.Mock;
        save: jest.Mock;
      };
      internals.client.send = jest
        .fn()
        .mockRejectedValue(new Error('s3 unavailable'));
      internals.generateFileName = jest
        .fn()
        .mockResolvedValue('generated-name');
      internals.save = jest.fn();

      await expect(service.uploadFile(file, data, user)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(internals.save).not.toHaveBeenCalled();
      expect(filesQueueMock.add).not.toHaveBeenCalled();
    });
  });
});
