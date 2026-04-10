import { SocialNetworkBusinessesResolver } from './social-network-businesses.resolver';
import { SocialNetworkBusinessesService } from '../../../../core/modules/social-network-businesses/social-network-businesses.service';
import type { CreateSocialNetworkBusinessInput } from '../../../../core/modules/social-network-businesses/dto/create-social-network-business.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link SocialNetworkBusinessesResolver}.
 */
describe('SocialNetworkBusinessesResolver', () => {
  let resolver: SocialNetworkBusinessesResolver;
  const serviceMock = {
    create: jest.fn(),
    findByBusiness: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new SocialNetworkBusinessesResolver(
      serviceMock as unknown as SocialNetworkBusinessesService,
    );
  });

  it('create maps entity', async () => {
    const data = {} as CreateSocialNetworkBusinessInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const row = { id: 2 };
    serviceMock.create.mockResolvedValue(row);
    const out = await resolver.create(data, businessReq);
    expect(serviceMock.create).toHaveBeenCalledWith(data, businessReq);
    expect(out).toBe(row);
  });

  it('findByBusiness maps list for public id', async () => {
    const rows = [{ id: 1 }];
    serviceMock.findByBusiness.mockResolvedValue(rows);
    const out = await resolver.findByBusiness(5);
    expect(serviceMock.findByBusiness).toHaveBeenCalledWith(5);
    expect(out).toEqual(rows);
  });

  it('remove delegates to service', async () => {
    const businessReq = { businessId: 1 } as IBusinessReq;
    serviceMock.remove.mockResolvedValue(true);
    await expect(resolver.remove(9, businessReq)).resolves.toBe(true);
  });
});
