import { BusinessHoursResolver } from './business-hours.resolver';
import { BusinessHoursService } from '../../../../core/modules/business-hours/business-hours.service';
import type { CreateBusinessHoursInput } from '../../../../core/modules/business-hours/dto/create-business-hours.input';
import type { UpdateBusinessHourInput } from '../../../../core/modules/business-hours/dto/update-business-hour.input';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link BusinessHoursResolver}.
 */
describe('BusinessHoursResolver', () => {
  let resolver: BusinessHoursResolver;
  const businessHoursServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAllMyBusinessHours: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new BusinessHoursResolver(
      businessHoursServiceMock as unknown as BusinessHoursService,
    );
  });

  it('create maps slots', async () => {
    const data = {} as CreateBusinessHoursInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const rows = [{ id: 1 }];
    businessHoursServiceMock.create.mockResolvedValue(rows);
    const out = await resolver.create(data, businessReq);
    expect(businessHoursServiceMock.create).toHaveBeenCalledWith(
      data,
      businessReq,
    );
    expect(out).toEqual(rows);
  });

  it('findAllMyBusinessHours maps schedule', async () => {
    const businessReq = { businessId: 2 } as IBusinessReq;
    const rows = [{ id: 3 }];
    businessHoursServiceMock.findAllMyBusinessHours.mockResolvedValue(rows);
    const out = await resolver.findAllMyBusinessHours(businessReq);
    expect(businessHoursServiceMock.findAllMyBusinessHours).toHaveBeenCalledWith(
      businessReq,
    );
    expect(out).toEqual(rows);
  });

  it('update maps single slot', async () => {
    const data = {} as UpdateBusinessHourInput;
    const businessReq = { businessId: 1 } as IBusinessReq;
    const row = { id: 4 };
    businessHoursServiceMock.update.mockResolvedValue(row);
    const out = await resolver.update(data, businessReq);
    expect(out).toBe(row);
  });
});
