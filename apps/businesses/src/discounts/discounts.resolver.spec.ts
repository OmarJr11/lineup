import { DiscountsResolver } from './discounts.resolver';
import { DiscountsService } from '../../../../core/modules/discounts/discounts.service';
import type { CreateDiscountInput } from '../../../../core/modules/discounts/dto/create-discount.input';
import type { FindDiscountsByScopeInput } from '../../../../core/modules/discounts/dto/find-discounts-by-scope.input';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { IBusinessReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link DiscountsResolver}.
 */
describe('DiscountsResolver', () => {
  let resolver: DiscountsResolver;
  const discountsServiceMock = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findOne: jest.fn(),
    findAllMyDiscountsByScope: jest.fn(),
    findActiveDiscountByProduct: jest.fn(),
    findAuditByProduct: jest.fn(),
    findAuditByDiscount: jest.fn(),
  };

  const businessReq = { businessId: 8 } as IBusinessReq;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new DiscountsResolver(
      discountsServiceMock as unknown as DiscountsService,
    );
  });

  it('create maps discount entity', async () => {
    const data = {} as CreateDiscountInput;
    const entity = { id: 1 };
    discountsServiceMock.create.mockResolvedValue(entity);
    const out = await resolver.create(data, businessReq);
    expect(discountsServiceMock.create).toHaveBeenCalledWith(data, businessReq);
    expect(out).toBe(entity);
  });

  it('remove calls service and returns true', async () => {
    discountsServiceMock.remove.mockResolvedValue(undefined);
    await expect(resolver.remove(3, businessReq)).resolves.toBe(true);
    expect(discountsServiceMock.remove).toHaveBeenCalledWith(3, businessReq);
  });

  it('findAllMyDiscountsByScope returns paginated items', async () => {
    const data = {} as FindDiscountsByScopeInput;
    const pagination = { page: 1, limit: 5 } as InfinityScrollInput;
    const page = {
      items: [{ id: 1 }],
      total: 1,
      page: 1,
      limit: 5,
    };
    discountsServiceMock.findAllMyDiscountsByScope.mockResolvedValue(page);
    const out = await resolver.findAllMyDiscountsByScope(
      data,
      pagination,
      businessReq,
    );
    expect(out.total).toBe(1);
    expect(out.items).toEqual([{ id: 1 }]);
  });

  it('findActiveDiscountByProduct returns null when missing', async () => {
    discountsServiceMock.findActiveDiscountByProduct.mockResolvedValue(null);
    await expect(
      resolver.findActiveDiscountByProduct(9, businessReq),
    ).resolves.toBeNull();
  });
});
