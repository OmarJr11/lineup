import { CollectionsResolver } from './collections.resolver';
import { ProductCollectionsService } from '../../../../core/modules/product-collections/product-collections.service';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Unit tests for {@link CollectionsResolver}.
 */
describe('CollectionsResolver', () => {
  let resolver: CollectionsResolver;
  const productCollectionsServiceMock = {
    getCollections: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new CollectionsResolver(
      productCollectionsServiceMock as unknown as ProductCollectionsService,
    );
  });

  it('maps collections and products with toProductSchema', async () => {
    productCollectionsServiceMock.getCollections.mockResolvedValue([
      {
        id: 1,
        title: 'For you',
        products: [{ id: 10 }],
      },
    ]);
    const out = await resolver.getProductCollections({ userId: 2 } as IUserReq);
    expect(productCollectionsServiceMock.getCollections).toHaveBeenCalledWith(
      2,
    );
    expect(out).toEqual([
      {
        id: 1,
        title: 'For you',
        products: [{ id: 10, price: null }],
      },
    ]);
  });

  it('uses null user id when anonymous', async () => {
    productCollectionsServiceMock.getCollections.mockResolvedValue([]);
    await resolver.getProductCollections(undefined);
    expect(productCollectionsServiceMock.getCollections).toHaveBeenCalledWith(
      null,
    );
  });
});
