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
import { REQUEST } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SocialNetworkBusinessesService } from './social-network-businesses.service';
import { SocialNetworkBusinessesGettersService } from './social-network-businesses-getters.service';
import { SocialNetworkBusinessesSettersService } from './social-network-businesses-setters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { SocialNetworksGettersService } from '../social-networks/social-networks-getters.service';
import { SocialNetworkBusiness } from '../../entities';
import type { SocialNetwork } from '../../entities';
import type { IBusinessReq } from '../../common/interfaces';

/**
 * Unit tests for {@link SocialNetworkBusinessesService}.
 */
describe('SocialNetworkBusinessesService', () => {
  const gettersMock = {
    findOne: jest.fn(),
    findByBusiness: jest.fn(),
    checkIfExistsByIdBusinessAndSocialNetwork: jest.fn(),
  };
  const settersMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const businessesGettersMock = {
    findOne: jest.fn(),
  };
  const socialNetworksGettersMock = {
    findById: jest.fn(),
  };
  let service: SocialNetworkBusinessesService;
  const businessReq: IBusinessReq = { businessId: 7, path: '/shop' };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        SocialNetworkBusinessesService,
        { provide: REQUEST, useValue: {} },
        {
          provide: getRepositoryToken(SocialNetworkBusiness),
          useValue: {},
        },
        {
          provide: SocialNetworkBusinessesGettersService,
          useValue: gettersMock,
        },
        {
          provide: SocialNetworkBusinessesSettersService,
          useValue: settersMock,
        },
        {
          provide: BusinessesGettersService,
          useValue: businessesGettersMock,
        },
        {
          provide: SocialNetworksGettersService,
          useValue: socialNetworksGettersMock,
        },
      ],
    }).compile();
    service = await moduleRef.resolve(SocialNetworkBusinessesService);
  });

  describe('findByBusiness', () => {
    it('delegates to getters', async () => {
      const list: SocialNetworkBusiness[] = [];
      gettersMock.findByBusiness.mockResolvedValue(list);
      await expect(service.findByBusiness(1)).resolves.toBe(list);
    });
  });

  describe('create', () => {
    it('creates and returns loaded entity', async () => {
      const socialNetwork = {
        id: 2,
        code: 'instagram',
      } as SocialNetwork;
      const created = { id: 9, idSocialNetwork: 2 } as SocialNetworkBusiness;
      const loaded = { id: 9 } as SocialNetworkBusiness;
      businessesGettersMock.findOne.mockResolvedValue({ id: 7 });
      socialNetworksGettersMock.findById.mockResolvedValue(socialNetwork);
      gettersMock.checkIfExistsByIdBusinessAndSocialNetwork.mockResolvedValue(
        false,
      );
      settersMock.create.mockResolvedValue(created);
      gettersMock.findOne.mockResolvedValue(loaded);
      const result = await service.create(
        {
          idSocialNetwork: 2,
          contact: { url: 'https://instagram.com/x', phone: '' },
        },
        businessReq,
      );
      expect(result).toBe(loaded);
      expect(settersMock.create).toHaveBeenCalled();
    });
  });
});
