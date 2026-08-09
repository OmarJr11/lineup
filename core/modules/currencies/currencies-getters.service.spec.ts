import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CurrenciesGettersService } from './currencies-getters.service';
import { Currency } from '../../entities';

/**
 * Unit tests for {@link CurrenciesGettersService}.
 */
describe('CurrenciesGettersService', () => {
  const repositoryMock = {
    findOneOrFail: jest.fn(),
    find: jest.fn(),
  };
  let service: CurrenciesGettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CurrenciesGettersService,
        {
          provide: getRepositoryToken(Currency),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(CurrenciesGettersService);
  });

  describe('findById', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 1, code: 'USD' } as Currency;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findById(1)).resolves.toBe(row);
    });
    it('maps repository failure to NotFoundException', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCode', () => {
    it('returns entity when repository resolves', async () => {
      const row = { id: 2, code: 'EUR' } as Currency;
      repositoryMock.findOneOrFail.mockResolvedValue(row);
      await expect(service.findByCode('EUR')).resolves.toBe(row);
    });
    it('maps repository failure to NotFoundException', async () => {
      repositoryMock.findOneOrFail.mockRejectedValue(new Error('nf'));
      await expect(service.findByCode('XXX')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns list when repository resolves', async () => {
      const list = [{ id: 1 } as Currency];
      repositoryMock.find.mockResolvedValue(list);
      await expect(service.findAll()).resolves.toBe(list);
    });
    it('throws NotFoundException when find fails', async () => {
      repositoryMock.find.mockRejectedValue(new Error('db'));
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });
});
