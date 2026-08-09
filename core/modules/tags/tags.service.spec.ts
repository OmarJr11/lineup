import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tag } from '../../entities';
import type { IBusinessReq } from '../../common/interfaces';
import { TagsService } from './tags.service';

/**
 * Unit tests for {@link TagsService}.
 */
describe('TagsService', () => {
  const businessReq: IBusinessReq = { path: '/', businessId: 10 };
  let service: TagsService;
  let findMock: jest.Mock;
  let saveMock: jest.Mock;
  let getRawManyMock: jest.Mock;
  let createQueryBuilderMock: jest.Mock;

  beforeEach(async () => {
    findMock = jest.fn();
    saveMock = jest.fn();
    getRawManyMock = jest.fn();
    const qb = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: getRawManyMock,
    };
    createQueryBuilderMock = jest.fn().mockReturnValue(qb);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getRepositoryToken(Tag),
          useValue: {
            find: findMock,
            save: saveMock,
            createQueryBuilder: createQueryBuilderMock,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(TagsService);
  });

  describe('findOrCreateByNames', () => {
    it('returns empty array when names are missing or empty', async () => {
      await expect(
        service.findOrCreateByNames([], businessReq),
      ).resolves.toEqual([]);
      await expect(
        service.findOrCreateByNames(null as unknown as string[], businessReq),
      ).resolves.toEqual([]);
    });

    it('deduplicates and merges existing with newly created tags', async () => {
      const existing = [{ id: 1, name: 'alpha' } as Tag];
      findMock.mockResolvedValueOnce(existing);
      saveMock.mockImplementation(async (row: Tag) =>
        Promise.resolve({ ...row, id: 2 } as Tag),
      );
      const result = await service.findOrCreateByNames(
        ['Alpha', 'alpha', ' beta '],
        businessReq,
      );
      expect(findMock).toHaveBeenCalledWith({
        where: { name: expect.anything() },
      });
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(result.map((t) => t.name).sort()).toEqual(['alpha', 'beta']);
    });
  });

  describe('findTagsByNames', () => {
    it('delegates to repository.find with In(names)', async () => {
      const tags = [{ id: 3, name: 'x' } as Tag];
      findMock.mockResolvedValue(tags);
      await expect(service.findTagsByNames(['x'])).resolves.toBe(tags);
    });
  });

  describe('findMainTags', () => {
    it('returns empty array when no tag ids from aggregation', async () => {
      getRawManyMock.mockResolvedValue([]);
      await expect(service.findMainTags(5)).resolves.toEqual([]);
      expect(findMock).not.toHaveBeenCalled();
    });

    it('loads tags and preserves order from aggregation ids', async () => {
      getRawManyMock.mockResolvedValue([{ id: 2 }, { id: 1 }]);
      const tag1 = { id: 1, name: 'a' } as Tag;
      const tag2 = { id: 2, name: 'b' } as Tag;
      findMock.mockResolvedValue([tag1, tag2]);
      const result = await service.findMainTags(10);
      expect(result.map((t) => t.id)).toEqual([2, 1]);
    });
  });
});
