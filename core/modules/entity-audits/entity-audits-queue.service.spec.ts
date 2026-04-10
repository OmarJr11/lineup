import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { EntityAuditsQueueService } from './entity-audits-queue.service';
import {
  EntityAuditsConsumerEnum,
  QueueNamesEnum,
} from '../../common/enums/consumers';
import type { RecordEntityAuditJobData } from '../../consumers/entity-audits.consumer';
import { AuditOperationEnum, AuditableEntityNameEnum } from '../../common/enums';

/**
 * Unit tests for {@link EntityAuditsQueueService}.
 */
describe('EntityAuditsQueueService', () => {
  let service: EntityAuditsQueueService;
  const addMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EntityAuditsQueueService,
        {
          provide: getQueueToken(QueueNamesEnum.entityAudits),
          useValue: { add: addMock },
        },
      ],
    }).compile();
    service = moduleRef.get(EntityAuditsQueueService);
  });

  describe('addRecordJob', () => {
    it('enqueues RecordAudit job with payload', async () => {
      addMock.mockResolvedValue(undefined);
      const payload = {
        entityName: AuditableEntityNameEnum.User,
        entityId: 42,
        operation: AuditOperationEnum.UPDATE,
        userOrBusinessReq: { userId: 1, username: 'admin' },
      } as RecordEntityAuditJobData;
      await expect(service.addRecordJob(payload)).resolves.toBeUndefined();
      expect(addMock).toHaveBeenCalledWith(
        EntityAuditsConsumerEnum.RecordAudit,
        payload,
      );
    });
  });
});
