import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductFilesService } from './product-files.service';
import { ProductFile } from '../../entities';

/**
 * Unit tests for {@link ProductFilesService}.
 */
describe('ProductFilesService', () => {
  const repositoryMock = {};
  let service: ProductFilesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductFilesService,
        {
          provide: REQUEST,
          useValue: { headers: {}, user: { businessId: 1 } },
        },
        {
          provide: getRepositoryToken(ProductFile),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(ProductFilesService);
  });

  it('resolves with repository and request injected', () => {
    expect(service).toBeInstanceOf(ProductFilesService);
  });
});
