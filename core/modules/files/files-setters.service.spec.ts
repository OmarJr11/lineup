import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
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

    it('downloads the original and uploads xs, sm, and md WebP variants', async () => {
      const onePixelPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      );
      const sendMock = jest.fn().mockResolvedValue({
        Body: {
          transformToByteArray: async () => onePixelPng,
        },
      });
      const internals = service as unknown as {
        client: { send: jest.Mock };
        updateFile: jest.Mock;
      };
      internals.client.send = sendMock;
      internals.updateFile = jest.fn().mockResolvedValue(undefined);
      filesGettersServiceMock.getImageByName.mockResolvedValue({
        name: 'image-name',
        idCreationUser: 4,
        idCreationBusiness: null,
      });

      await service.generateThumbnailsForImage({
        fileName: 'image-name',
        directory: 'public/users',
        mimetype: 'image/png',
      });

      expect(sendMock).toHaveBeenCalledTimes(4);
      expect(sendMock.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'public/users/image-name',
      });
      expect(
        sendMock.mock.calls.slice(1).map(([command]) => command.input),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Key: 'public/users/thumbnails/image-name/xs.webp',
            ContentType: 'image/webp',
          }),
          expect.objectContaining({
            Key: 'public/users/thumbnails/image-name/sm.webp',
            ContentType: 'image/webp',
          }),
          expect.objectContaining({
            Key: 'public/users/thumbnails/image-name/md.webp',
            ContentType: 'image/webp',
          }),
        ]),
      );
      expect(internals.updateFile).toHaveBeenCalledWith(
        expect.objectContaining({
          thumbnails: expect.objectContaining({
            xs: expect.any(Object),
            sm: expect.any(Object),
            md: expect.any(Object),
          }),
        }),
        expect.objectContaining({ name: 'image-name' }),
        { userId: 4, username: '' },
      );
    });

    it('wraps an empty S3 response as an upload error', async () => {
      const internals = service as unknown as { client: { send: jest.Mock } };
      internals.client.send = jest.fn().mockResolvedValue({ Body: undefined });

      await expect(
        service.generateThumbnailsForImage({
          fileName: 'image-name',
          directory: 'public/users',
          mimetype: 'image/png',
        }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
