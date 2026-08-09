import { ProductsResolver } from './products.resolver';
import { ProductReactionsService } from '../../../../core/modules/product-reactions/product-reactions.service';
import { ProductReactionsGettersService } from '../../../../core/modules/product-reactions/product-reactions-getters.service';
import { ProductsService } from '../../../../core/modules/products/products.service';
import { TagsService } from '../../../../core/modules/tags/tags.service';
import { ReactionTypeEnum, StatusEnum } from '../../../../core/common/enums';
import type { InfinityScrollInput } from '../../../../core/common/dtos';
import type { GetAllByTagArgs } from '../../../../core/modules/products/dto/get-all-by-tag.dto';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link ProductsResolver} (users app).
 */
describe('ProductsResolver (users)', () => {
  let resolver: ProductsResolver;
  const productReactionsServiceMock = {
    likeProduct: jest.fn(),
    unlikeProduct: jest.fn(),
  };
  const productReactionsGettersServiceMock = {
    findOneByProductAndUser: jest.fn(),
  };
  const productsServiceMock = {
    findAll: jest.fn(),
    findAllByCatalog: jest.fn(),
    getAllByCatalogPaginated: jest.fn(),
    findAllByBusiness: jest.fn(),
    findAllByBusinessAndIsPrimary: jest.fn(),
    findAllByTag: jest.fn(),
    findAllByTags: jest.fn(),
    findOne: jest.fn(),
  };
  const tagsServiceMock = {
    findMainTags: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new ProductsResolver(
      productReactionsServiceMock as unknown as ProductReactionsService,
      productReactionsGettersServiceMock as unknown as ProductReactionsGettersService,
      productsServiceMock as unknown as ProductsService,
      tagsServiceMock as unknown as TagsService,
    );
  });

  it('findAll returns paginated products with price', async () => {
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    const row = { id: 1 };
    productsServiceMock.findAll.mockResolvedValue([row]);
    const out = await resolver.findAll(pagination);
    expect(out.items).toEqual([{ ...row, price: null }]);
  });

  it('findOne maps product', async () => {
    const row = { id: 5 };
    productsServiceMock.findOne.mockResolvedValue(row);
    const out = await resolver.findOne(5);
    expect(out).toEqual({ ...row, price: null });
  });

  it('getAllByTag passes filters to service', async () => {
    const filters: GetAllByTagArgs = {
      tagNameOrSlug: 'pan',
      idBusiness: 2,
    };
    const pagination = { page: 1, limit: 10 } as InfinityScrollInput;
    productsServiceMock.findAllByTag.mockResolvedValue([]);
    await resolver.getAllByTag(filters, pagination);
    expect(productsServiceMock.findAllByTag).toHaveBeenCalledWith(
      'pan',
      pagination,
      2,
      undefined,
    );
  });

  it('likeProduct maps reaction', async () => {
    const user = { userId: 1 } as IUserReq;
    const reaction = { id: 9 };
    productReactionsServiceMock.likeProduct.mockResolvedValue(reaction);
    const out = await resolver.likeProduct(3, user);
    expect(productReactionsServiceMock.likeProduct).toHaveBeenCalledWith(3, user);
    expect(out).toBe(reaction);
  });

  it('hasLikedProduct is false when no reaction', async () => {
    const user = { userId: 1 } as IUserReq;
    productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
      null,
    );
    await expect(resolver.hasLikedProduct(4, user)).resolves.toBe(false);
  });

  it('hasLikedProduct is false when reaction deleted', async () => {
    const user = { userId: 1 } as IUserReq;
    productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
      { status: StatusEnum.DELETED },
    );
    await expect(resolver.hasLikedProduct(4, user)).resolves.toBe(false);
  });

  it('hasLikedProduct is true when active like exists', async () => {
    const user = { userId: 1 } as IUserReq;
    productReactionsGettersServiceMock.findOneByProductAndUser.mockResolvedValue(
      { status: StatusEnum.ACTIVE },
    );
    await expect(resolver.hasLikedProduct(4, user)).resolves.toBe(true);
    expect(
      productReactionsGettersServiceMock.findOneByProductAndUser,
    ).toHaveBeenCalledWith(4, ReactionTypeEnum.LIKE, 1);
  });

  it('getMainTags maps tags', async () => {
    const tags = [{ id: 1, slug: 'a' }];
    tagsServiceMock.findMainTags.mockResolvedValue(tags);
    const out = await resolver.getMainTags(5);
    expect(tagsServiceMock.findMainTags).toHaveBeenCalledWith(5);
    expect(out).toEqual(tags);
  });
});
