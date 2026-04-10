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

import { BadRequestException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { VisitsService } from './visits.service';
import { BusinessVisitsSettersService } from '../business-visits/business-visits-setters.service';
import { ProductVisitsSettersService } from '../product-visits/product-visits-setters.service';
import { CatalogVisitsSettersService } from '../catalog-visits/catalog-visits-setters.service';
import {
  QueueNamesEnum,
  SearchDataConsumerEnum,
  VisitTypeEnum,
} from '../../common/enums';
import type { IUserReq } from '../../common/interfaces';

/**
 * Unit tests for {@link VisitsService}.
 */
describe('VisitsService', () => {
  let service: VisitsService;
  const businessVisitsMock = { create: jest.fn() };
  const productVisitsMock = { create: jest.fn() };
  const catalogVisitsMock = { create: jest.fn() };
  const queueAddMock = jest.fn();
  const userReq: IUserReq = { userId: 1, username: 'v' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VisitsService,
        {
          provide: BusinessVisitsSettersService,
          useValue: businessVisitsMock,
        },
        {
          provide: ProductVisitsSettersService,
          useValue: productVisitsMock,
        },
        {
          provide: CatalogVisitsSettersService,
          useValue: catalogVisitsMock,
        },
        {
          provide: getQueueToken(QueueNamesEnum.searchData),
          useValue: { add: queueAddMock },
        },
      ],
    }).compile();
    service = moduleRef.get(VisitsService);
  });

  describe('recordVisit', () => {
    it('records business visit and enqueues search job', async () => {
      businessVisitsMock.create.mockResolvedValue(undefined);
      queueAddMock.mockResolvedValue(undefined);
      await service.recordVisit(
        { type: VisitTypeEnum.BUSINESS, id: 9 },
        userReq,
      );
      expect(businessVisitsMock.create).toHaveBeenCalledWith(
        { idBusiness: 9 },
        userReq,
      );
      expect(queueAddMock).toHaveBeenCalledWith(
        SearchDataConsumerEnum.SearchDataVisitRecord,
        { type: VisitTypeEnum.BUSINESS, id: 9 },
      );
    });

    it('records product visit', async () => {
      productVisitsMock.create.mockResolvedValue(undefined);
      queueAddMock.mockResolvedValue(undefined);
      await service.recordVisit(
        { type: VisitTypeEnum.PRODUCT, id: 3 },
        null,
      );
      expect(productVisitsMock.create).toHaveBeenCalledWith(
        { idProduct: 3 },
        null,
      );
    });

    it('records catalog visit', async () => {
      catalogVisitsMock.create.mockResolvedValue(undefined);
      queueAddMock.mockResolvedValue(undefined);
      await service.recordVisit(
        { type: VisitTypeEnum.CATALOG, id: 7 },
        userReq,
      );
      expect(catalogVisitsMock.create).toHaveBeenCalledWith(
        { idCatalog: 7 },
        userReq,
      );
    });

    it('throws BadRequestException for unknown visit type', async () => {
      await expect(
        service.recordVisit(
          { type: 'UNKNOWN' as VisitTypeEnum, id: 1 },
          userReq,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
