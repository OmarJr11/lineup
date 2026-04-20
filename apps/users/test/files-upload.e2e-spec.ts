import type { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { FilesController } from '../src/files/files.controller';
import { FilesService } from '../../../core/modules/files/files.service';
import { createTestApp } from './helpers/test-app.factory';

describe('Users Files upload e2e', () => {
  const filesServiceMock = {
    uploadFile: jest.fn(),
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
    if (app) {
      await app.close();
    }
  });

  it('uploads a file to /files/upload', async () => {
    filesServiceMock.uploadFile.mockResolvedValue({
      id: 9,
      url: 'https://cdn.lineup.test/public/users/avatar.png',
    });

    const response = await request(app.getHttpServer())
      .post('/files/upload')
      .field('directory', 'public/users')
      .attach('file', Buffer.from('fake-file-content'), 'avatar.png');

    expect(response.status).toBe(201);
    expect(response.body.status).toBe(true);
    expect(filesServiceMock.uploadFile).toHaveBeenCalledTimes(1);
  });
});
