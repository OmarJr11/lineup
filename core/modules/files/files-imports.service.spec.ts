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

    it('processes binary documents (pdf, xlsx) using base64 encoding', async () => {
      geminiServiceMock.generateContent.mockResolvedValue({
        text: '[{"title":"PDF Product","idCatalog":2}]',
      });
      const result = await service.uploadDocumentFile(
        makeFile({
          originalname: 'catalogo.pdf',
          mimetype: 'application/pdf',
          buffer: Buffer.from('binary-pdf-content'),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('PDF Product');
      expect(geminiServiceMock.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.stringContaining('encoding: base64'),
        }),
      );
    });

    it('returns empty array when CSV has 1 or fewer rows', async () => {
      const result = await service.uploadDocumentFile(
        makeFile({
          originalname: 'single_row.csv',
          mimetype: 'text/csv',
          buffer: Buffer.from('title,price,idCatalog\n'),
        }),
      );
      expect(result).toEqual([]);
    });

    it('processes CSV rows in chunks and returns imported products', async () => {
      const csv = 'title,idCatalog\nProduct 1,1\nProduct 2,1';
      geminiServiceMock.generateContent.mockResolvedValue({
        text: '[{"title":"Product 1","idCatalog":1},{"title":"Product 2","idCatalog":1}]',
      });
      const result = await service.uploadDocumentFile(
        makeFile({
          originalname: 'items.csv',
          mimetype: 'text/csv',
          buffer: Buffer.from(csv),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Product 1');
      expect(result[1].title).toBe('Product 2');
    });

    it('handles CSV chunk fallback when product count mismatches and splits chunk', async () => {
      const csv = 'title,idCatalog\nItem A,1\nItem B,1';
      // First call for chunk of 2 returns only 1 product (triggering mismatch)
      // Next calls for subchunks of 1 return 1 product each
      geminiServiceMock.generateContent
        .mockResolvedValueOnce({
          text: '[{"title":"Item A","idCatalog":1}]', // length 1 != 2
        })
        .mockResolvedValueOnce({
          text: '[{"title":"Item A","idCatalog":1}]',
        })
        .mockResolvedValueOnce({
          text: '[{"title":"Item B","idCatalog":1}]',
        });

      const result = await service.uploadDocumentFile(
        makeFile({
          originalname: 'items.csv',
          mimetype: 'text/csv',
          buffer: Buffer.from(csv),
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe('Item A');
      expect(result[1].title).toBe('Item B');
    });

    it('parses products wrapped in an object { products: [...] }', async () => {
      const json =
        '{"products":[{"title":"Wrapped Item","subtitle":"Sub","idCatalog":5}]}';
      geminiServiceMock.generateContent.mockResolvedValue({ text: json });

      const result = await service.uploadDocumentFile(
        makeFile({ originalname: 'doc.txt' }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Wrapped Item');
    });

    it('parses products wrapped in { items: [...] } or { data: [...] }', async () => {
      const json =
        '{"items":[{"title":"Item from items","idCatalog":"10"}]}';
      geminiServiceMock.generateContent.mockResolvedValue({ text: json });

      const result = await service.uploadDocumentFile(
        makeFile({ originalname: 'doc.txt' }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Item from items');
      expect(result[0].idCatalog).toBe(10);
    });

    it('parses products with variations and variation options', async () => {
      const json = JSON.stringify([
        {
          title: 'Shoes',
          idCatalog: 3,
          variations: [
            {
              title: 'Size',
              options: [{ value: '42' }, { value: '43' }],
            },
          ],
        },
      ]);
      geminiServiceMock.generateContent.mockResolvedValue({ text: json });

      const result = await service.uploadDocumentFile(
        makeFile({ originalname: 'shoes.txt' }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].variations).toBeDefined();
      expect(result[0].variations?.[0].title).toBe('Size');
      expect(result[0].variations?.[0].options).toHaveLength(2);
    });

    it('throws NotAcceptableException when Gemini output has no JSON structure', async () => {
      geminiServiceMock.generateContent.mockResolvedValue({
        text: 'Sorry, I cannot parse this document into products.',
      });

      await expect(
        service.uploadDocumentFile(makeFile({ originalname: 'invalid.txt' })),
      ).rejects.toThrow(NotAcceptableException);
    });

    it('repairs malformed JSON via Gemini repair when initial parse fails', async () => {
      const brokenJson = '[{"title": "Unclosed quote, idCatalog: 1]';
      const fixedJson = '[{"title": "Fixed Product", "idCatalog": 1}]';

      geminiServiceMock.generateContent
        .mockResolvedValueOnce({ text: brokenJson })
        .mockResolvedValueOnce({ text: fixedJson });

      const result = await service.uploadDocumentFile(
        makeFile({ originalname: 'broken.txt' }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Fixed Product');
    });
  });
});
