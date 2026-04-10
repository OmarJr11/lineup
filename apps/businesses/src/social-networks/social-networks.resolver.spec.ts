import { SocialNetworksResolver } from './social-networks.resolver';
import { SocialNetworksService } from '../../../../core/modules/social-networks/social-networks.service';
import { SocialMediasEnum } from '../../../../core/common/enums';

/**
 * Unit tests for {@link SocialNetworksResolver}.
 */
describe('SocialNetworksResolver', () => {
  let resolver: SocialNetworksResolver;
  const serviceMock = {
    findById: jest.fn(),
    findByCode: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new SocialNetworksResolver(
      serviceMock as unknown as SocialNetworksService,
    );
  });

  it('findById maps row', async () => {
    const row = { id: 1 };
    serviceMock.findById.mockResolvedValue(row);
    const out = await resolver.findById(1);
    expect(serviceMock.findById).toHaveBeenCalledWith(1);
    expect(out).toBe(row);
  });

  it('findByCode maps row', async () => {
    const row = { id: 2 };
    serviceMock.findByCode.mockResolvedValue(row);
    const out = await resolver.findByCode(SocialMediasEnum.INSTAGRAM);
    expect(serviceMock.findByCode).toHaveBeenCalledWith(
      SocialMediasEnum.INSTAGRAM,
    );
    expect(out).toBe(row);
  });

  it('findAll maps list', async () => {
    const rows = [{ id: 1 }];
    serviceMock.findAll.mockResolvedValue(rows);
    const out = await resolver.findAll();
    expect(out).toEqual(rows);
  });
});
