import { BusinessHoursResolver } from './business-hours.resolver';
import { BusinessHoursService } from '../../../../core/modules/business-hours/business-hours.service';

/**
 * Unit tests for {@link BusinessHoursResolver} (users app).
 */
describe('BusinessHoursResolver (users)', () => {
  let resolver: BusinessHoursResolver;
  const businessHoursServiceMock = {
    findAllByBusiness: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new BusinessHoursResolver(
      businessHoursServiceMock as unknown as BusinessHoursService,
    );
  });

  it('findByBusiness maps slots', async () => {
    const rows = [{ id: 1 }];
    businessHoursServiceMock.findAllByBusiness.mockResolvedValue(rows);
    const out = await resolver.findByBusiness(4);
    expect(businessHoursServiceMock.findAllByBusiness).toHaveBeenCalledWith(4);
    expect(out).toEqual(rows);
  });
});
