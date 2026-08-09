import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductVariationsService } from './product-variations.service';
import { ProductVariation } from '../../entities';

/**
 * Unit tests for {@link ProductVariationsService}.
 */
describe('ProductVariationsService', () => {
  const repositoryMock = {};
  let service: ProductVariationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ProductVariationsService,
        {
          provide: REQUEST,
          useValue: { headers: {}, user: { businessId: 1 } },
        },
        {
          provide: getRepositoryToken(ProductVariation),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(ProductVariationsService);
  });

  it('resolves with repository and request injected', () => {
    expect(service).toBeInstanceOf(ProductVariationsService);
  });
});
