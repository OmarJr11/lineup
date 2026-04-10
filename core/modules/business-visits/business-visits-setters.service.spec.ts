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

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessVisitsSettersService } from './business-visits-setters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessesSettersService } from '../businesses/businesses-setters.service';
import { BusinessVisit, Business } from '../../entities';

/**
 * Unit tests for {@link BusinessVisitsSettersService}.
 */
describe('BusinessVisitsSettersService', () => {
  const repositoryMock = {
    save: jest.fn(),
  };
  const businessesGettersServiceMock = {
    findOne: jest.fn(),
  };
  const businessesSettersServiceMock = {
    incrementVisits: jest.fn(),
  };
  let service: BusinessVisitsSettersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repositoryMock.save.mockImplementation((entity: BusinessVisit) =>
      Promise.resolve(entity),
    );
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessVisitsSettersService,
        {
          provide: getRepositoryToken(BusinessVisit),
          useValue: repositoryMock,
        },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersServiceMock,
        },
        {
          provide: BusinessesSettersService,
          useValue: businessesSettersServiceMock,
        },
      ],
    }).compile();
    service = moduleRef.get(BusinessVisitsSettersService);
  });

  describe('create', () => {
    it('loads business, saves visit, increments visit counter', async () => {
      const business = { id: 9 } as Business;
      businessesGettersServiceMock.findOne.mockResolvedValue(business);
      await service.create({ idBusiness: 9 }, { userId: 3, username: 'u' });
      expect(businessesGettersServiceMock.findOne).toHaveBeenCalledWith(9);
      expect(repositoryMock.save).toHaveBeenCalled();
      expect(businessesSettersServiceMock.incrementVisits).toHaveBeenCalledWith(
        business,
      );
    });
    it('records anonymous visits when user is null', async () => {
      const business = { id: 9 } as Business;
      businessesGettersServiceMock.findOne.mockResolvedValue(business);
      await service.create({ idBusiness: 9 }, null);
      expect(businessesSettersServiceMock.incrementVisits).toHaveBeenCalledWith(
        business,
      );
    });
  });
});
