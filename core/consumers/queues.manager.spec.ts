import { QueueNamesEnum } from '../common/enums';
import { QueuesManager } from './queues.manager';

/**
 * Unit tests for {@link QueuesManager} static API and queue registration helper.
 */
describe('QueuesManager', () => {
  it('queueNames maps every logical key to QueueNamesEnum', () => {
    const names = QueuesManager.queueNames;
    expect(names.cache).toBe(QueueNamesEnum.cache);
    expect(names.catalogs).toBe(QueueNamesEnum.catalogs);
    expect(Object.keys(names).length).toBeGreaterThanOrEqual(10);
  });

  it('queuesForImport returns one module entry per named queue', () => {
    const imports = QueuesManager.queuesForImport();
    expect(imports.length).toBe(Object.keys(QueuesManager.queueNames).length);
    expect(imports.length).toBeGreaterThan(0);
  });
});
