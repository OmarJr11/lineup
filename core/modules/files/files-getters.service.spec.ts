import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FilesGettersService } from './files-getters.service';
import { File } from '../../entities';

/**
 * Unit tests for {@link FilesGettersService}.
 */
describe('FilesGettersService', () => {
  const repositoryMock = {
    find: jest.fn(),
    findOneOrFail: jest.fn(),
  };
  let service: FilesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        FilesGettersService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(File),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(FilesGettersService);
  });

  describe('getImageByNames', () => {
    it('returns rows from find', async () => {
      const rows = [{ id: 1 } as unknown as File];
      repositoryMock.find.mockResolvedValue(rows);
      await expect(service.getImageByNames(['a', 'b'])).resolves.toBe(rows);
    });
    it('throws InternalServerErrorException when find fails', async () => {
      repositoryMock.find.mockRejectedValue(new Error('db'));
      await expect(service.getImageByNames(['x'])).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getImageByName', () => {
    it('returns file when findOneOrFail resolves', async () => {
      const row = { id: 2, name: 'key' } as unknown as File;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.getImageByName('key')).resolves.toBe(row);
    });
    it('throws InternalServerErrorException when find fails', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.getImageByName('missing')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
