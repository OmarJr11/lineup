import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { File } from '../../entities';
import {
  FilesConsumerEnum,
  QueueNamesEnum,
} from '../../common/enums/consumers';
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
    it('enqueues document payload with base64 buffer', async () => {
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
      expect(filesQueueMock.add).toHaveBeenCalledWith(
        FilesConsumerEnum.UploadDocumentFile,
        expect.objectContaining({
          originalname: 'doc.pdf',
          bufferBase64: buffer.toString('base64'),
          businessReq,
        }),
      );
    });
  });
});
