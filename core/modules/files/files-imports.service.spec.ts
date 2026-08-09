import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import type { IFileInterface } from '../../common/interfaces';
import { FilesImportsService } from './files-imports.service';
import { GeminiService } from '../gemini/gemini.service';

/**
 * Unit tests for {@link FilesImportsService}.
 */
describe('FilesImportsService', () => {
  const geminiServiceMock = {
    generateContent: jest.fn(),
  };
  let service: FilesImportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FilesImportsService,
        {
          provide: GeminiService,
          useValue: geminiServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(FilesImportsService);
  });

  function makeFile(overrides: Partial<IFileInterface>): IFileInterface {
    return {
      fieldname: 'file',
      originalname: 'catalog.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: 4,
      buffer: Buffer.from('data'),
      ...overrides,
    };
  }

  describe('uploadDocumentFile', () => {
    it('throws BadRequestException when file payload is incomplete', async () => {
      await expect(
        service.uploadDocumentFile(
          makeFile({ buffer: undefined as never }),
        ),
      ).rejects.toThrow(BadRequestException);
    });
    it('throws NotAcceptableException for blocked mime types', async () => {
      await expect(
        service.uploadDocumentFile(
          makeFile({
            mimetype: 'image/png',
            originalname: 'x.png',
          }),
        ),
      ).rejects.toThrow(NotAcceptableException);
    });
    it('returns parsed products when Gemini returns valid JSON array', async () => {
      const json =
        '[{"title":"One","subtitle":"S","description":"D","idCatalog":1}]';
      geminiServiceMock.generateContent.mockResolvedValue({ text: json });
      const result = await service.uploadDocumentFile(
        makeFile({ originalname: 'list.txt' }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('One');
      expect(result[0].idCatalog).toBe(1);
    });
    it('rethrows HttpException from Gemini', async () => {
      const ex = new HttpException('rate', 429);
      geminiServiceMock.generateContent.mockRejectedValue(ex);
      await expect(
        service.uploadDocumentFile(makeFile({ originalname: 'a.txt' })),
      ).rejects.toThrow(HttpException);
    });
    it('wraps generic Gemini errors as InternalServerErrorException', async () => {
      geminiServiceMock.generateContent.mockRejectedValue(new Error('boom'));
      await expect(
        service.uploadDocumentFile(makeFile({ originalname: 'a.txt' })),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
