import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { FilesController } from '../src/files/files.controller';
import { FilesService } from '../../../core/modules/files/files.service';
import { createTestApp } from './helpers/test-app.factory';

describe('Admin FilesController e2e', () => {
  const filesServiceMock = {
    uploadFile: jest.fn(),
  };

  const providers = [{ provide: FilesService, useValue: filesServiceMock }];

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
    filesServiceMock.uploadFile.mockResolvedValue({
      originalName: 'image.jpg',
      url: 'https://example.com/image.jpg',
    });
    app = await createTestApp({
      controllers: [FilesController],
      providers,
      enableGraphql: false,
    });
  });
  afterEach(async () => {
    if (app) await app.close();
  });

  it('covers POST /files/upload', async () => {
    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .field('directory', 'public/users')
      .attach('file', Buffer.from('image-bytes'), {
        filename: 'image.jpg',
        contentType: 'image/jpeg',
      });
    expect(response.status).toBe(201);
    expect(response.body.file.url).toBe('https://example.com/image.jpg');
  });
});
