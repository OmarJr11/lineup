jest.mock('typeorm-transactional-cls-hooked', () => {
  const actual =
    jest.requireActual<typeof import('typeorm-transactional-cls-hooked')>(
      'typeorm-transactional-cls-hooked',
    );
  return {
    ...actual,
    Transactional:
      () =>
      (
        _target: object,
        _propertyKey: string | symbol,
        descriptor: PropertyDescriptor,
      ): PropertyDescriptor =>
        descriptor,
  };
});

import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StockMovementsSettersService } from './stock-movements-setters.service';
import { StockMovement } from '../../entities';
import { StockMovementTypeEnum } from '../../common/enums/stock-movement-type.enum';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link StockMovementsSettersService}.
 */
describe('StockMovementsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
    metadata: {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'idProductSku' },
        { propertyName: 'idCreationBusiness' },
        { propertyName: 'type' },
        { propertyName: 'quantityDelta' },
        { propertyName: 'previousQuantity' },
        { propertyName: 'newQuantity' },
        { propertyName: 'price' },
        { propertyName: 'notes' },
        { propertyName: 'status' },
      ],
    },
  };
  let service: StockMovementsSettersService;
  const businessReq: IBusinessReq = { businessId: 12, path: '/b' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsSettersService,
        {
          provide: getRepositoryToken(StockMovement),
          useValue: repositoryMock,
        },
      ],
    }).compile();
    service = moduleRef.get(StockMovementsSettersService);
  });

  describe('create', () => {
    it('merges business id and saves', async () => {
      const saved = {
        id: 20,
        idProductSku: 3,
        idCreationBusiness: 12,
        type: StockMovementTypeEnum.ADJUSTMENT_IN,
      } as StockMovement;
      repositoryMock.save.mockImplementation((payload: object) =>
        Promise.resolve(saved),
      );
      const data = {
        idProductSku: 3,
        type: StockMovementTypeEnum.ADJUSTMENT_IN,
        quantityDelta: 1,
        previousQuantity: 5,
        newQuantity: 6,
      };
      const result = await service.create(data, businessReq);
      expect(result).toBe(saved);
      expect(repositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          ...data,
          idCreationBusiness: 12,
        }),
        expect.objectContaining({ data: businessReq }),
      );
    });
    it('throws InternalServerErrorException when save fails', async () => {
      repositoryMock.save.mockRejectedValue(new Error('db'));
      await expect(
        service.create(
          {
            idProductSku: 1,
            type: StockMovementTypeEnum.SALE,
            quantityDelta: -1,
            previousQuantity: 10,
            newQuantity: 9,
          },
          businessReq,
        ),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
