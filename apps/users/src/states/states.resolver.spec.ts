import { StatesResolver } from './states.resolver';
import { StatesService } from '../../../../core/modules/states/states.service';

/**
 * Unit tests for {@link StatesResolver}.
 */
describe('StatesResolver', () => {
  let resolver: StatesResolver;
  const statesServiceMock = {
    findAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new StatesResolver(
      statesServiceMock as unknown as StatesService,
    );
  });

  it('findAll maps states', async () => {
    const rows = [{ id: 1, name: 'X' }];
    statesServiceMock.findAll.mockResolvedValue(rows);
    const out = await resolver.findAll();
    expect(statesServiceMock.findAll).toHaveBeenCalled();
    expect(out).toEqual(rows);
  });
});
