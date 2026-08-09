import { LocationsResolver } from './locations.resolver';
import { LocationsService } from '../../../../core/modules/locations/locations.service';
import type { CreateLocationInput } from '../../../../core/modules/locations/dto/create-location.input';
import type { UpdateLocationInput } from '../../../../core/modules/locations/dto/update-location.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link LocationsResolver}.
 */
describe('LocationsResolver', () => {
  let resolver: LocationsResolver;
  const locationsServiceMock = {
    create: jest.fn(),
    findAllMyLocations: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new LocationsResolver(
      locationsServiceMock as unknown as LocationsService,
    );
  });

  it('create delegates to service and maps result', async () => {
    const data = {} as CreateLocationInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const entity = { id: 2 };
    locationsServiceMock.create.mockResolvedValue(entity);
    const out = await resolver.create(data, businessReq);
    expect(locationsServiceMock.create).toHaveBeenCalledWith(data, businessReq);
    expect(out).toBe(entity);
  });

  it('findAllMyLocations maps list', async () => {
    const businessReq = { businessId: 1 } as IBusinessReq;
    const rows = [{ id: 1 }];
    locationsServiceMock.findAllMyLocations.mockResolvedValue(rows);
    const out = await resolver.findAllMyLocations(businessReq);
    expect(locationsServiceMock.findAllMyLocations).toHaveBeenCalledWith(
      businessReq,
    );
    expect(out).toEqual(rows);
  });

  it('remove delegates to service', async () => {
    const businessReq = { businessId: 1 } as IBusinessReq;
    locationsServiceMock.remove.mockResolvedValue(true);
    await expect(resolver.remove(5, businessReq)).resolves.toBe(true);
    expect(locationsServiceMock.remove).toHaveBeenCalledWith(5, businessReq);
  });
});
