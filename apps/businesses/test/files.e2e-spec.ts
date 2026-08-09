import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { FilesController } from '../src/files/files.controller';
import { FilesService } from '../../../core/modules/files/files.service';
import { createTestApp } from './helpers/test-app.factory';

describe('Businesses Files e2e', () => {
  const filesServiceMock = {
    uploadFile: jest.fn(),
    uploadDocumentFile: jest.fn(),
  };
  const providers = [{ provide: FilesService, useValue: filesServiceMock }];

  let app: INestApplication;
  beforeEach(async () => {
    jest.clearAllMocks();
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
    filesServiceMock.uploadFile.mockResolvedValue({ id: 1 });
    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .field('directory', 'public/businesses')
      .attach('file', Buffer.from('abc'), 'avatar.png');
    expect(response.status).toBe(201);
    expect(response.body.status).toBe(true);
  });

  it('covers POST /files/upload-document', async () => {
    filesServiceMock.uploadDocumentFile.mockResolvedValue(undefined);
    const response = await request(app.getHttpServer())
      .post('/files/upload-document')
      .attach('file', Buffer.from('abc'), 'catalog.csv');
    expect(response.status).toBe(201);
    expect(response.body.status).toBe(true);
  });
});
