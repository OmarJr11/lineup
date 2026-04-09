import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SearchIndexService } from './search-index.service';
import { GeminiService } from '../gemini/gemini.service';
import type { Product } from '../../entities';

/**
 * Unit tests for {@link SearchIndexService}.
 */
describe('SearchIndexService', () => {
  const dataSourceMock = {
    query: jest.fn().mockResolvedValue(undefined),
  };
  const geminiServiceMock = {
    generateContent: jest.fn(),
  };
  let service: SearchIndexService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SearchIndexService,
        { provide: DataSource, useValue: dataSourceMock },
        { provide: GeminiService, useValue: geminiServiceMock },
      ],
    }).compile();
    service = moduleRef.get(SearchIndexService);
  });

  describe('enhanceSearchText', () => {
    it('returns normalized Gemini text on success', async () => {
      geminiServiceMock.generateContent.mockResolvedValue({
        text: 'hello\nworld',
      });
      const out = await service.enhanceSearchText('raw', (d) => `prompt:${d}`);
      expect(out).toBe('hello world');
    });
    it('falls back to normalized raw text when Gemini fails', async () => {
      geminiServiceMock.generateContent.mockRejectedValue(new Error('api'));
      const out = await service.enhanceSearchText('raw\n text', (d) => d);
      expect(out).toBe('raw text');
    });
  });

  describe('buildProductRawText', () => {
    it('concatenates title and related fields', () => {
      const product = {
        title: 'Book',
        subtitle: 'Nice',
        description: 'Desc',
        status: 'active',
        skus: [{ idCurrency: 1, skuCode: 'X', variationOptions: { Size: 'M' } }],
        catalog: { title: 'Cat' },
        business: { name: 'Shop' },
        variations: [{ title: 'Color', options: ['Red'] }],
        productTags: [{ tag: { name: 'tag1' } }],
      } as unknown as Product;
      expect(service.buildProductRawText(product)).toContain('Book');
      expect(service.buildProductRawText(product)).toContain('tag1');
    });
  });

  describe('upsertProductSearchIndex', () => {
    it('runs INSERT with enhanced text', async () => {
      geminiServiceMock.generateContent.mockResolvedValue({ text: 'enhanced' });
      const product = {
        id: 5,
        idCreationBusiness: 2,
        idCatalog: 3,
        likes: 1,
        visits: 2,
        ratingAverage: 4.5,
        title: 'T',
        skus: [{ price: 10 }],
        business: { locations: [{ formattedAddress: 'Caracas' }] },
      } as unknown as Product;
      await service.upsertProductSearchIndex(product);
      expect(dataSourceMock.query).toHaveBeenCalled();
      const sql = (dataSourceMock.query.mock.calls[0][0] as string).toLowerCase();
      expect(sql).toContain('insert into product_search_index');
    });
  });

  describe('incrementProductVisits', () => {
    it('updates product_search_index visits', async () => {
      await service.incrementProductVisits(99);
      expect(dataSourceMock.query).toHaveBeenCalledWith(
        expect.stringContaining('product_search_index'),
        [99],
      );
    });
  });
});
