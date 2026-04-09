import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StatesGettersService } from './states-getters.service';
import { State } from '../../entities';

/**
 * Unit tests for {@link StatesGettersService}.
 */
describe('StatesGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
  };
  let service: StatesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StatesGettersService,
        {
          provide: getRepositoryToken(State),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(StatesGettersService);
  });

  describe('findById', () => {
    it('returns row when found', async () => {
      const row = { id: 1, name: 'Jalisco' } as State;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findById(1)).resolves.toBe(row);
    });
    it('throws NotFoundException when missing', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('returns row when found', async () => {
      const row = { id: 2, code: 'VE-A' } as State;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findByCode('VE-A')).resolves.toBe(row);
    });
  });

  describe('findAll', () => {
    it('returns rows ordered by name', async () => {
      const rows = [{ id: 1 } as State];
      repositoryMock.find.mockResolvedValue(rows);
      await expect(service.findAll()).resolves.toBe(rows);
    });
    it('throws NotFoundException when find fails', async () => {
      repositoryMock.find.mockRejectedValue(new Error('db'));
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('existsByName', () => {
    it('returns true when a matching row is found', async () => {
      const row = { id: 3, name: 'Duplicate' } as State;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.existsByName('Duplicate', 1)).resolves.toBe(true);
    });
  });
});
