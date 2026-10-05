import { QueueNamesEnum } from '../common/enums';
import { QueuesManager } from './queues.manager';

/**
 * Unit tests for {@link QueuesManager}.
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

  describe('instance and methods', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    const createMockQueue = (name: string, isPaused = false) => ({
      name,
      isPaused: jest.fn().mockResolvedValue(isPaused),
      resume: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
    });

    it('initializes all queues and resumes paused queues', async () => {
      const mockQ = createMockQueue('test-queue', true);
      const manager = new QueuesManager(
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
      );

      expect(manager.queues).toBeDefined();
      expect(Object.keys(manager.queues).length).toBe(11);

      await manager.resumeQueues();
      expect(mockQ.resume).toHaveBeenCalled();
    });

    it('throws error when queue count mismatches', () => {
      const mockQ = createMockQueue('test-queue');
      const spy = jest
        .spyOn(QueuesManager, 'queueNames', 'get')
        .mockReturnValue({
          ...QueuesManager.queueNames,
          extra: 'extraQueue',
        });

      expect(
        () =>
          new QueuesManager(
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
            mockQ as any,
          ),
      ).toThrow('Queues length mismatch! All queues should be loaded');

      spy.mockRestore();
    });

    it('does not resume queues that are not paused', async () => {
      const mockQ = createMockQueue('active-queue', false);
      const manager = new QueuesManager(
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
      );

      await manager.resumeQueues();
      expect(mockQ.resume).not.toHaveBeenCalled();
    });

    it('handles gracefulStop pausing queues and exiting 0', async () => {
      const mockQ = createMockQueue('q1', false);
      const manager = new QueuesManager(
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
      );

      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      await manager.gracefulStop('SIGTERM');
      expect(mockQ.pause).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);
      exitSpy.mockRestore();
    });

    it('handles second signal with exit 1', async () => {
      const mockQ = createMockQueue('q1', false);
      const manager = new QueuesManager(
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
      );

      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      // set sigReceived = true and sigReceiving = false
      (manager as any).sigReceived = true;
      (manager as any).sigReceiving = false;

      await manager.gracefulStop('SIGTERM');
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('ignores signal when already receiving', async () => {
      const mockQ = createMockQueue('q1', false);
      const manager = new QueuesManager(
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
      );

      const exitSpy = jest
        .spyOn(process, 'exit')
        .mockImplementation((() => undefined) as any);

      (manager as any).sigReceiving = true;
      await manager.gracefulStop('SIGTERM');
      expect(exitSpy).not.toHaveBeenCalled();
      exitSpy.mockRestore();
    });

    it('setupGracefulStop registers SIGTERM and SIGINT listeners', () => {
      const mockQ = createMockQueue('q1', false);
      const onSpy = jest.spyOn(process, 'on');

      new QueuesManager(
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
        mockQ as any,
      );

      expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      onSpy.mockRestore();
    });
  });
});
