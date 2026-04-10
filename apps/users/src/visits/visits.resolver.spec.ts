import { VisitsResolver } from './visits.resolver';
import { VisitsService } from '../../../../core/modules/visits/visits.service';
import { VisitTypeEnum } from '../../../../core/common/enums';
import type { IUserReq } from '../../../../core/common/interfaces';
import type { RecordVisitInput } from './dto/record-visit.input';

/**
 * Unit tests for {@link VisitsResolver}.
 */
describe('VisitsResolver', () => {
  let resolver: VisitsResolver;
  const visitsServiceMock = {
    recordVisit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new VisitsResolver(visitsServiceMock as unknown as VisitsService);
  });

  describe('recordVisit', () => {
    it('delegates to VisitsService and returns true', async () => {
      const input: RecordVisitInput = {
        type: VisitTypeEnum.BUSINESS,
        id: 9,
      };
      const user: IUserReq | null = { userId: 1, username: 'u' };
      visitsServiceMock.recordVisit.mockResolvedValue(undefined);
      await expect(resolver.recordVisit(input, user)).resolves.toBe(true);
      expect(visitsServiceMock.recordVisit).toHaveBeenCalledWith(input, user);
    });

    it('passes null user for anonymous visits', async () => {
      const input: RecordVisitInput = {
        type: VisitTypeEnum.PRODUCT,
        id: 3,
      };
      visitsServiceMock.recordVisit.mockResolvedValue(undefined);
      await resolver.recordVisit(input, null);
      expect(visitsServiceMock.recordVisit).toHaveBeenCalledWith(input, null);
    });
  });
});
