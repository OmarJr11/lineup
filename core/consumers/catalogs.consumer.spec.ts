import { Job } from 'bullmq';
import { CatalogsConsumer } from './catalogs.consumer';
import { CatalogsSettersService } from '../modules/catalogs/catalogs-setters.service';
import { CatalogsGettersService } from '../modules/catalogs/catalogs-getters.service';
import { CatalogsConsumerEnum } from '../common/enums/consumers';
import { ActionsEnum } from '../common/enums';
import type { IBusinessReq } from '../common/interfaces';

/**
 * Unit tests for {@link CatalogsConsumer}.
 */
describe('CatalogsConsumer', () => {
  let consumer: CatalogsConsumer;
  const catalogsSettersServiceMock = {
    updateProductsCount: jest.fn(),
  };
  const catalogsGettersServiceMock = {
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new CatalogsConsumer(
      catalogsSettersServiceMock as unknown as CatalogsSettersService,
      catalogsGettersServiceMock as unknown as CatalogsGettersService,
    );
  });

  it('updates products count when idCatalog and action are present', async () => {
    const businessReq = { businessId: 1, path: '/b' } as IBusinessReq;
    const catalog = { id: 5 };
    catalogsGettersServiceMock.findOne.mockResolvedValue(catalog);
    const job = {
      id: 'j1',
      name: CatalogsConsumerEnum.UpdateProductsCount,
      data: {
        idCatalog: 5,
        action: ActionsEnum.Increment,
        businessReq,
      },
    } as Job;
    await consumer.process(job);
    expect(catalogsGettersServiceMock.findOne).toHaveBeenCalledWith(5);
    expect(catalogsSettersServiceMock.updateProductsCount).toHaveBeenCalledWith(
      catalog,
      ActionsEnum.Increment,
      businessReq,
    );
  });

  it('skips when idCatalog or action is missing', async () => {
    const job = {
      id: 'j2',
      name: CatalogsConsumerEnum.UpdateProductsCount,
      data: { idCatalog: 0, action: ActionsEnum.Increment, businessReq: {} },
    } as Job;
    await consumer.process(job);
    expect(catalogsGettersServiceMock.findOne).not.toHaveBeenCalled();
  });
});
