import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementsGettersService } from './stock-movements-getters.service';
import { StockMovementsSettersService } from './stock-movements-setters.service';
import { StockMovement } from '../../entities';
import { StockMovementTypeEnum } from '../../common/enums/stock-movement-type.enum';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link StockMovementsService}.
 */
describe('StockMovementsService', () => {
  const gettersMock = {
    findAllByProductSku: jest.fn(),
    findAllByBusiness: jest.fn(),
    countByBusiness: jest.fn(),
  };
  const settersMock = {
    create: jest.fn(),
  };
  let service: StockMovementsService;
  const businessReq: IBusinessReq = { businessId: 3, path: '/shop' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsService,
        {
          provide: StockMovementsGettersService,
          useValue: gettersMock,
        },
        {
          provide: StockMovementsSettersService,
          useValue: settersMock,
        },
      ],
    }).compile();
    service = moduleRef.get(StockMovementsService);
  });

  describe('create', () => {
    it('delegates to setters', async () => {
      const row = { id: 1 } as StockMovement;
      settersMock.create.mockResolvedValue(row);
      const data = {
        idProductSku: 9,
        type: StockMovementTypeEnum.PURCHASE,
        quantityDelta: 5,
        previousQuantity: 0,
        newQuantity: 5,
      };
      await expect(service.create(data, businessReq)).resolves.toBe(row);
      expect(settersMock.create).toHaveBeenCalledWith(data, businessReq);
    });
  });

  describe('findAllByProductSku', () => {
    it('delegates to getters with limit', async () => {
      const list: StockMovement[] = [];
      gettersMock.findAllByProductSku.mockResolvedValue(list);
      await expect(service.findAllByProductSku(8, 25)).resolves.toBe(list);
      expect(gettersMock.findAllByProductSku).toHaveBeenCalledWith(8, 25);
    });
  });

  describe('findAllByBusiness', () => {
    it('delegates to getters with pagination args', async () => {
      const list: StockMovement[] = [];
      gettersMock.findAllByBusiness.mockResolvedValue(list);
      await expect(service.findAllByBusiness(4, 10, 20)).resolves.toBe(list);
      expect(gettersMock.findAllByBusiness).toHaveBeenCalledWith(4, 10, 20);
    });
  });

  describe('countByBusiness', () => {
    it('delegates to getters', async () => {
      gettersMock.countByBusiness.mockResolvedValue(99);
      await expect(service.countByBusiness(2)).resolves.toBe(99);
    });
  });
});
