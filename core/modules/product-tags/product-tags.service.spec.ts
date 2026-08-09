import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductTagsService } from './product-tags.service';
import { ProductTag } from '../../entities';
import { GeminiService } from '../gemini/gemini.service';
import { TagsService } from '../tags/tags.service';
import { ProductsGettersService } from '../products/products-getters.service';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link ProductTagsService}.
 */
describe('ProductTagsService', () => {
  const repositoryMock = {
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const geminiServiceMock = {
    generateContent: jest.fn(),
  };
  const tagsServiceMock = {
    findOrCreateByNames: jest.fn(),
  };
  const productsGettersServiceMock = {
    findOne: jest.fn(),
  };
  let service: ProductTagsService;
  const businessReq: IBusinessReq = { businessId: 1, path: '/b' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTagsService,
        {
          provide: getRepositoryToken(ProductTag),
          useValue: repositoryMock,
        },
        { provide: GeminiService, useValue: geminiServiceMock },
        { provide: TagsService, useValue: tagsServiceMock },
        {
          provide: ProductsGettersService,
          useValue: productsGettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(ProductTagsService);
  });

  describe('processAndUpdateProductTags', () => {
    it('returns early when input tags array is empty', async () => {
      await service.processAndUpdateProductTags(1, [], businessReq);
      expect(geminiServiceMock.generateContent).not.toHaveBeenCalled();
      expect(productsGettersServiceMock.findOne).not.toHaveBeenCalled();
    });
    it('translates, replaces product tags, and saves new links', async () => {
      geminiServiceMock.generateContent.mockResolvedValue({
        text: 'rojo\nazul',
      });
      productsGettersServiceMock.findOne.mockResolvedValue({ id: 5 });
      tagsServiceMock.findOrCreateByNames.mockResolvedValue([
        { id: 10 },
        { id: 20 },
      ]);
      repositoryMock.find.mockResolvedValue([]);
      repositoryMock.save.mockResolvedValue([
        { idProduct: 5, idTag: 10 },
        { idProduct: 5, idTag: 20 },
      ]);
      await service.processAndUpdateProductTags(
        5,
        ['red', 'blue'],
        businessReq,
      );
      expect(geminiServiceMock.generateContent).toHaveBeenCalled();
      expect(tagsServiceMock.findOrCreateByNames).toHaveBeenCalledWith(
        ['rojo', 'azul'],
        businessReq,
      );
      expect(repositoryMock.save).toHaveBeenCalled();
    });
  });

  describe('saveProductTags', () => {
    it('persists rows via save', async () => {
      const saved = [
        { idProduct: 1, idTag: 2 },
        { idProduct: 1, idTag: 3 },
      ] as ProductTag[];
      repositoryMock.save.mockResolvedValue(saved);
      await expect(
        service.saveProductTags(
          [
            { idProduct: 1, idTag: 2 },
            { idProduct: 1, idTag: 3 },
          ],
          businessReq,
        ),
      ).resolves.toBeUndefined();
      expect(repositoryMock.save).toHaveBeenCalled();
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.saveProductTags([{ idProduct: 1, idTag: 1 }], businessReq),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteProductTags', () => {
    it('removes existing links for the product', async () => {
      const rows = [{ idProduct: 9, idTag: 2 }] as ProductTag[];
      repositoryMock.find.mockResolvedValue(rows);
      repositoryMock.remove.mockResolvedValue(undefined);
      await expect(
        service.deleteProductTags(9, businessReq),
      ).resolves.toBeUndefined();
      expect(repositoryMock.remove).toHaveBeenCalledWith(rows, {
        data: businessReq,
      });
    });
  });
});
