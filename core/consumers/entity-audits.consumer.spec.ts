import { Job } from 'bullmq';
import { EntityAuditsConsumer } from './entity-audits.consumer';
import { EntityAuditsSettersService } from '../modules/entity-audits/entity-audits-setters.service';
import { EntityAuditsConsumerEnum } from '../common/enums/consumers';
import {
  AuditOperationEnum,
  AuditableEntityNameEnum,
} from '../common/enums';

/**
 * Unit tests for {@link EntityAuditsConsumer}.
 */
describe('EntityAuditsConsumer', () => {
  let consumer: EntityAuditsConsumer;
  const entityAuditsSettersServiceMock = {
    record: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new EntityAuditsConsumer(
      entityAuditsSettersServiceMock as unknown as EntityAuditsSettersService,
    );
  });

  it('records audit when required fields are present', async () => {
    const userOrBusinessReq = { userId: 9, username: 'u' };
    const job = {
      id: '1',
      name: EntityAuditsConsumerEnum.RecordAudit,
      data: {
        entityName: AuditableEntityNameEnum.Product,
        entityId: 3,
        operation: AuditOperationEnum.INSERT,
        oldValues: null,
        newValues: { title: 'x' },
        userOrBusinessReq,
      },
    } as Job;
    await consumer.process(job);
    expect(entityAuditsSettersServiceMock.record).toHaveBeenCalledWith(
      {
        entityName: AuditableEntityNameEnum.Product,
        entityId: 3,
        operation: AuditOperationEnum.INSERT,
        oldValues: null,
        newValues: { title: 'x' },
      },
      userOrBusinessReq,
    );
  });

  it('skips when entityName is missing', async () => {
    const job = {
      id: '2',
      name: EntityAuditsConsumerEnum.RecordAudit,
      data: {
        entityId: 1,
        userOrBusinessReq: { userId: 1, username: 'u' },
      },
    } as Job;
    await consumer.process(job);
    expect(entityAuditsSettersServiceMock.record).not.toHaveBeenCalled();
  });

  it('skips when neither businessId nor userId is set', async () => {
    const job = {
      id: '3',
      name: EntityAuditsConsumerEnum.RecordAudit,
      data: {
        entityName: AuditableEntityNameEnum.Product,
        entityId: 1,
        operation: AuditOperationEnum.UPDATE,
        userOrBusinessReq: { path: '' },
      },
    } as Job;
    await consumer.process(job);
    expect(entityAuditsSettersServiceMock.record).not.toHaveBeenCalled();
  });
});
