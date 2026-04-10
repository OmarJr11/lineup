import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FilesSettersService } from './files-setters.service';
import { FilesGettersService } from './files-getters.service';
import { File } from '../../entities';

/**
 * Unit tests for {@link FilesSettersService}.
 */
describe('FilesSettersService', () => {
  const configServiceMock = {
    get: jest.fn((key: string): string | undefined => {
      const env: Record<string, string> = {
        AWS_BUCKET_NAME: 'test-bucket',
        AWS_BUCKET_REGION: 'us-east-1',
        AWS_BUCKET_ACCESS_KEY_ID: 'ak',
        AWS_BUCKET_SECRET_ACCESS_KEY: 'sk',
      };
      return env[key];
    }),
  };
  const filesGettersServiceMock = {
    getImageByName: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds service when AWS config is present', async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FilesSettersService,
        { provide: ConfigService, useValue: configServiceMock },
        {
          provide: getRepositoryToken(File),
          useValue: {},
        },
        {
          provide: FilesGettersService,
          useValue: filesGettersServiceMock,
        },
      ],
    }).compile();
    const svc = moduleRef.get(FilesSettersService);
    expect(svc).toBeDefined();
  });

  describe('generateThumbnailsForImage', () => {
    let service: FilesSettersService;

    beforeEach(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          FilesSettersService,
          { provide: ConfigService, useValue: configServiceMock },
          {
            provide: getRepositoryToken(File),
            useValue: {},
          },
          {
            provide: FilesGettersService,
            useValue: filesGettersServiceMock,
          },
        ],
      }).compile();
      service = moduleRef.get(FilesSettersService);
    });

    it('returns without calling S3 for non-image mimetype', async () => {
      await expect(
        service.generateThumbnailsForImage({
          fileName: 'f',
          directory: 'public/x',
          mimetype: 'application/pdf',
        }),
      ).resolves.toBeUndefined();
      expect(filesGettersServiceMock.getImageByName).not.toHaveBeenCalled();
    });

    it('returns without calling S3 for SVG mimetype', async () => {
      await expect(
        service.generateThumbnailsForImage({
          fileName: 'f',
          directory: 'public/x',
          mimetype: 'image/svg+xml',
        }),
      ).resolves.toBeUndefined();
      expect(filesGettersServiceMock.getImageByName).not.toHaveBeenCalled();
    });
  });
});
